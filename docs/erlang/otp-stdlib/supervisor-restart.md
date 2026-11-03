---
title: "子が落ちたとき、再起動の上限を超えたらスーパーバイザーごと止める"
description: "supervisor:restart/2 は、落ちた子プロセスを再起動する。再起動の回数が上限を超えたら、子を止めてスーパーバイザーを終わらせる。その判断を、再起動の記録と結果の形で分けて書いている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/supervisor.erl
lines: [1477, 1496]
function: "supervisor:restart/2"
difficulty: 3
format: 2
tags: ["並行処理", "エラー処理"]
---
## ひとことで

`supervisor:restart/2` は、子プロセスが落ちたときに呼ばれ、再起動を行うかどうかを決めて実行します。
まず、再起動が許されるかを `add_restart/1` で確かめます。許されれば、戦略に従って子を起動します。上限を超えていたら、エラーを報告し、スーパーバイザーを終わらせる結果を返します。

## コード

::: code-group

```erlang:line-numbers=1477 [日本語訳]
restart(Child, State) ->
    case add_restart(State) of
	{ok, NState} ->
	    case restart(NState#state.strategy, Child, NState) of
		{{try_again, TryAgainId}, NState2} ->
		    %% 制御を gen_server に戻してから、
		    %% もう一度試します。こうすると、ほかの要求を
		    %% 先に処理できます。たとえば、
		    %% スーパーバイザーや子を止める要求です。
		    %% 子に関する要求も含みます。
                    try_again_restart(TryAgainId, NState2#state.tag),
		    {ok,NState2};
		Other ->
		    Other
	    end;
	{terminate, NState} ->
	    ?report_error(shutdown, reached_max_restart_intensity,
			 Child, State#state.name),
	    {shutdown, del_child(Child, NState)}
    end.
```

```erlang:line-numbers=1477 [原文]
restart(Child, State) ->
    case add_restart(State) of
	{ok, NState} ->
	    case restart(NState#state.strategy, Child, NState) of
		{{try_again, TryAgainId}, NState2} ->
		    %% Leaving control back to gen_server before
		    %% trying again. This way other incoming requests
		    %% for the supervisor can be handled - e.g. a
		    %% shutdown request for the supervisor or the
		    %% child.
                    try_again_restart(TryAgainId, NState2#state.tag),
		    {ok,NState2};
		Other ->
		    Other
	    end;
	{terminate, NState} ->
	    ?report_error(shutdown, reached_max_restart_intensity,
			 Child, State#state.name),
	    {shutdown, del_child(Child, NState)}
    end.
```

:::

## 前提知識

- **スーパーバイザー**: 子プロセスを見張り、落ちたら決まった方法で起動し直すプロセスです。
- **再起動の戦略（strategy）**: 子が 1 つ落ちたときに、どの子を再起動するかを決める方針です。たとえば、その子だけを起こし直すものなどがあります。
- **`{ok, NState}` と `{terminate, NState}`**: `add_restart/1` の答えです。`ok` なら再起動してよく、`terminate` なら上限を超えています。
- **`try_again`**: 再起動をすぐには行わず、後で試し直す結果です。
- **`?report_error`**: エラーをログに出すマクロです。
- **`del_child/2`**: 子の情報を、スーパーバイザーの状態から取り除く関数です。

## 何をしているか

### 1. 再起動が許されるかを確かめる

```erlang:line-numbers=1478
    case add_restart(State) of
	{ok, NState} ->
```

`add_restart/1` で、再起動の回数が上限の中にあるかを確かめます。許されれば `{ok, NState}` が返り、次の段階に進みます。

### 2. 戦略に従って再起動する

```erlang:line-numbers=1480
	    case restart(NState#state.strategy, Child, NState) of
		{{try_again, TryAgainId}, NState2} ->
```

戦略（`strategy`）に従って、子の再起動を行います。結果が `{try_again, ...}` なら、すぐには起動せず、後で試し直すことを予約します。

### 3. 後で試し直すとき

```erlang:line-numbers=1482
		    %% Leaving control back to gen_server before
		    %% trying again. This way other incoming requests
		    %% for the supervisor can be handled - e.g. a
		    %% shutdown request for the supervisor or the
		    %% child.
                    try_again_restart(TryAgainId, NState2#state.tag),
		    {ok,NState2};
```

`try_again_restart/2` で、再起動の予約を出します。その後に、`{ok, NState2}` を返します。こうすると、スーパーバイザーは一度 `gen_server` に制御を戻せます。その間に、ほかの要求（停止の要求など）を処理できます。

### 4. ほかの結果

```erlang:line-numbers=1489
		Other ->
		    Other
```

それ以外の結果は、そのまま返します。成功や、ほかの理由での失敗などが、ここに入ります。

### 5. 上限を超えたとき

```erlang:line-numbers=1492
	{terminate, NState} ->
	    ?report_error(shutdown, reached_max_restart_intensity,
			 Child, State#state.name),
	    {shutdown, del_child(Child, NState)}
```

`{terminate, NState}` が返ったら、再起動の上限を超えています。`?report_error` で、上限に達したことを報告します。そして、子の記録を消した状態で `{shutdown, ...}` を返します。スーパーバイザー自身を終わらせて、上位のスーパーバイザーに問題を渡す形です。

## ここがすごい

### 「今すぐ」と「あとで」を分けて、他の要求を止めない

再起動の処理が長いと、その間スーパーバイザーは他の要求に答えられません。`try_again` の仕組みは、再起動を一度 `gen_server` に任せて、他の要求を先に処理させます。
停止の要求がすぐ届くようにしておくことで、スーパーバイザー自身の制御も失われません。

### 判断と実行を別の関数に分ける

上限の判断は `add_restart/1`、実行は `restart/3`、失敗時の後始末は `del_child/2` と、役割を分けています。
この関数は、それらを組み合わせて、結果の形ごとに振り分けるだけです。読む人は、結果の 3 つの形を覚えれば流れがつかめます。

## まとめ

- 再起動は、上限の確認、実行、後始末の 3 段階に分けると、考えやすくなります。
- 時間のかかる再起動は、一度制御を戻して、他の要求を先に処理させられます。
- 上限を超えたら、報告してから自分も終わることで、問題を上位に伝えます。
