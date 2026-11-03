---
title: "平衡木の既存のキーの値を、木の形を変えずに書き換える"
description: "gb_trees:update/3 は、キーがすでにある木だけを対象に、値を入れ替える。新しいキーは追加せず、通ったノードだけを作り直す。比較の向きで左右の枝を選ぶ、木の探索の基本形。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [288, 290]
function: "gb_trees:update/3"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`gb_trees:update/3` は、平衡木（gb tree）の中で、すでにあるキーの値を新しい値に置き換えます。
キーが無いときは追加しません。追加は `insert/3` の役目です。

## コード

```erlang:line-numbers=288
update(Key, Val, {S, T}) ->
    T1 = update_1(Key, Val, T),
    {S, T1}.
```

## 前提知識

- **gb tree（平衡木）**: キーと値を二分探索木の形で持つデータ構造です。`{要素数, 根のノード}` という二つの値の組で表されます。
- **ノード**: `{Key, Value, Smaller, Bigger}` の四つ組です。`Smaller` は小さいキーの部分木、`Bigger` は大きいキーの部分木です。
- **関数の節とガード**: `when Key < Key1` のように、比較の結果で節を選びます。

## 何をしているか

### 1. 外側の組から、根のノードを書き換える

```erlang:line-numbers=288
update(Key, Val, {S, T}) ->
    T1 = update_1(Key, Val, T),
    {S, T1}.
```

外側の `{S, T}` は、要素数 `S` と木の根 `T` の組です。根に対して `update_1/3` を呼び、新しい根 `T1` を作ります。
要素数 `S` は変わらないので、そのまま `{S, T1}` として返します。キーの追加ではないので、数は増えません。

### 2. キーが小さければ、左の部分木へ進む

```erlang:line-numbers=294
update_1(Key, Value, {Key1, V, Smaller, Bigger}) when Key < Key1 -> 
    {Key1, V, update_1(Key, Value, Smaller), Bigger};
```

探すキー `Key` が、ノードのキー `Key1` より小さいなら、`Smaller` の部分木の中で同じ書き換えを行います。
その結果を、元のノードの `Smaller` の位置に入れて、新しいノードを作ります。`V` と `Bigger` は、そのままです。

### 3. キーが大きければ、右の部分木へ進む

```erlang:line-numbers=296
update_1(Key, Value, {Key1, V, Smaller, Bigger}) when Key > Key1 ->
    {Key1, V, Smaller, update_1(Key, Value, Bigger)};
```

キーが `Key1` より大きいときは、右側の `Bigger` で同じ処理をします。左右の考え方は、比較の向きだけが違います。

### 4. キーが一致したら、値を入れ替える

```erlang:line-numbers=298
update_1(Key, Value, {_, _, Smaller, Bigger}) ->
    {Key, Value, Smaller, Bigger}.
```

どちらでもない、つまり `Key` と `Key1` が等しいときは、ノードの値だけを新しい `Value` に変えます。
この節は、キーの比較を二回しないで済むように、残りの場合をまとめて受け持っています。

## ここがすごい

### 変えた道筋だけを作り直す

木の中のノードは、Erlang の値として一度作ったら変えられません。
そのため、書き換えは「通ったノードだけ新しく作る」形になります。通らなかった枝は、そのまま共有されます。

### 木の形を変えない

`insert/3` は、新しいノードを追加し、木の釣り合いを取り直すことがあります。
一方、この関数は、既存のノードの値を置き換えるだけです。キーの並びも、木の形も、変わりません。釣り合いを取り直す処理が要らないので、動きが単純です。

### 存在しないキーは、例外になる

この関数は、キーが無いときの節を持っていません。探索が葉の `nil` まで進むと、`update_1/3` のどの節にも当たりません。
そのため、関数呼び出しは `function_clause` の例外で失敗します。要素数も、木も、変わりません。
この関数を使う前に、呼び出し側が `is_defined/2` で確かめるか、キーが確実にあることを保証する必要があります。

## まとめ

`gb_trees:update(b, 20, Tree)` は、キー `b` の値を `20` に置き換えた木を返します。
要素数は変わりません。キーが無いときは、`enter/3` のように、そのキーを追加する関数を使ってください。
