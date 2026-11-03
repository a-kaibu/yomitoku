---
title: "桁の多い数を、指数の形を避けて書き出す"
description: "aeson の scientific。JSON の数値を、10 の累乗の指数が小さいときは整数として、大きいときは指数の形で出力する。"
language: haskell
project: "aeson"
repo: https://github.com/haskell/aeson
license: "BSD-3-Clause"
copyright: "Copyright (c) 2011, MailRank, Inc. 2014-2026 Aeson project contributors"
commit: "1dd465c115ccface4cbb5f17f038c5843d4d4ed9"
file: src/Data/Aeson/Encoding/Builder.hs
lines: [143, 148]
function: "scientific"
difficulty: 3
format: 2
tags: [数値計算, 入出力, 最適化]
---

## ひとことで

`scientific` は、`Scientific` 型の数（十進数の係数と指数の組）を、JSON の数値として書き出す関数です。指数が小さいときは、普通の整数の形で書きます。

たとえば `1.5e3` は、整数の `1500` と書けます。この関数は、そうできる場合は整数で、できない場合だけ指数の形を使います。

## コード

```haskell:line-numbers=143
scientific :: Scientific -> Builder
scientific s
    | e < 0 || e > 1024 = scientificBuilder s
    | otherwise = B.integerDec (coefficient s * 10 ^ e)
  where
    e = base10Exponent s
```

## 前提知識

- **`Scientific`**: 係数と 10 の指数の組で、十進数を表す型です。`係数 × 10^指数` の値になります。
- **`base10Exponent`**: 指数を取り出す関数です。
- **`coefficient`**: 係数を取り出す関数です。
- **`scientificBuilder`**: 指数の形（例 `1.5e-7`）で書き出す関数です。
- **ガード**: 条件を上から順に確かめます。

## 何をしているか

### 1. 指数の範囲で書き方を選ぶ

```haskell:line-numbers=145
    | e < 0 || e > 1024 = scientificBuilder s
    | otherwise = B.integerDec (coefficient s * 10 ^ e)
```

指数 `e` が負か、1024 より大きいなら、指数の形で書きます。そうでなければ、係数に `10^e` を掛けた整数を書きます。

### 2. 指数を取り出す

```haskell:line-numbers=147
  where
    e = base10Exponent s
```

`base10Exponent s` で、指数を取り出します。`where` で `e` という名前を付けています。

具体例で見ます。係数 15、指数 2 の値は、`15 × 10^2 = 1500` と整数で書かれます。指数が -7 のような値は、指数の形で書かれます。

## ここがすごい

指数の範囲を先に確かめるので、極端に大きな数の 10 の累乗を、無駄に計算せずに済みます。1024 という上限は、長い数字の列を作りすぎないための安全策です。

また、`scientificBuilder` と整数の書き方を分けているので、どちらの場合でも、適した方法で出力できます。数字の見た目と、計算の量の両方を考えた設計です。

## まとめ

- 十進数の表示は、指数の大きさで書き方を変えると読みやすい。
- 極端な値は、計算を抑える上限を決めておくと安全。
- 条件を満たすかを先に確かめると、無駄な計算を避けられる。
