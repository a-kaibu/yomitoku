---
title: "平衡木に、キーが定義されているかを左右へ分けて探す"
description: "gb_trees:is_defined/2 は、木の根から、探すキーと節のキーを比べ、小さければ左、大きければ右へ進む。一致すれば true、枝が無くなれば false を返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [227, 237]
function: "gb_trees:is_defined/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "ハッシュ"]
---
## ひとことで

`gb_trees:is_defined/2` は、木にキーがあるかを `true` か `false` で返します。
木は二分探索木なので、キーを比べながら、左か右へ進めば、キーの有無が決まります。値は見ません。

## コード

```erlang:line-numbers=227
is_defined(Key, {_, T}) ->
    is_defined_1(Key, T).

is_defined_1(Key, {Key1, _, Smaller, _}) when Key < Key1 ->
    is_defined_1(Key, Smaller);
is_defined_1(Key, {Key1, _, _, Bigger}) when Key > Key1 ->
    is_defined_1(Key, Bigger);
is_defined_1(_, {_, _, _, _}) ->
    true;
is_defined_1(_, nil) ->
    false.
```

## 前提知識

- **gb_trees**: キーで並んだ二分探索木です。木の形は、左右がほぼ釣り合うように保たれています。
- **節の形 `{Key, Value, Smaller, Bigger}`**: 節は、キーと値、左の枝、右の枝を持ちます。
- **`nil`**: 枝が空であることを表す値です。
- **外側の `{_, T}`**: 木全体のタプルです。要素数と、根の節を持ちます。

## 何をしているか

### 1. 根から探し始める

```erlang:line-numbers=227
is_defined(Key, {_, T}) ->
    is_defined_1(Key, T).
```

`is_defined/2` は、木全体から根の節を取り出し、`is_defined_1/2` に探すキーと一緒に渡します。

### 2. 探すキーが小さければ、左へ進む

```erlang:line-numbers=230
is_defined_1(Key, {Key1, _, Smaller, _}) when Key < Key1 ->
    is_defined_1(Key, Smaller);
```

探すキー `Key` が、節のキー `Key1` より小さければ、左の枝 `Smaller` を調べます。

### 3. 探すキーが大きければ、右へ進む

```erlang:line-numbers=232
is_defined_1(Key, {Key1, _, _, Bigger}) when Key > Key1 ->
    is_defined_1(Key, Bigger);
```

探すキーが、節のキーより大きければ、右の枝 `Bigger` を調べます。

### 4. 一致すれば true、枝が空なら false

```erlang:line-numbers=234
is_defined_1(_, {_, _, _, _}) ->
    true;
is_defined_1(_, nil) ->
    false.
```

どちらでもなければ、キーが一致した節です。`true` を返します。
枝が `nil` なら、探すキーはどこにも無いので、`false` を返します。

## ここがすごい

### 比べながら、半分ずつ絞る

キーを比べるたびに、探す範囲は、左か右の一方に絞られます。
この仕組みのおかげで、要素が多くても、比べる回数は木の高さの分で済みます。

### 値を見ない、存在の判定

値は、この関数では使われません。キーの有無だけを答えます。
値を取り出すなら `lookup/2` を使い、有無だけなら、この関数を使うと、判断が一つに絞れます。

### 節の並びで、場合を網羅する

大小の二つの節と、一致の節と、空の節の四つで、どの木にも必ず一つの節が当たります。
読み手は、節を上から読めば、キーが見つかる道と、見つからない道の両方が分かります。

## まとめ

`gb_trees:is_defined(2, gb_trees:from_orddict([{1, a}, {2, b}]))` は、`true` を返します。
`gb_trees:is_defined(3, gb_trees:from_orddict([{1, a}, {2, b}]))` は、`false` を返します。
