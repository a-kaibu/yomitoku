---
title: "平衡木の一番小さいキーを、左へ下りながら探す"
description: "gb_trees:smallest/1 は、木の左の枝を下りていき、左が無くなった節のキーと値を返す。二分探索木の性質で、最小のキーは一番左にある。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [711, 717]
function: "gb_trees:smallest/1"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "イディオム"]
---
## ひとことで

`gb_trees:smallest/1` は、木の中で一番小さいキーと、その値を返します。
木は二分探索木なので、小さいキーは常に左の枝にあります。この関数は、左へ左へと下りていき、もう左が無い節を見つけたら、その節の内容を返します。

## コード

```erlang:line-numbers=711
smallest({_, Tree}) ->
    smallest_1(Tree).

smallest_1({Key, Value, nil, _Larger}) ->
    {Key, Value};
smallest_1({_Key, _Value, Smaller, _Larger}) ->
    smallest_1(Smaller).
```

## 前提知識

- **gb_trees（一般化平衡木）**: キーで並んだ二分探索木です。木の形は、左右の枝の大きさが大きく偏らないように保たれています。
- **節の形 `{Key, Value, Smaller, Larger}`**: 各節は、キーと値、左の枝（Smaller）、右の枝（Larger）を持ちます。左の枝が `nil` なら、その節は左端です。
- **`nil`**: 枝が空であることを表す値です。
- **外側の `{_, Tree}`**: 木全体は、要素数と、根の節をまとめたタプルです。この関数は、根の節を取り出してから調べます。

## 何をしているか

### 1. 木の根から探し始める

```erlang:line-numbers=711
smallest({_, Tree}) ->
    smallest_1(Tree).
```

`smallest/1` は、木全体から根の節を取り出し、`smallest_1/1` に渡します。

### 2. 左の枝が無ければ、この節が最小

```erlang:line-numbers=714
smallest_1({Key, Value, nil, _Larger}) ->
    {Key, Value};
```

節の左の枝 `Smaller` が `nil` なら、この節のキーが最小です。`{Key, Value}` の組を返します。

### 3. 左の枝があれば、左へ下りる

```erlang:line-numbers=716
smallest_1({_Key, _Value, Smaller, _Larger}) ->
    smallest_1(Smaller).
```

左の枝があれば、それを新しい根として、同じ関数を呼びます。
この呼び出しを繰り返すと、最後にはいちばん左の節に着きます。

## ここがすごい

### 二分探索木の性質を、そのまま使う

二分探索木では、左の枝にあるキーは、節のキーより小さいことが決まっています。
そのため、最小のキーを探すには、ひたすら左へ進めばよいのです。比べる必要がなく、枝をたどるだけです。

### 節の形で、終わりを決める

`smallest_1` の最初の節は、左の枝が `nil` の節だけにマッチします。
終わりの条件を、節の形で書いているので、比べる処理が要りません。読み手は、二つの節の形を見るだけで、動きが分かります。

### 木の高さに比例した時間で終わる

探す回数は、木の高さの分だけです。gb_trees は、高さが大きくなりすぎないように作られた木なので、要素が多くても、少ない回数で左端に着きます。

## まとめ

`gb_trees:smallest(gb_trees:from_orddict([{2, a}, {1, b}, {3, c}]))` は、`{1, b}` を返します。
木に要素が無いときは、この関数の呼び出しは失敗します。
