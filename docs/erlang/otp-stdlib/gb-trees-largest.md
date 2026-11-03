---
title: "平衡木の一番大きいキーを、右へ下りながら探す"
description: "gb_trees:largest/1 は、木の右の枝を下りていき、右が無くなった節のキーと値を返す。左端を探す smallest の鏡像で、同じ形の二つの節を持つ。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [770, 776]
function: "gb_trees:largest/1"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "イディオム"]
---
## ひとことで

`gb_trees:largest/1` は、木の中で一番大きいキーと、その値を返します。
二分探索木では、大きいキーは右の枝にあります。この関数は、右へ右へと下りていき、右の枝が無くなった節の内容を返します。

## コード

```erlang:line-numbers=770
largest({_, Tree}) ->
    largest_1(Tree).

largest_1({Key, Value, _Smaller, nil}) ->
    {Key, Value};
largest_1({_Key, _Value, _Smaller, Larger}) ->
    largest_1(Larger).
```

## 前提知識

- **gb_trees**: キーで並んだ二分探索木です。木の形は、左右がほぼ釣り合うように保たれています。
- **節の形 `{Key, Value, Smaller, Larger}`**: 各節は、キーと値、左の枝、右の枝を持ちます。右の枝が `nil` なら、その節は右端です。
- **`nil`**: 枝が空であることを表す値です。
- **外側の `{_, Tree}`**: 木全体のタプルから、根の節を取り出します。

## 何をしているか

### 1. 根から探し始める

```erlang:line-numbers=770
largest({_, Tree}) ->
    largest_1(Tree).
```

`largest/1` は、木全体から根の節を取り出し、`largest_1/1` に渡します。

### 2. 右の枝が無ければ、この節が最大

```erlang:line-numbers=773
largest_1({Key, Value, _Smaller, nil}) ->
    {Key, Value};
```

節の右の枝 `Larger` が `nil` なら、この節のキーが最大です。`{Key, Value}` の組を返します。

### 3. 右の枝があれば、右へ下りる

```erlang:line-numbers=775
largest_1({_Key, _Value, _Smaller, Larger}) ->
    largest_1(Larger).
```

右の枝があれば、それを新しい根として、同じ関数を呼びます。
繰り返すと、最後にはいちばん右の節に着きます。

## ここがすごい

### smallest と鏡像の関係

`gb_trees:smallest/1` は左へ、この関数は右へ下ります。
二つの関数の節の形は、左右が入れ替わっているだけです。片方を理解すれば、もう片方も同じ考えで読めます。

### 節の形だけで、終わりを判断する

終わりの節は、右の枝が `nil` のものです。
関数の中に比較文は無く、パターンマッチだけで終わりを見分けています。

### 枝をたどる回数は、高さで決まる

右端に着くまでの回数は、木の高さの分です。
gb_trees は、高さが大きくなりすぎない木なので、要素が多くても、最大のキーを少ない回数で見つけられます。

### 空の木と、一つだけの木

木に要素が一つだけなら、その節は右の枝も `nil` なので、そのまま最大になります。
空の木には節がないので、この関数の入り口で一致しません。呼び出し側は、木が空でないことを、先に確かめておくと安全です。

## まとめ

`gb_trees:largest(gb_trees:from_orddict([{1, a}, {2, b}, {3, c}]))` は、`{3, c}` を返します。
木が空のときは、この関数の呼び出しは失敗します。
