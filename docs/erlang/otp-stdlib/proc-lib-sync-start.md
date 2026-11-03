---
title: "起動の応答を待ち、失敗や時間切れなら後始末をしてから戻る"
description: "proc_lib:sync_start/3 は、子プロセスの起動が成功したという応答を待つ。失敗の応答、子の異常終了、時間切れのどれが来ても、子を確実に終わらせてから結果を返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/proc_lib.erl
lines: [451, 467]
function: "proc_lib:sync_start/3"
difficulty: 3
format: 2
tags: ["並行処理", "エラー処理"]
---
## ひとことで

`proc_lib:sync_start/3` は、`proc_lib` で新しいプロセスを起動した側が、そのプロセスの起動が終わるまで待つための関数です。
子が「起動できた（ack）」と答えれば、その値を返します。失敗や時間切れなら、子を止めたり後始末をしたりしてから、エラーとして返します。

## コード

```erlang:line-numbers=451
sync_start({Pid, Mon}, Tag, Timeout) ->
    receive
        {ack, Tag, Return} ->
            erlang:demonitor(Mon, [flush]),
            Return;
        {nack, Tag, Return} ->
            flush_EXIT(Pid),
            _ = await_DOWN(Pid, Mon, Tag),
            Return;
        {Tag, Mon, process, Pid, Reason} ->
            flush_EXIT(Pid),
            {error, Reason}
    after Timeout ->
            kill_flush_EXIT(Pid),
            _ = await_DOWN(Pid, Mon, Tag),
            {error, timeout}
    end.
```

## 前提知識

- **`proc_lib`**: 新しいプロセスを、OTP の規則に沿って起動するためのモジュールです。
- **`{Pid, Mon}`**: 子プロセスの ID と、その監視の参照です。子が終わったことを、`'DOWN'` メッセージで知れます。
- **`Tag`**: この起動の応答を区別するための目印です。ほかの応答と混ざらないようにします。
- **`flush_EXIT/1`、`await_DOWN/3`、`kill_flush_EXIT/1`**: 子の終了通知を受け取って、後始末をする補助関数です。ここでは詳しく説明しません。
- **`receive ... after`**: 指定の時間まで待ち、届かなければ `after` の枝を実行します。

## 何をしているか

### 1. 起動が成功したとき

```erlang:line-numbers=452
    receive
        {ack, Tag, Return} ->
            erlang:demonitor(Mon, [flush]),
            Return;
```

子が `{ack, Tag, Return}` を送ってきたら、起動は成功です。監視を解除して（`flush` で残った通知も捨てます）、子が返した値 `Return` を返します。

### 2. 起動に失敗したとき

```erlang:line-numbers=456
        {nack, Tag, Return} ->
            flush_EXIT(Pid),
            _ = await_DOWN(Pid, Mon, Tag),
            Return;
```

子が `{nack, Tag, Return}` を送ってきたら、起動を拒否されたことになります。子の終了通知を片付け、子の `'DOWN'` を待ってから、子が返した値を返します。子が確実に終わってから戻るのが特徴です。

### 3. 子が起動の途中で死んだとき

```erlang:line-numbers=460
        {Tag, Mon, process, Pid, Reason} ->
            flush_EXIT(Pid),
            {error, Reason}
```

監視の終了通知が、起動の応答の形で届いたら、子が途中で落ちたということです。`{error, Reason}` を返します。

### 4. 時間切れのとき

```erlang:line-numbers=463
    after Timeout ->
            kill_flush_EXIT(Pid),
            _ = await_DOWN(Pid, Mon, Tag),
            {error, timeout}
```

決められた時間内に応答がなければ、子を止めて（`kill_flush_EXIT/1`）、終了を待ちます。その後で `{error, timeout}` を返します。
時間切れのあとも、子が動き続けることはありません。

## ここがすごい

### 戻る前に、子の生死を必ず確定させる

起動の結果を受け取っても、子が残っていれば、後で予想外の動きをするかもしれません。この関数は、どの経路でも、戻る前に子が終わったことを確認しています。
エラーの処理が、後から子を追いかける必要をなくしています。

### 応答を Tag と監視で区別する

子からの応答と、ほかのメッセージを混同しないように、`Tag` で目印を付けています。さらに、監視の参照 `Mon` を使うと、子が落ちたことも同じ待ちの中で拾えます。
待つ相手が増えても、どの応答がどの起動のものかがはっきりします。

## まとめ

- 起動を待つときは、成功、失敗、途中終了、時間切れの 4 つを必ず扱います。
- エラーで戻る前に、子を確実に終わらせると、後始末の漏れを防げます。
- 応答に目印を付けると、複数の起動が混ざっても判別できます。
