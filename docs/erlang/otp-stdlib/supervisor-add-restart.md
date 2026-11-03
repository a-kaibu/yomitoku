---
title: "一定時間に再起動が多すぎないかを、期限切れの記録を捨てながら数える"
description: "supervisor:add_restart/1 は、子プロセスの再起動回数が制限を超えないかを確かめる。期限切れの再起動記録を捨てながら数え、記録が少ない間は数え直しを省く近道を持つ。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/supervisor.erl
lines: [2265, 2286]
function: "supervisor:add_restart/1"
difficulty: 3
format: 2
tags: ["並行処理", "エラー処理", "アルゴリズム"]
---
## ひとことで

`supervisor:add_restart/1` は、スーパーバイザーが子プロセスを再起動してよいかどうかを決めます。「一定の期間（`period`）に、最大何回（`intensity`）まで再起動してよいか」という制限を守るための関数です。
許可するなら再起動の時刻を記録し、制限を超えるなら `{terminate, State}` を返して、スーパーバイザー自身を止めます。

## コード

::: code-group

```erlang:line-numbers=2265 [日本語訳]
add_restart(#state{intensity = 0} = State) -> 
    {terminate, State};
%% 近道: 再起動の回数が制限より少ないあいだは、
%% 再起動を許可して、記録に加えるだけでよい。
%% 期限切れの記録を気にしなくてよい。
%% 期限切れの記録が長い間に大量に溜まらないよう、
%% この近道は ?DIRTY_RESTART_LIMIT 回までに限る。
add_restart(#state{intensity = I, restarts = R, nrestarts = NR} = State)
  when NR < min(I, ?DIRTY_RESTART_LIMIT) ->
    {ok, State#state{restarts = [erlang:monotonic_time(second)|R], nrestarts = NR + 1}};
%% 正確な数え方: 期間内の再起動回数を数え、
%% 期限切れの記録を捨てる。その数をもとに、
%% 再起動を許可するかどうかを決める。
add_restart(#state{intensity = I, period = P, restarts = R} = State) ->  
    Now = erlang:monotonic_time(second),
    Threshold = Now - P,
    case can_restart(I - 1, Threshold, R, [], 0) of
        {true, NR1, R1} ->
            {ok, State#state{restarts = [Now|R1], nrestarts = NR1 + 1}};
        {false, NR1, R1} ->
            {terminate, State#state{restarts = R1, nrestarts = NR1}}
    end.
```

```erlang:line-numbers=2265 [原文]
add_restart(#state{intensity = 0} = State) -> 
    {terminate, State};
%% shortcut: if the number of restarts is below the intensity
%% limit, it is safe to allow the restart, add the restart to
%% the list and not care about expired restarts; to prevent
%% accumulating a large list of expired restarts over time,
%% this shortcut is limited to ?DIRTY_RESTART_LIMIT restarts
add_restart(#state{intensity = I, restarts = R, nrestarts = NR} = State)
  when NR < min(I, ?DIRTY_RESTART_LIMIT) ->
    {ok, State#state{restarts = [erlang:monotonic_time(second)|R], nrestarts = NR + 1}};
%% calculate the real number of restarts within the period
%% and remove expired restarts; based on the calculated number
%% of restarts, allow or disallow the restart
add_restart(#state{intensity = I, period = P, restarts = R} = State) ->  
    Now = erlang:monotonic_time(second),
    Threshold = Now - P,
    case can_restart(I - 1, Threshold, R, [], 0) of
        {true, NR1, R1} ->
            {ok, State#state{restarts = [Now|R1], nrestarts = NR1 + 1}};
        {false, NR1, R1} ->
            {terminate, State#state{restarts = R1, nrestarts = NR1}}
    end.
```

:::

## 前提知識

