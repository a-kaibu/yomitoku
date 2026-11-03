---
title: "平衡集合に、要素を重複なく追加する"
description: "gb_sets:insert/2 は、要素を平衡木の正しい位置に追加する。すでに同じ要素があるとエラーにするため、集合としての性質を守る。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_sets.erl
lines: [318, 320]
function: "gb_sets:insert/2"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "アルゴリズム"]
---
## ひとことで

`gb_sets:insert/2` は、平衡集合（gb set）に要素を一つ追加します。
集合は要素が重複しないものなので、すでに同じ要素がある場合は、追加せずにエラーになります。

## コード

```erlang:line-numbers=318
insert(Key, {S, T}) when is_integer(S), S >= 0 ->
    S1 = S + 1,
    {S1, insert_1(Key, T, ?pow(S1, ?p))}.
```

## 前提知識

- **gb set（平衡集合）**: 要素を平衡木の形で持つ集合です。`gb_trees` と同じ仕組みを使い、要素だけを持ちます。
- **要素数 `S`**: 集合に入っている要素の数です。`{S, T}` の組に入っています。
- **`?pow`**: ソースで定義されたマクロです。部分木の大きさの目安を決めるために使われます。
- **`insert_1/3`**: 木の中を探して、要素を入れる補助関数です。

## 何をしているか

### 1. 要素数を一つ増やす

```erlang:line-numbers=318
insert(Key, {S, T}) when is_integer(S), S >= 0 ->
    S1 = S + 1,
```

外側の `S` を読み、`S1` を `S + 1` で求めます。
要素を入れた後の数です。

### 2. 木の中に要素を入れる

```erlang:line-numbers=320
    {S1, insert_1(Key, T, ?pow(S1, ?p))}.
```

`insert_1/3` に、要素 `Key`、根 `T`、大きさの目安 `?pow(S1, ?p)` を渡します。
戻り値は、要素を加えた後の木です。その木を、新しい要素数と組にして返します。

### 3. 比較で、左か右かを選ぶ

```erlang:line-numbers=322
insert_1(Key, {Key1, Smaller, Bigger}, S) when Key < Key1 ->
    case insert_1(Key, Smaller, ?div2(S)) of
```

`insert_1/3` は、要素の大小で、入れる側を選びます。
同じ要素が見つかったときの扱いは、この抜粋の先にあります。集合の中には同じ要素が二つ入らないので、そこでエラーを起こすのが、この関数の役目です。

## ここがすごい

### 集合の性質を、探索の途中で守る

集合に要素を入れるとき、同じ要素があるかどうかは、木の探索の途中で分かります。
余分な検査を別に書かず、探索の中で一緒に確かめるので、コードが短く済みます。

### 数と木を一緒に返す

`gb_sets` の値は、要素数と木の組です。追加のたびに、数も一緒に更新されます。
後から `size/1` を呼んでも、木を数え直す必要はありません。

### 比率の定数を、マクロで隠す

`?pow` や `?p` は、ソースの上の方で定義されたマクロです。
読み手は、`insert/2` の本体だけを見れば、「要素数を一つ増やして、木に入れる」という流れが分かります。細かい数字は、マクロの定義に任されています。

## まとめ

`gb_sets:insert(3, gb_sets:from_list([1, 2]))` は、要素 `1`、`2`、`3` を持つ集合を返します。
同じ要素をもう一度入れると、集合の性質を守るためにエラーになります。
