---
title: "応答を待つ間に相手が死んでも、待ち続けない仕組み"
description: "gen:do_call/4 は、サーバーへの同期呼び出しの本体。監視とエイリアスを使い、タイムアウトや相手の終了を検出する。遅れて届く応答も、エイリアスで捨てられる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gen.erl
lines: [251, 281]
function: "gen:do_call/4"
difficulty: 3
format: 2
tags: ["並行処理", "エラー処理", "非同期"]
---
## ひとことで

`gen:do_call/4` は、`gen_server` などへ「要求を送り、答えを待つ」処理の中心です。相手のプロセスに要求を送ったあと、応答、相手の終了、タイムアウトのどれかが起きるまで待ちます。
相手がネットワークの先にある場合でも、待ちが永久に続かないよう、監視（monitor）とエイリアス（alias）を組み合わせています。

## コード

::: code-group

```erlang:line-numbers=251 [日本語訳]
do_call(Process, Label, Request, Timeout) when is_atom(Process) =:= false ->
    Mref = erlang:monitor(process, Process, [{alias,demonitor}]),

    Tag = [alias | Mref],

    %% OTP 24 以降: エイリアスを使って、
    %% タイムアウトや noconnection の後に届く応答を防ぐ。
    %% プロセス ID で相手を指定した場合は、
    %% 接続済みの監視を通じて送りたいので、
    %% 送信には noconnect を付けて、自動接続を起こさないようにする。
    %%（補足）
    erlang:send(Process, {Label, {self(), Tag}, Request}, [noconnect]),

    receive
        {[alias | Mref], Reply} ->
            erlang:demonitor(Mref, [flush]),
            {ok, Reply};
        {'DOWN', Mref, _, _, noconnection} ->
            Node = get_node(Process),
            exit({nodedown, Node});
        {'DOWN', Mref, _, _, Reason} ->
            exit(Reason)
    after Timeout ->
            erlang:demonitor(Mref, [flush]),
            receive
                {[alias | Mref], Reply} ->
                    {ok, Reply}
            after 0 ->
                    exit(timeout)
            end
    end.
```

```erlang:line-numbers=251 [原文]
do_call(Process, Label, Request, Timeout) when is_atom(Process) =:= false ->
    Mref = erlang:monitor(process, Process, [{alias,demonitor}]),

    Tag = [alias | Mref],

    %% OTP-24:
    %% Using alias to prevent responses after 'noconnection' and timeouts.
    %% We however still may call nodes responding via process identifier, so
    %% we still use 'noconnect' on send in order to try to send on the
    %% monitored connection, and not trigger a new auto-connect.
    %%
    erlang:send(Process, {Label, {self(), Tag}, Request}, [noconnect]),

    receive
        {[alias | Mref], Reply} ->
            erlang:demonitor(Mref, [flush]),
            {ok, Reply};
        {'DOWN', Mref, _, _, noconnection} ->
            Node = get_node(Process),
            exit({nodedown, Node});
        {'DOWN', Mref, _, _, Reason} ->
            exit(Reason)
    after Timeout ->
            erlang:demonitor(Mref, [flush]),
            receive
                {[alias | Mref], Reply} ->
                    {ok, Reply}
            after 0 ->
                    exit(timeout)
            end
    end.
```

:::

## 前提知識

- **同期呼び出し**: 要求を送ってから、応答が来るまで待つ方式です。`gen_server:call/2` がこれにあたります。
- **プロセスの監視（monitor）**: 相手が終了したときに、`'DOWN'` というメッセージを受け取れる仕組みです。`erlang:monitor/2` で作り、`erlang:demonitor/2` で解除します。
- **エイリアス（alias）**: 一時的な宛先の名前です。ここでは、遅れて届く応答を受け付けない目的で使います。
- **`receive ... after`**: 指定した時間まで待って、届かなければ `after` の枝を実行します。
- **`exit/1`**: 現在のプロセスを、理由付きで終わらせます。呼び出し側に、異常を伝えるために使います。

## 何をしているか

### 1. 送る相手を監視して、要求を送る

```erlang:line-numbers=252
    Mref = erlang:monitor(process, Process, [{alias,demonitor}]),

    Tag = [alias | Mref],
```

まず、相手を監視します。`[{alias, demonitor}]` を付けると、監視を解除したときにエイリアスも自動で無効になります。応答の目印は `[alias | Mref]` です。

```erlang:line-numbers=262
    erlang:send(Process, {Label, {self(), Tag}, Request}, [noconnect]),
```

要求は `noconnect` を付けて送ります。相手のノードへ新しく接続しようとしないためです。接続がなければ、すぐ `noconnection` の終了として扱えます。

### 2. 応答を待つ

```erlang:line-numbers=264
    receive
        {[alias | Mref], Reply} ->
            erlang:demonitor(Mref, [flush]),
            {ok, Reply};
        {'DOWN', Mref, _, _, noconnection} ->
            Node = get_node(Process),
            exit({nodedown, Node});
        {'DOWN', Mref, _, _, Reason} ->
            exit(Reason)
```

応答が届けば、監視を解除して `{ok, Reply}` を返します。相手が `noconnection` で終わったら、ノードが落ちたとみなして `nodedown` で例外を投げます。ほかの理由なら、その理由で例外を投げます。

### 3. タイムアウトしたとき

```erlang:line-numbers=273
    after Timeout ->
            erlang:demonitor(Mref, [flush]),
            receive
                {[alias | Mref], Reply} ->
                    {ok, Reply}
            after 0 ->
                    exit(timeout)
            end
    end.
```

時間切れになったら、まず監視を解除します。その後、ほんの一瞬（`after 0`）だけ、遅れて届いた応答がないかを見ます。届いていれば `{ok, Reply}` を返し、なければ `timeout` の例外を投げます。

## ここがすごい

### 遅れて届く応答を、エイリアスで捨てる

タイムアウトのあとに、相手が応答を送ってしまうことがあります。その応答が、後で別の呼び出しの結果と混ざると、困ったことになります。
エイリアスを使うと、解除された後の応答は受け付けられません。古い応答が届いても、誰も受け取らないので、混ざる事故を防げます。

### 相手が死んだかどうかを、確実に知る

応答を待つ間に相手が終わっても、監視のおかげで `'DOWN'` が届きます。そのため、永久に待ち続けることはありません。
ノードが切れた場合は、`noconnection` を区別して、`nodedown` として呼び出し元に伝えています。

## まとめ

- 同期呼び出しでは、応答・相手の終了・タイムアウトの 3 つを必ず扱います。
- 監視を使うと、相手が死んだときに待ちを止められます。
- エイリアスを使うと、タイムアウトの後に届く古い応答を受け付けずに済みます。
