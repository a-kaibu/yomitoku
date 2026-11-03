---
title: "木の大小だけで、キーの場所を 1 本の経路でたどる"
description: "gb_trees:lookup/2 は、キーを二分探索木でたどって値を探す。キーの大小で左右へ進み、等しいときだけ値を返す。等しさを最後に比べることで、比較の回数を減らしている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [197, 204]
function: "gb_trees:lookup_1/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "最適化"]
---
## ひとことで

`gb_trees:lookup/2` は、木の中でキーに対応する値を探します。実際の探索は `lookup_1/2` が行います。
キーが根より小さければ左の部分木へ、大きければ右の部分木へ進みます。等しければ、その節の値を返します。見つからなければ `none` を返します。

## コード

```erlang:line-numbers=197
lookup_1(Key, {Key1, _, Smaller, _}) when Key < Key1 ->
    lookup_1(Key, Smaller);
lookup_1(Key, {Key1, _, _, Bigger}) when Key > Key1 ->
    lookup_1(Key, Bigger);
lookup_1(_, {_, Value, _, _}) ->
    {value, Value};
lookup_1(_, nil) ->
    none.
```

## 前提知識

- **二分探索木**: 各ノードのキーより、左の子は小さく、右の子は大きい木です。
- **`{Key, Value, Smaller, Bigger}`**: ノードのキーと値、左の部分木、右の部分木の 4 つの要素を持つタプルです。
- **`nil`**: 空の木です。
- **`{value, Value}` と `none`**: 見つかったかどうかを、戻り値の形で伝えます。
- **ガード `when Key < Key1`**: キーの大小で節を選びます。

## 何をしているか

### 1. キーが小さいとき

```erlang:line-numbers=197
lookup_1(Key, {Key1, _, Smaller, _}) when Key < Key1 ->
    lookup_1(Key, Smaller);
```

キー `Key` が、ノードのキー `Key1` より小さければ、左の部分木 `Smaller` の中を探します。

### 2. キーが大きいとき

```erlang:line-numbers=199
lookup_1(Key, {Key1, _, _, Bigger}) when Key > Key1 ->
    lookup_1(Key, Bigger);
```

キーが大きければ、右の部分木 `Bigger` の中を探します。

### 3. 等しいとき

```erlang:line-numbers=201
lookup_1(_, {_, Value, _, _}) ->
    {value, Value};
```

上の 2 つに当てはまらなければ、キーは等しいと考えられます。その節の値 `Value` を `{value, Value}` で返します。

### 4. 空の木のとき

```erlang:line-numbers=203
lookup_1(_, nil) ->
    none.
```

木が `nil` なら、キーはありません。`none` を返します。

## ここがすごい

### 等しさを最後に比べる

普通の書き方は、「等しい、小さい、大きい」の順に比べることが多いです。しかし、この関数は「小さい」「大きい」を先に比べています。コメントにあるとおり、Erlang の項の順序では、3 つの比較のどれかが必ず一致します。
大きい方と小さい方で多くの場合が決まるので、等しさを確かめる回数が減ります。

### 1 本の経路だけをたどる

探索は、根から葉まで 1 本の経路をたどるだけです。左右の両方を探すことはありません。木の高さが釣り合っていれば、経路の長さは要素数の対数に比例します。
このため、`gb_trees` は挿入や削除の後も、釣り合いを保つ仕組みを持っています。

## まとめ

- 二分探索木の探索は、キーの大小だけで 1 本の経路が決まります。
- 等しさを最後に比べると、多くの場合で比較の回数が減ります。
- 見つかった・見つからないを、戻り値の形（`{value, V}` か `none`）で区別できます。
