---
title: "サーバーの次の動作を、種類ごとに振り分けて続ける"
description: "gen_server:loop/4 は、次に何をするかを表す値（継続、タイムアウト、ふつうの待ち）を受け取り、種類に応じて処理を続ける。タイムアウトは 0 秒の特別扱いと、タイマー付きの待ちを分けて書かれている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gen_server.erl
lines: [2292, 2311]
function: "gen_server:loop/4"
difficulty: 3
format: 2
tags: ["並行処理", "状態機械", "エラー処理"]
---
## ひとことで

`gen_server:loop/4` は、サーバーのメッセージ待ちの中心です。次の動作を表す値 `LoopAction` を受け取り、どの待ち方をするかを決めます。
継続（`{continue, ...}`）の処理、0 秒のタイムアウト、タイマー付きの待ち、通常の待ちの 4 つに振り分けます。

## コード

::: code-group

```erlang:line-numbers=2292 [日本語訳]
loop(ServerData, State, {continue, Continue} = Msg, Debug) ->
    Reply = try_handle_continue(ServerData, State, Continue),
    From  = undefined,
    case Debug of
        [] ->
            handle_common_reply(ServerData, State, Msg, From, Reply);
        _ ->
            Debug1 = sys:handle_debug(Debug, fun print_event/3, ServerData#server_data.name, Msg),
            handle_common_reply(ServerData, State, Msg, Debug1, From, Reply)
    end;
%% 以下は、次の動作の種類ごとの処理
loop(ServerData, State, LoopAction, Debug) ->
    case LoopAction of
        {timeout_zero, TimeoutMsg} ->
            decode_msg(ServerData, State, infinity, Debug, [], TimeoutMsg);
        {timeout, Timer, HibInf} ->
            loop(ServerData, State, HibInf, Debug, Timer);
        HibT ->
            loop(ServerData, State, HibT, Debug, [])
    end.
```

```erlang:line-numbers=2292 [原文]
loop(ServerData, State, {continue, Continue} = Msg, Debug) ->
    Reply = try_handle_continue(ServerData, State, Continue),
    From  = undefined,
    case Debug of
        [] ->
            handle_common_reply(ServerData, State, Msg, From, Reply);
        _ ->
            Debug1 = sys:handle_debug(Debug, fun print_event/3, ServerData#server_data.name, Msg),
            handle_common_reply(ServerData, State, Msg, Debug1, From, Reply)
    end;
%%
loop(ServerData, State, LoopAction, Debug) ->
    case LoopAction of
        {timeout_zero, TimeoutMsg} ->
            decode_msg(ServerData, State, infinity, Debug, [], TimeoutMsg);
        {timeout, Timer, HibInf} ->
            loop(ServerData, State, HibInf, Debug, Timer);
        HibT ->
            loop(ServerData, State, HibT, Debug, [])
    end.
```

:::

## 前提知識

- **`gen_server`**: メッセージを受け取り、`handle_call`、`handle_cast`、`handle_info` などの関数で処理するサーバーの仕組みです。
- **継続（continue）**: 処理の後で、すぐに続けて行う仕事を表す値です。`handle_continue/2` で受け取ります。
- **タイムアウト**: 一定時間メッセージが来なければ、特別な処理をする仕組みです。
- **タイマー**: タイムアウトを管理する参照です。キャンセルできます。
- **`HibInf`**: 次の待ち方を表す値です。`hibernate`（メモリを減らして眠る）や、`infinity`（無期限に待つ）などがあります。
- **`case ... of`**: 値の形で、処理を振り分けます。

## 何をしているか

### 1. 継続の処理

```erlang:line-numbers=2292
loop(ServerData, State, {continue, Continue} = Msg, Debug) ->
    Reply = try_handle_continue(ServerData, State, Continue),
    From  = undefined,
    case Debug of
        [] ->
            handle_common_reply(ServerData, State, Msg, From, Reply);
        _ ->
            Debug1 = sys:handle_debug(Debug, fun print_event/3, ServerData#server_data.name, Msg),
            handle_common_reply(ServerData, State, Msg, Debug1, From, Reply)
    end;
```

`{continue, Continue}` という値なら、まず `try_handle_continue/3` で継続を実行します。その結果を、`handle_common_reply/5` へ渡します。デバッグが有効なら、先に `sys:handle_debug/4` で記録を残します。

### 2. 0 秒のタイムアウト

```erlang:line-numbers=2304
    case LoopAction of
        {timeout_zero, TimeoutMsg} ->
            decode_msg(ServerData, State, infinity, Debug, [], TimeoutMsg);
```

`{timeout_zero, TimeoutMsg}` は、待たずに、すぐタイムアウトのメッセージを処理します。`decode_msg/6` に、待ち方として `infinity`、タイマーなし（`[]`）、メッセージとして `TimeoutMsg` を渡します。

### 3. タイマー付きの待ち

```erlang:line-numbers=2307
        {timeout, Timer, HibInf} ->
            loop(ServerData, State, HibInf, Debug, Timer);
```

`{timeout, Timer, HibInf}` は、タイマーを持って待つ状態です。`loop/5` に、タイマーの一覧を渡して続けます。

### 4. 通常の待ち

```erlang:line-numbers=2309
        HibT ->
            loop(ServerData, State, HibT, Debug, [])
```

それ以外は、待ち方そのもの（`HibT`）だけを持つ値です。タイマーの一覧を空にして、`loop/5` に渡します。

## ここがすごい

### 次の動作を、値で表して渡す

サーバーの中で、次に何をするかを、関数の呼び出しとしてすぐ実行するのではありません。値として返し、ループで解釈します。
値で表すと、次の動作を途中で差し替えたり、記録したりできます。`gen_server` の動きを柔軟に保つための工夫です。

### 0 秒のタイムアウトを、待たずに扱う

タイムアウトが 0 秒なら、待つ必要はありません。この関数は、そのことを独立した節で表し、メッセージを待たずに処理します。
「待ち時間が 0 のときだけ特別な経路を通る」と分けて書くことで、後から読んでも意図が分かりやすくなります。

## まとめ

- サーバーの次の動作は、値として受け取り、種類ごとに振り分けると、流れが明確になります。
- 待ち時間が 0 の場合は、待たずに済む特別な経路で処理できます。
- タイマーの有無で待ち方を分けると、状態の管理がはっきりします。
