---
title: "並んだ一覧から、高さの釣り合った木を一気に作る"
description: "gb_trees:balance/1 の内部で使われる balance_list_unchecked/2 は、キーの昇順の一覧を、左右の大きさがほぼ同じになるように分けて再帰的に木を作る。挿入を繰り返すより速く、釣り合いも崩れない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [436, 449]
function: "gb_trees:balance_list_unchecked/2"
difficulty: 3
format: 2
tags: ["データ構造", "アルゴリズム", "ソート"]
---
## ひとことで

`gb_trees` は、キーで並んだ二分探索木です。ここでは、キーの昇順に並んだリストから、バランスの取れた木を 1 回の再帰で作ります。
`balance_list_unchecked/2` は、一覧の先頭から要素を順に、左の部分木、根、右の部分木へと振り分けていきます。大きさは、`split_list_size/1` が左右でほぼ半分になるように決めます。

## コード

```erlang:line-numbers=436
balance_list_unchecked(L, S) ->
    {T, []} = balance_list_unchecked_1(L, S),
    T.

balance_list_unchecked_1(L, S) when S > 1 ->
    {S1, S2} = split_list_size(S),
    {T1, [{K, V} | L1]} = balance_list_unchecked_1(L, S1),
    {T2, L2} = balance_list_unchecked_1(L1, S2),
    T = {K, V, T1, T2},
    {T, L2};
balance_list_unchecked_1([{Key, Val} | L], 1) ->
    {{Key, Val, nil, nil}, L};
balance_list_unchecked_1(L, 0) ->
    {nil, L}.
```

## 前提知識

- **二分探索木**: 各ノードについて、左の子のキーは小さく、右の子のキーは大きい木です。探索は、キーの大小で左右のどちらかへ進みます。
- **バランス（釣り合い）**: 左右の高さの差が小さい木です。釣り合いが崩れると、探索の時間が長くなります。
- **`gb_trees`**: 釣り合いを保つ仕組みを持つ、木構造の辞書です。挿入や削除のあとも、高さを適切に保ちます。
- **`{K, V, T1, T2}`**: 根のキー `K`、値 `V`、左の部分木 `T1`、右の部分木 `T2` を表すタプルです。`nil` は空の木です。
- **`{T, Rest}` の組**: 木と、まだ使っていない残りの一覧を一緒に返します。再帰で一覧を消費していくための形です。

## 何をしているか

### 1. 大きさが 2 以上のとき

```erlang:line-numbers=440
balance_list_unchecked_1(L, S) when S > 1 ->
    {S1, S2} = split_list_size(S),
    {T1, [{K, V} | L1]} = balance_list_unchecked_1(L, S1),
    {T2, L2} = balance_list_unchecked_1(L1, S2),
    T = {K, V, T1, T2},
    {T, L2};
```

`S` 個の要素を、`split_list_size/1` で左 `S1` 個と右 `S2` 個に分けます。まず左の木を、先頭から `S1` 個の要素で作ります。その次の要素 `{K, V}` が、この木の根になります。残りの要素で、右の木を `S2` 個作ります。
根の左は、根より小さいキーだけが入る、という順序は、昇順のリストから順番に取り出すことで自然に満たされます。

### 2. 大きさが 1 のとき

```erlang:line-numbers=446
balance_list_unchecked_1([{Key, Val} | L], 1) ->
    {{Key, Val, nil, nil}, L};
```

要素が 1 つなら、その組だけを葉として木を作ります。左右の部分木は `nil`（空）です。

### 3. 大きさが 0 のとき

```erlang:line-numbers=448
balance_list_unchecked_1(L, 0) ->
    {nil, L}.
```

要素を使う必要がないときは、空の木 `nil` を返します。

## ここがすごい

### 一覧を半分に割ると、木も半分に割れる

昇順の一覧は、真ん中の要素が根になるように切れば、左右の部分木の大きさがほぼ同じになります。この関数は、その分け方を再帰で繰り返しています。
結果として、どの部分木も「大きさが約半分」になり、高さは要素数の対数に比例します。

### 挿入を繰り返さず、一度に作る

要素を 1 つずつ `insert` すると、木の再調整が何度も起きます。この関数は、並んだ一覧から、最初から釣り合った形を作ります。
大量の要素から木を作るときは、挿入の繰り返しよりずっと効率が良くなります。

## まとめ

- 昇順の一覧から木を作るときは、中央で分けて再帰すると、釣り合った木が一度にできます。
- 木の左右の大きさを、分ける関数で一か所にまとめると、調整が読みやすくなります。
- 挿入を繰り返す代わりに、一覧から一度に作ると、無駄な再調整を省けます。