- **スーパーバイザー**: 子プロセスを見張り、落ちたら再起動する Erlang のプロセスです。OTP の設計の中心にあります。
- **`intensity` と `period`**: 「`period` 秒の間に `intensity` 回まで再起動してよい」という制限です。
- **単調増加の時計 `erlang:monotonic_time(second)`**: システムの時刻が巻き戻っても、増え続ける時刻を秒単位で返します。再起動の間隔の計算に向いています。
- **レコード `#state{...}`**: 名前付きの項目を持つタプルです。`State#state{restarts = ...}` は、一部の項目だけを書き換えた新しい値を作ります。
- **`when` の付いた節の順番**: 上の節から順に試されます。最初に一致した節が使われます。

## 何をしているか

### 1. 制限が 0 のとき

```erlang:line-numbers=2265
add_restart(#state{intensity = 0} = State) -> 
    {terminate, State};
```

`intensity` が 0 なら、再起動を一切許しません。そのまま `{terminate, State}` を返します。

### 2. 記録が少ないときの近道

```erlang:line-numbers=2267
%% shortcut: if the number of restarts is below the intensity
%% limit, it is safe to allow the restart, add the restart to
%% the list and not care about expired restarts; to prevent
%% accumulating a large list of expired restarts over time,
%% this shortcut is limited to ?DIRTY_RESTART_LIMIT restarts
add_restart(#state{intensity = I, restarts = R, nrestarts = NR} = State)
  when NR < min(I, ?DIRTY_RESTART_LIMIT) ->
    {ok, State#state{restarts = [erlang:monotonic_time(second)|R], nrestarts = NR + 1}};
```

再起動の回数 `nrestarts` が、`intensity` と上限 `?DIRTY_RESTART_LIMIT` の小さいほうより少ないなら、期限切れかどうかを調べずに許可します。時刻を `R` のリストに足して、回数を 1 増やすだけです。
期限切れの記録をまだ捨てていないので、「汚れた（dirty）」数え方と呼ばれています。ただし、上限を決めてあるので、記録が際限なく増えることはありません。

### 3. 期限切れの記録を捨てて数え直す

```erlang:line-numbers=2275
%% calculate the real number of restarts within the period
%% and remove expired restarts; based on the calculated number
%% of restarts, allow or disallow the restart
add_restart(#state{intensity = I, period = P, restarts = R} = State) ->  
```

近道が使えないときは、正確に数え直します。`Threshold` は、期間 `period` より前の時刻です。この時刻より古い記録は、もう制限に数えなくてもよいものになります。

### 4. 許可か拒否かを決める

```erlang:line-numbers=2279
    Now = erlang:monotonic_time(second),
    Threshold = Now - P,
    case can_restart(I - 1, Threshold, R, [], 0) of
        {true, NR1, R1} ->
            {ok, State#state{restarts = [Now|R1], nrestarts = NR1 + 1}};
        {false, NR1, R1} ->
            {terminate, State#state{restarts = R1, nrestarts = NR1}}
    end.
```

`can_restart/5` が、期限内の回数を数え、新しい再起動を含めてよいかを判断します。許可なら、今の時刻 `Now` を記録に加えて `{ok, State}` を返します。拒否なら、`{terminate, State}` を返します。どちらの場合も、数え直した記録を `State` に保存します。

## ここがすごい

### 「数えない」ための近道

期限切れかどうかを毎回確かめると、再起動のたびに記録全体を読むことになります。しかし、記録が `intensity` より少ない間は、結果が必ず「許可」になります。
この関数は、その性質を使って、記録が少ないときは数える手間を省いています。

### 記録が溜まりすぎないように上限を置く

近道を無制限に使うと、期限切れの記録が溜まり続けます。コードのコメントにあるとおり、近道の使用は `?DIRTY_RESTART_LIMIT` までに限っています。
上限に達したら、正確な数え直しに切り替えて、古い記録をまとめて捨てます。速さと、メモリの使い方の釣り合いを取っている設計です。

## まとめ

- 「一定期間に何回まで」という制限は、期間より古い記録を捨てながら数えると正確に判定できます。
- 記録が少ないあいだは、数え直しを省いて速く処理できます。
- 近道を使う量に上限を置くと、記録が無限に増えるのを防げます。
