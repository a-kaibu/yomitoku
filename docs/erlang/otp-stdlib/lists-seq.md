---
title: "連続する整数のリストを、4 個ずつ作って速く並べる"
description: "lists:seq/2 は、From から To までの整数のリストを作る。seq_loop/3 は 1 回の再帰で 4 個（残りが足りなければ 2 個、1 個）を前に積むので、再帰の回数を大幅に減らしている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [478, 489]
function: "lists:seq/2"
difficulty: 2
format: 2
tags: ["アルゴリズム", "最適化", "標準ライブラリ"]
---
## ひとことで

`lists:seq/2` は、`From` から `To` までの整数を並べたリストを作ります。例えば `lists:seq(1, 5)` は `[1, 2, 3, 4, 5]` です。
実際の作業は `seq_loop/3` が行います。1 回の再帰で 4 個ずつまとめて、リストの先頭に積んでいきます。

## コード

```erlang:line-numbers=478
seq(First, Last)
  when is_integer(First), is_integer(Last), First-1 =< Last ->
    seq_loop(Last-First+1, Last, []).

seq_loop(N, X, L) when N >= 4 ->
    seq_loop(N-4, X-4, [X-3,X-2,X-1,X|L]);
seq_loop(N, X, L) when N >= 2 ->
    seq_loop(N-2, X-2, [X-1,X|L]);
seq_loop(1, X, L) ->
    [X|L];
seq_loop(0, _, L) ->
     L.
```

## 前提知識

- **リストの作り方**: Erlang では、先頭に積む `[X|L]` が最も速い作り方です。末尾に追加すると、コピーが増えます。
- **後ろから作る**: `seq_loop/3` は、最後の数（`Last`）から逆に作り、先頭へ積んでいきます。そのため、最後にできるリストは `From` から順に並びます。
- **`N`、`X`、`L` の役割**: `N` は残りの個数、`X` は今の数、`L` はここまでに作ったリストです。
- **ガード `when N >= 4`**: 残りが 4 個以上あるときだけ、この節に一致します。
- **`is_integer` と範囲のチェック**: 引数が整数で、`First-1 =< Last` の条件を満たすときだけ動きます。`First` が `Last + 1` のときは、空のリストになります。

## 何をしているか

### 1. 入口で個数を決める

```erlang:line-numbers=478
seq(First, Last)
  when is_integer(First), is_integer(Last), First-1 =< Last ->
    seq_loop(Last-First+1, Last, []).
```

個数 `Last-First+1` を求めて、`seq_loop/3` に渡します。最初の `L` は空のリストです。

### 2. 4 個ずつ積む

```erlang:line-numbers=482
seq_loop(N, X, L) when N >= 4 ->
    seq_loop(N-4, X-4, [X-3,X-2,X-1,X|L]);
```

残りが 4 個以上あるときは、`X-3`、`X-2`、`X-1`、`X` の 4 個をまとめて先頭に積みます。`N` と `X` を 4 ずつ減らして、自分自身を呼びます。

### 3. 2 個ずつ積む

```erlang:line-numbers=484
seq_loop(N, X, L) when N >= 2 ->
    seq_loop(N-2, X-2, [X-1,X|L]);
```

残りが 2 個か 3 個のときは、2 個ずつ積みます。

### 4. 最後の 1 個

```erlang:line-numbers=486
seq_loop(1, X, L) ->
    [X|L];
```

残りが 1 個になったら、その値 `X` を先頭に積んで終わります。

### 5. 空

```erlang:line-numbers=488
seq_loop(0, _, L) ->
     L.
```

残りが 0 個なら、ここまでに作った `L` をそのまま返します。

## ここがすごい

### 再帰の回数を 4 分の 1 に近づける

1 個ずつ積むと、1000 個のリストには 1000 回の再帰が必要です。この関数は 4 個ずつまとめるので、約 250 回で済みます。
関数呼び出しの回数が減ると、そのぶん速く終わります。作るリストが大きいほど、この差が効きます。

### 残りに応じて、まとめる単位を変える

4 個の節だけでは、端数（1、2、3 個）が残ります。この関数は、2 個の節と 1 個の節を用意して、端数を正確に処理しています。
「大きい単位で進め、残りを小さい単位で埋める」という、キリのよい分け方です。

## まとめ

- 整数列を作るときは、複数個ずつまとめて積むと、再帰の回数を減らせます。
- 端数の処理を、小さい単位の節で書いておくと、正しさを保てます。
- 先頭への積み重ねで作ると、コピーを避けて効率よく作れます。
