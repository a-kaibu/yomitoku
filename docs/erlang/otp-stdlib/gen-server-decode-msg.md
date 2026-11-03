---
title: "gen_server が受け取るメッセージを、種類ごとに振り分ける"
description: "gen_server:decode_msg/6 は、gen_server が受け取ったメッセージを、システムメッセージ、親からの終了通知、タイマーの満了、その他に分ける。古いタイマーの通知は読み捨てる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gen_server.erl
lines: [2375, 2390]
function: "gen_server:decode_msg/6"
difficulty: 3
format: 2
tags: ["並行処理", "エラー処理"]
---
## ひとことで

`gen_server:decode_msg/6` は、`gen_server` のプロセスが受け取ったメッセージを、どう扱うかに振り分けます。
デバッグ用のシステムメッセージ、親プロセスからの終了通知、タイムアウトの通知、それ以外のユーザーのメッセージを区別して処理します。

## コード

```erlang:line-numbers=2375
decode_msg(#server_data{parent = Parent, tag = Tag} = ServerData, State, HibT, Debug, Timer, Msg) ->
    case Msg of
        {system, From, Req} ->
            sys:handle_system_msg(Req, From, Parent, ?MODULE, Debug,
                                  [ServerData, State, HibT, Timer], HibT =:= hibernate);
        {'EXIT', Parent, Reason} ->
            terminate(ServerData, State, Msg, undefined, Reason, ?STACKTRACE(), Debug);
	{timeout, TRef, Tag} when TRef =:= hd(Timer) ->
            decode_msg(ServerData, State, tl(Timer), Debug);
	{timeout, _Stale, Tag} ->
	    loop(ServerData, State, HibT, Debug, Timer);
        _ ->
	    cancel_timer(Timer),
            decode_msg(ServerData, State, Msg, Debug)

    end.
```

## 前提知識

- **`gen_server`**: Erlang/OTP のサーバーを作るための仕組みです。メッセージを受け取り、`handle_call` や `handle_cast` で処理します。
- **システムメッセージ**: `sys` モジュールが、動いているプロセスを調べたり、デバッグしたりするために送るメッセージです。`{system, From, Req}` の形をしています。
- **親プロセス**: このプロセスを起動したプロセスです。親が終了すると、子にも終了の通知（`'EXIT'`）が届きます。
- **`'EXIT'` メッセージ**: プロセスが終了したときに、リンクしている相手に届く通知です。
- **`hd` と `tl`**: リストの先頭と、残りを取り出す関数です。ここではタイマーのリストを使います。
- **`=:=`**: 型も含めて等しいかを比べる演算子です。`1 =:= 1.0` は偽です。

## 何をしているか

### 1. システムメッセージ

```erlang:line-numbers=2377
        {system, From, Req} ->
            sys:handle_system_msg(Req, From, Parent, ?MODULE, Debug,
                                  [ServerData, State, HibT, Timer], HibT =:= hibernate);
```

`{system, From, Req}` は、`sys` モジュールからの問い合わせです。この関数は処理せず、`sys:handle_system_msg/7` に渡します。プロセスの状態を調べたり、デバッグモードを切り替えたりする要求です。

### 2. 親プロセスの終了

```erlang:line-numbers=2380
        {'EXIT', Parent, Reason} ->
            terminate(ServerData, State, Msg, undefined, Reason, ?STACKTRACE(), Debug);
```

親プロセスが終了したことを示す `'EXIT'` メッセージが届いたら、`terminate/7` を呼んで、サーバーを止めます。親が終わったのに子が動き続けるのを防ぐための処理です。

### 3. タイムアウトのメッセージ

```erlang:line-numbers=2382
	{timeout, TRef, Tag} when TRef =:= hd(Timer) ->
            decode_msg(ServerData, State, tl(Timer), Debug);
	{timeout, _Stale, Tag} ->
	    loop(ServerData, State, HibT, Debug, Timer);
```

タイマーの満了を知らせるメッセージには、2 種類があります。`hd(Timer)` と一致する最新のタイマーなら、タイマーのリストから次の要素を取り出して、もう一度 `decode_msg/4` を呼びます。
一致しない古いタイマーからのメッセージは、読み捨てて `loop/5` へ戻ります。

### 4. その他のメッセージ

```erlang:line-numbers=2386
        _ ->
	    cancel_timer(Timer),
            decode_msg(ServerData, State, Msg, Debug)
```

上のどれにも当てはまらないものは、ユーザーが扱うメッセージです。まだ待っているタイマーを止めて（`cancel_timer/1`）、`decode_msg/4` でユーザーの `handle_info` へ渡す流れにつなぎます。

## ここがすごい

### 古いタイマーの通知を、一致の確認で捨てる

タイマーは、すでにキャンセルしたあとでも、通知だけが届いてしまうことがあります。この関数は、通知のタイマーが「いちばん新しいタイマーか」を比べて、古いものを無視します。
これにより、キャンセルしたはずのタイマーが、後の処理に影響するのを防ぎます。

### 種類ごとに、扱いを一か所で決める

システムメッセージ、親の終了、タイマー、ユーザーのメッセージを、1 つの `case` で振り分けています。
どの種類の処理も、サーバーの状態（`ServerData`、`State`）を中心に流れるので、読むときは「どの節がどの処理へつながるか」だけを追えば十分です。

## まとめ

- サーバーのメッセージは、システム用、終了通知、タイマー、ユーザー用に分けると、扱いを整理できます。
- 古いタイマーの通知は、いちばん新しいタイマーと比べて捨てます。
- 親の終了を見逃さないことで、親子のプロセスが一緒に止まるようにしています。
