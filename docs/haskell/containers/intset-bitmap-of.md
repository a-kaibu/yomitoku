---
title: "整数 1 つを、1 ビットの印にする「bitmapOf」"
description: "Data.IntSet の内部で、整数を 1 ビットの印（ビットマップ）に変える bitmapOf。語の中の位置だけを使って、ビットを立てる。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/IntSet/Internal.hs
lines: [2040, 2041]
function: "bitmapOf"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

`bitmapOf` は、整数 `x` を、その語の中でのビットの印（ビットマップ）に変換します。`x` が 5 なら、5 番目のビットだけが 1 の値になります。

`IntSet` は、同じ語に入る要素を、1 つの整数（ビットマップ）にまとめて持ちます。新しい要素を入れるには、この関数で印を作り、既存の印と「または」を取ります。

## コード

```haskell:line-numbers=2040
bitmapOf :: Int -> BitMap
bitmapOf x = bitmapOfSuffix (suffixOf x)
```

## 前提知識

- **ビットマップ**: 各ビットが、ある要素があるかどうかを表す整数です。
- **`suffixOf`**: 整数の下位のビット（語の中の位置）を取り出す関数です。前の記事のマスクを使います。
- **`bitmapOfSuffix`**: 位置 `s` のビットを 1 にした値を作る関数です。`1 `shiftLL` s` で作ります。
- **`where` が無い 1 行の定義**: `bitmapOf x = bitmapOfSuffix (suffixOf x)` のように、2 つの関数をつないでいます。

## 何をしているか

### 1. 語の中の位置を取り出す

`suffixOf x` で、`x` の下位 6 ビット（0 から 63 の数）を取り出します。これが、語の中での位置です。

### 2. その位置のビットを立てる

```haskell:line-numbers=2036
bitmapOfSuffix :: Int -> BitMap
bitmapOfSuffix s = 1 `shiftLL` s
```

`bitmapOfSuffix s` は、`1` を `s` ビット左にずらします。たとえば `s` が 5 なら、結果は `0b100000` です。

具体例で見ます。`x` が 69 のとき、下位 6 ビットは 5（69 は 64 + 5）です。したがって、`bitmapOf 69` は `0b100000`（5 番目のビット）になります。

## ここがすごい

要素を 1 つずつ配列に入れる代わりに、語の中の位置だけをビットにします。ビットの「または」を取れば、複数の要素を一度にまとめられるので、集合の演算がとても速くなります。

また、`suffixOf` と `bitmapOfSuffix` を分けておくことで、位置の取り出しと、ビットの作成を別々に使えます。部品を分けて、組み合わせて使える設計です。

## まとめ

- 整数の集合は、語ごとのビットマップで表すと省メモリで速い。
- 要素の位置は、下位ビットを取り出して、1 を左にずらせば印になる。
- 小さな関数に分けると、同じ部品を別の場面でも使える。
