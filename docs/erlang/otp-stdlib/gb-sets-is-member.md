---
title: "平衡木の集合に、要素があるかを左右へ分けて探す"
description: "gb_sets:is_member/2 は、集合の木を根から見て、探す値が小さければ左、大きければ右へ進む。節に一致したら true、枝が無くなったら false を返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_sets.erl
lines: [283, 293]
function: "gb_sets:is_member/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "ハッシュ"]
---
## ひとことで

`gb_sets:is_member/2` は、要素が集合に入っているかを `true` か `false` で返します。
集合は、要素を並べた二分探索木として持たれています。この関数は、根から比べながら、左か右へ進んで探します。

## コード

```erlang:line-numbers=283
is_member(Key, {_, T}) ->
    is_member_1(Key, T).

is_member_1(Key, {Key1, Smaller, _}) when Key < Key1 ->
    is_member_1(Key, Smaller);
is_member_1(Key, {Key1, _, Bigger}) when Key > Key1 ->
    is_member_1(Key, Bigger);
is_member_1(_, {_, _, _}) ->
    true;
is_member_1(_, nil) ->
    false.
```

## 前提知識

- **gb_sets（一般化平衡集合）**: 要素を二分探索木に入れた集合です。木の形は、左右の高さがほぼ釣り合うように保たれています。
- **節の形 `{Key, Smaller, Bigger}`**: 集合の節は、キーと、左の枝、右の枝を持ちます。値は持ちません。
- **`nil`**: 枝が空であることを表す値です。
- **比較演算子 `<` と `>`**: 探す値と節のキーの大小を比べるために使います。

## 何をしているか

### 1. 木の根から探し始める

```erlang:line-numbers=283
is_member(Key, {_, T}) ->
    is_member_1(Key, T).
```

`is_member/2` は、集合の根の木を取り出し、`is_member_1/2` に探す値と一緒に渡します。

### 2. 探す値が小さければ、左へ進む

```erlang:line-numbers=286
is_member_1(Key, {Key1, Smaller, _}) when Key < Key1 ->
    is_member_1(Key, Smaller);
```

探す値 `Key` が、節のキー `Key1` より小さければ、左の枝 `Smaller` を調べます。

### 3. 探す値が大きければ、右へ進む

```erlang:line-numbers=288
is_member_1(Key, {Key1, _, Bigger}) when Key > Key1 ->
    is_member_1(Key, Bigger);
```

探す値が、節のキーより大きければ、右の枝 `Bigger` を調べます。

### 4. 等しければ見つかった、枝が無ければ無い

```erlang:line-numbers=290
is_member_1(_, {_, _, _}) ->
    true;
is_member_1(_, nil) ->
    false.
```

どちらでもないときは、キーが一致した節です。`true` を返します。
枝が `nil` なら、探す値はどこにも無いので `false` を返します。

## ここがすごい

### 比べるのは、一つの節ごとに一回だけ

探す値と節のキーを、大きさで比べます。小さければ左、大きければ右です。
この方法なら、一回の比較で、探す範囲が半分ほどに減ります。木の高さの分だけ比べれば、答えが決まります。

### 節の形だけを見て、分岐する

二つの節は、ガードの比較で分かれ、三つ目の節は一致を表します。
枝が `nil` の節は、最後の節にマッチします。どの場合にどの値を返すかが、節の並びから読み取れます。

### 木の形が、探す速さを支える

gb_sets は、高さが大きくなりすぎないように木を組み替えます。
そのため、要素が多くても、比べる回数は少なく保たれます。この関数の中身は単純ですが、速さは木の作り方に支えられています。

## まとめ

`gb_sets:is_member(2, gb_sets:from_list([1, 2, 3]))` は、`true` を返します。
`gb_sets:is_member(5, gb_sets:from_list([1, 2, 3]))` は、`false` を返します。
