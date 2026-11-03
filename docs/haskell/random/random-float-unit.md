---
title: "32 ビットの乱数から、0 から 1 の Float を作る"
description: "random ライブラリの uniformFloat01M。32 ビットの乱数を最大値で割り、Float の範囲 0 から 1 に写す。Double 版の 32 ビット版。"
language: haskell
project: "random"
repo: https://github.com/haskell/random
license: "BSD-3-Clause"
copyright: "(c) The University of Glasgow 2001"
commit: "b0ae8e4df9fd1a49217a044ec16e64b10c70dd78"
file: src/System/Random/Internal.hs
lines: [1521, 1526]
function: "uniformFloat01M"
difficulty: 2
format: 2
tags: [乱数, 数値計算, 型システム]
---

## ひとことで

`uniformFloat01M` は、乱数生成器から `Float`（単精度の小数）を 1 つ作る関数です。作る値は 0 から 1 までの範囲に入ります。

前の記事の `uniformDouble01M` と同じ考え方です。違うのは、乱数が 32 ビットであることと、小数の型が `Float` であることだけです。

## コード

```haskell:line-numbers=1521
uniformFloat01M :: forall g m. StatefulGen g m => g -> m Float
uniformFloat01M g = do
  w32 <- uniformWord32 g
  return $ fromIntegral w32 / m
  where
    m = fromIntegral (maxBound :: Word32) :: Float
```

## 前提知識

- **`Float`**: 単精度の小数です。`Double` より、有効な桁数が少ない型です。
- **`uniformWord32`**: 生成器から、32 ビットの符号なし整数を取り出す関数です。
- **`Word32` の最大値**: 2 進数で 32 個の 1 が並んだ値で、約 42 億です。

## 何をしているか

### 1. 32 ビットの乱数を取り出す

```haskell:line-numbers=1522
uniformFloat01M g = do
  w32 <- uniformWord32 g
```

`uniformWord32` で、32 ビットの乱数 `w32` を取り出します。

### 2. 最大値で割る

```haskell:line-numbers=1524
  return $ fromIntegral w32 / m
  where
    m = fromIntegral (maxBound :: Word32) :: Float
```

`w32` を `Float` にし、`Word32` の最大値（同じく `Float` にしたもの）で割ります。結果は 0 から 1 までの `Float` です。

## ここがすごい

`Double` 版と同じ形で書かれているので、2 つの関数を並べて読むと、違いが一目で分かります。型と乱数の幅だけが違い、考え方は同じです。

また、`Float` は約 24 ビットの精度しかないので、32 ビットの乱数の細かい違いは丸められます。小数の型の精度と、乱数の幅がずれるときは、どこで丸めが起きるかを意識することが大切です。

## まとめ

- 乱数の幅と小数の精度が違うとき、丸めの影響を意識する。
- 同じ考え方の関数を型ごとに用意すると、読みやすく保守しやすい。
- 整数の最大値で割る方法は、型を変えても同じように使える。
