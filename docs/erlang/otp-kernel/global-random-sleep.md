---
title: "ロックの取り合いを避けるため、待ち時間を乱数でずらして倍にしていく"
description: "global:random_sleep/1 は、ノード間のロックの取得に失敗したとき、待つ時間を回数に応じて倍にする。待ち時間は 1 から上限の間の乱数にして、同時に再挑戦する相手とぶつからないようにしている。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/global.erl
lines: [3218, 3231]
function: "global:random_sleep/1"
difficulty: 2
format: 2
tags: ["並行処理", "乱数", "エラー処理"]
---
## ひとことで

`global:random_sleep/1` は、ロックを取れなかったときに、少し待ってから再挑戦するための待ちを行います。待つ時間は、失敗した回数（`Times`）が増えるにつれて長くなります。
ただし、一定の時間ではなく、上限までの乱数の時間だけ待ちます。複数のノードが同時に再挑戦して、また衝突するのを防ぐためです。

## コード

::: code-group

```erlang:line-numbers=3218 [日本語訳]
random_sleep(Times) ->
    _ = case Times rem 10 of
	    0 ->
		_ = rand:seed(exsplus);
	    _ ->
		ok
	end,
    %% 最初は 1/4 秒、その後は回ごとに 2 倍し、最大 8 秒まで
    Tmax = if Times > 5 -> 8000;
	      true -> ((1 bsl Times) * 1000) div 8
	   end,
    T = rand:uniform(Tmax),
    ?trace({random_sleep, {me,self()}, {times,Times}, {t,T}, {tmax,Tmax}}),
    receive after T -> ok end.
```

```erlang:line-numbers=3218 [原文]
random_sleep(Times) ->
    _ = case Times rem 10 of
	    0 ->
		_ = rand:seed(exsplus);
	    _ ->
		ok
	end,
    %% First time 1/4 seconds, then doubling each time up to 8 seconds max.
    Tmax = if Times > 5 -> 8000;
	      true -> ((1 bsl Times) * 1000) div 8
	   end,
    T = rand:uniform(Tmax),
    ?trace({random_sleep, {me,self()}, {times,Times}, {t,T}, {tmax,Tmax}}),
    receive after T -> ok end.
```

:::

## 前提知識

- **`global`**: 複数のノードにまたがって、名前やロックを管理する Erlang/OTP の仕組みです。
- **ロックの取り合い（衝突）**: 複数の相手が同時にロックを取ろうとして、どちらも取れずに失敗し続けることです。
- **指数的な待ち**: 待つ時間を、回数ごとに 2 倍などにする方式です。衝突が続くほど、間隔を広げます。
- **`rand:uniform/1`**: 1 から指定した数までの整数を、乱数で返します。
- **`rand:seed/1`**: 乱数の種を設定します。`exsplus` は、乱数のアルゴリズムの名前です。
- **`receive after T -> ok end`**: 時間 `T` だけ何もせず待ちます。
- **`?trace`**: デバッグ用のマクロです。ここでは、動きには影響しません。

## 何をしているか

### 1. 乱数の種を入れ直す

```erlang:line-numbers=3219
    _ = case Times rem 10 of
	    0 ->
		_ = rand:seed(exsplus);
	    _ ->
		ok
	end,
```

回数が 10 回ごとに、乱数の種を入れ直します。種が同じままだと、同じ待ち時間の列が繰り返されてしまうおそれがあるためです。

### 2. 待ちの上限を決める

```erlang:line-numbers=3225
    %% First time 1/4 seconds, then doubling each time up to 8 seconds max.
    Tmax = if Times > 5 -> 8000;
	      true -> ((1 bsl Times) * 1000) div 8
	   end,
```

`Times` が 5 以下なら、上限は `(2^Times) * 1000 / 8` ミリ秒です。`Times` が増えるたびに、上限が 2 倍になります。5 を超えたら、上限は 8000 ミリ秒（8 秒）で止まります。

### 3. 上限までの乱数で待つ

```erlang:line-numbers=3229
    T = rand:uniform(Tmax),
    ?trace({random_sleep, {me,self()}, {times,Times}, {t,T}, {tmax,Tmax}}),
    receive after T -> ok end.
```

`rand:uniform(Tmax)` で、1 から上限までの乱数の時間 `T` を選びます。`receive after T -> ok end` で、その時間だけ待ちます。待った後は、呼び出し側が再挑戦します。

## ここがすごい

### 上限を倍にしつつ、実際の待ちは乱数にする

上限だけを倍にして、一定の時間を待つ方式では、同時に失敗した相手が全部同じ時刻に戻ってきます。
この関数は、上限の中で乱数を選ぶので、再挑戦の時刻がばらけます。衝突が起きても、次の回では重なりにくくなります。

### 種の入れ直しで、乱数の列の繰り返しを防ぐ

乱数の列は、種が同じだと同じ順番で出てきます。ノードが同じ種で動くと、同じ待ち時間になり、衝突が再び起きます。
10 回に 1 回だけ種を入れ直すのは、乱数の列を変えるための、小さな工夫です。

## まとめ

- 競合したときの再挑戦は、待ち時間を回数に応じて広げると、負荷を抑えられます。
- 待ち時間を乱数にすると、同時に再挑戦する相手の時刻がずれます。
- 乱数の種を時々入れ直すと、同じ列の繰り返しを防げます。
