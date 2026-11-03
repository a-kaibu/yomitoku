---
title: "64 個ずつの枝を、下位 6 ビットで決めるマスク"
description: "Data.IntSet の内部で、整数を 1 語（64 ビット）ごとに分けるための定数 suffixBitMask。下位 6 ビットが、語の中の位置を表す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/IntSet/Internal.hs
lines: [2020, 2021]
function: "suffixBitMask"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, ハック]
---

## ひとことで

`suffixBitMask` は、`IntSet` の内部で使われる定数です。値は、語（ワード）のビット数から 1 を引いた数、つまり 64 ビットの環境では `63` です。二進数では、下位 6 ビットがすべて 1 の形（`0b111111`）になります。

`IntSet` は、整数の集合を、64 個ずつのまとまりに分けてビットで持ちます。そのまとまりの中の位置を表すのが、この定数です。

## コード

```haskell:line-numbers=2020
suffixBitMask :: Int
suffixBitMask = finiteBitSize (undefined::Word) - 1
```

## 前提知識

- **`IntSet`**: 整数だけを入れる集合です。各要素を 1 ビットで表すので、密な数の集合を少ないメモリで持てます。
- **語（ワード）**: CPU が一度に扱えるビット数の単位です。64 ビットの環境では、64 個の要素を 1 語にまとめられます。
- **`finiteBitSize`**: 型のビット数を返す関数です。`(undefined::Word)` は、型だけを伝えるための値です。
- **`-1` と 2 の累乗**: 2 の累乗から 1 を引くと、下位のビットがすべて 1 になります。`64 - 1 = 63` の 2 進数は `111111` です。

## 何をしているか

### 1. ビット数から 1 を引く

```haskell:line-numbers=2021
suffixBitMask = finiteBitSize (undefined::Word) - 1
```

`finiteBitSize (undefined::Word)` は、`Word` のビット数（64）を返します。そこから 1 を引くと 63 になり、下位 6 ビットを取り出すマスクとして使えます。

### 2. 上位のマスクは補数で作る

`prefixBitMask` は、この値の補数（すべてのビットを反転したもの）です。上位のビットだけが 1 になり、「どのまとまりか」を表します。

## ここがすごい

64 という数を、ビットの幅から計算しています。環境が 32 ビットなら 31 になり、コードを書き換えずに、どちらでも正しく動きます。

また、2 つのマスクを補数の関係で作ることで、整数を「まとまりの番号」と「まとまりの中の位置」の 2 つに、素早く分けられます。その分け方を、定数だけで表しています。

## まとめ

- ビット数から定数を計算すると、環境が変わっても正しく動く。
- 2 の累乗から 1 を引くと、下位ビットを取り出すマスクになる。
- 補数を使うと、上位の部分を取り出すマスクを簡単に作れる。
