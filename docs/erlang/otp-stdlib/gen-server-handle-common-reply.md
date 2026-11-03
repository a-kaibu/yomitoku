---
title: "サーバーのコールバックの戻り値を、次の動作へ読み替える"
description: "gen_server の handle_common_reply/5 は、handle_call などのコールバックが返した値を調べ、続けて待つか、止めるか、エラーにするかを決める。想定外の戻り値も、必ず終了の経路に入れる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gen_server.erl
lines: [2552, 2569]
function: "gen_server:handle_common_reply/5"
difficulty: 3
format: 2
tags: ["並行処理", "エラー処理", "状態機械"]
---
## ひとことで

`handle_common_reply/5` は、サーバーのコールバック（`handle_call` や `handle_info` など）が返した結果を受け取り、次にどうするかを決めます。
続けて待つのか、止めるのか、戻り値が不正なのかを判断します。判断の結果は、前に見た `loop/4` に渡される `LoopAction` などの値で表されます。

## コード

```erlang:line-numbers=2552
handle_common_reply(ServerData, State, Msg, From, Reply) ->
    case Reply of
	{ok, {noreply, NState}} ->
	    loop(ServerData, NState, infinity, []);
	{ok, {noreply, NState, Action} = Return} ->
            case handle_action(ServerData, Action) of
		error ->
		    terminate(ServerData, State, Msg, From, {bad_return_value, Return}, ?STACKTRACE(), []);
                LoopAction ->
                    loop(ServerData, NState, LoopAction, [])
	    end;
	{ok, {stop, Reason, NState}} ->
	    terminate(ServerData, NState, Msg, From, Reason, ?STACKTRACE(), []);
	{'EXIT', Class, Reason, Stacktrace} ->
	    terminate(ServerData, State, Msg, From, Class, Reason, Stacktrace, []);
	{ok, BadReturn} ->
	    terminate(ServerData, State, Msg, From, {bad_return_value, BadReturn}, ?STACKTRACE(), [])
    end.
```

## 前提知識

- **コールバックの戻り値**: 利用者が書く関数は、`{noreply, State}` や `{stop, Reason, State}` のような決まった形の値を返します。
- **`LoopAction`**: 次の待ち方を表す値です。前の記事の `gen_server:loop/4` が受け取ります。
- **`handle_action/2`**: 戻り値に含まれる追加の動作（タイムアウトや継続など）を、`LoopAction` に変える補助関数です。
- **`terminate/7`**: サーバーを終わらせる処理です。終了理由を受け取り、後始末をします。
- **`{'EXIT', Class, Reason, Stacktrace}`**: コールバックの中で例外が起きたときの形です。
- **`?STACKTRACE()`**: 直前の例外のスタックトレースを表すマクロです。

## 何をしているか

### 1. 継続のない正常な応答

```erlang:line-numbers=2553
    case Reply of
	{ok, {noreply, NState}} ->
	    loop(ServerData, NState, infinity, []);
```

`{noreply, NState}` なら、状態を更新して、タイムアウトなし（`infinity`）で待ちに戻ります。最も普通の経路です。

### 2. 追加の動作がある応答

```erlang:line-numbers=2556
	{ok, {noreply, NState, Action} = Return} ->
            case handle_action(ServerData, Action) of
		error ->
		    terminate(ServerData, State, Msg, From, {bad_return_value, Return}, ?STACKTRACE(), []);
                LoopAction ->
                    loop(ServerData, NState, LoopAction, [])
```

`{noreply, NState, Action}` のときは、`handle_action/2` で追加の動作を解釈します。解釈できない形なら、不正な戻り値として終了させます。解釈できれば、その `LoopAction` で待ちに戻ります。

### 3. 停止の要求

```erlang:line-numbers=2563
	{ok, {stop, Reason, NState}} ->
	    terminate(ServerData, NState, Msg, From, Reason, ?STACKTRACE(), []);
```

`{stop, Reason, NState}` は、サーバーを止める要求です。`terminate/7` で、理由と最新の状態を使って後始末をします。

### 4. 例外

```erlang:line-numbers=2565
	{'EXIT', Class, Reason, Stacktrace} ->
	    terminate(ServerData, State, Msg, From, Class, Reason, Stacktrace, []);
```

コールバックの中で例外が起きた場合は、その種類と理由を `terminate/8` に渡して終了させます。

### 5. それ以外の値

```erlang:line-numbers=2567
	{ok, BadReturn} ->
	    terminate(ServerData, State, Msg, From, {bad_return_value, BadReturn}, ?STACKTRACE(), [])
```

どの形にも当てはまらない戻り値は、`bad_return_value` として終了させます。想定外の値を、黙って無視しないための経路です。

## ここがすごい

### 想定外の戻り値も、必ず終了の経路に入る

利用者の書いたコールバックが、規則に合わない値を返すことはあり得ます。この関数は、最後の節で必ず捕まえ、サーバーを止めて原因を報告します。
「知らない値は、無視せずに失敗として扱う」という設計で、不具合を早く表に出せます。

### 判断と実行を、終了の経路にまとめる

どの終了経路も、最終的には `terminate` の仲間の関数を通ります。後始末や報告の仕方が、1 か所で決まっています。
読むときは、「続ける経路」と「止める経路」の 2 つに分けて考えると、全体がつかみやすくなります。

## まとめ

- コールバックの戻り値は、続ける・止める・失敗するの 3 つに分けて読み替えると、流れが明確になります。
- 想定外の値を最後の節で捕まえると、不具合を黙って見逃さずに済みます。
- 後始末を終了の経路に集めると、どの失敗でも同じ手順で終われます。
