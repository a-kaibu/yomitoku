---
title: "要素を 2 つだけ持つ配列を作る「pair」"
description: "unordered-containers の HAMT 用の配列操作 pair。長さ 2 の配列を作り、2 つの値を入れる。衝突したキーの組を作るときに使う。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal/Array.hs
lines: [248, 252]
function: "pair"
difficulty: 1
format: 2
tags: [データ構造, 低レイヤ, 関数型]
---

## ひとことで

`pair x y` は、2 つの値 `x` と `y` を持つ長さ 2 の配列を作る関数です。配列を作って、その中で 2 つの場所に値を入れてから、変えられない形にして返します。

前の記事の `collision` が、この関数を使って、2 つのキーの葉をまとめています。

## コード

```haskell:line-numbers=248
pair :: a -> a -> Array a
pair x y = run $ do
    ary <- new 2 x
    write ary 1 y
    return ary
```

## 前提知識

- **`new 2 x`**: 長さ 2 の変更できる配列を作り、両方の場所を `x` で埋めます。
- **`write ary 1 y`**: 2 番目の場所（添字 1）に `y` を書き込みます。
- **`run`**: 変更できる配列を作る計算を、変更できない配列に変えて返す関数です。
- **添字は 0 から**: 配列の最初の場所は 0 です。

## 何をしているか

### 1. 長さ 2 の配列を作る

```haskell:line-numbers=249
pair x y = run $ do
    ary <- new 2 x
```

`new 2 x` で、2 つの場所が両方 `x` の配列を作ります。

### 2. 2 番目の場所に y を入れる

```haskell:line-numbers=251
    write ary 1 y
    return ary
```

`write ary 1 y` で、添字 1 を `y` に書き換えます。その配列を返します。

## ここがすごい

配列の中身を先に決めてから、変えられない形にして返します。外からは、最初から 2 つの値を持つ配列として見えます。途中で変更できる状態は、関数の中だけに閉じ込められています。

また、`x` で一度埋めてから `y` で上書きする形は、少し無駄に見えます。しかし、配列を作る関数は、中身を決める書き込みを 1 回ずつにまとめる書き方が基本です。部品を単純に保つための選択です。

## まとめ

- 小さな配列は、作ってから書き込み、変えられない形で返すと安全。
- 変更できる作業は、関数の中に閉じ込めると外から純粋に見える。
- 添字は 0 から数えるので、2 番目は 1 と書く。
