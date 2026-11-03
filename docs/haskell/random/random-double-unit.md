---
title: "乱数の整数を、0 から 1 の小数に変える"
description: "random ライブラリの uniformDouble01M。64 ビットの乱数を、その最大値で割って、0 から 1 までの Double を作る。"
language: haskell
project: "random"
repo: https://github.com/haskell/random
license: "BSD-3-Clause"
copyright: "(c) The University of Glasgow 2001"
commit: "b0ae8e4df9fd1a49217a044ec16e64b10c70dd78"
file: src/System/Random/Internal.hs
lines: [1443, 1448]
function: "uniformDouble01M"
difficulty: 2
format: 2
tags: [乱数, 数値計算, 型システム]
---

## ひとことで

`uniformDouble01M` は、乱数生成器から `Double`（小数）を 1 つ作る関数です。作る値は 0 から 1 までの範囲に入ります。

乱数の生成器は、整数しか作れません。この関数は、64 ビットの整数を、その最大値で割ることで、小数の範囲に写しています。

## コード

```haskell:line-numbers=1443
uniformDouble01M :: forall g m. StatefulGen g m => g -> m Double
uniformDouble01M g = do
  w64 <- uniformWord64 g
  return $ fromIntegral w64 / m
  where
    m = fromIntegral (maxBound :: Word64) :: Double
```

## 前提知識

- **`StatefulGen g m`**: 状態を持つ乱数生成器 `g` を、モナド `m` の中で使う仕組みです。
- **`uniformWord64`**: 生成器から、64 ビットの符号なし整数を 1 つ取り出す関数です。
- **`fromIntegral`**: 整数を、別の数の型へ変換する関数です。ここでは `Double` にします。
- **`maxBound`**: その型の最大値です。`Word64` の最大値は、すべてのビットが 1 の値です。

## 何をしているか

### 1. 64 ビットの乱数を取り出す

```haskell:line-numbers=1444
uniformDouble01M g = do
  w64 <- uniformWord64 g
```

`do` 記法で、生成器から 64 ビットの乱数 `w64` を取り出します。生成器は状態を進めながら、次の値を返します。

### 2. 最大値で割って、小数にする

```haskell:line-numbers=1446
  return $ fromIntegral w64 / m
  where
    m = fromIntegral (maxBound :: Word64) :: Double
```

`fromIntegral w64` で `Double` に変え、`m`（`Word64` の最大値を `Double` にしたもの）で割ります。`w64` が 0 なら 0.0、最大値なら 1.0 になります。その間の値は、ほぼ一様に出てきます。

## ここがすごい

整数の乱数を、割り算 1 回で小数の範囲に写しています。乱数の質は、もとの整数の一様さに任せ、変換は単純にしています。

ただし、`Double` の精度は 53 ビットなので、64 ビットの細かい違いは丸められます。関数の中身が単純なのは、この限界を理解したうえで、速さと簡潔さを選んだ結果です。

## まとめ

- 整数の乱数を小数にするには、最大値で割るのが基本の方法。
- 変換の精度（丸め）は、型のビット数で決まるので、意識しておくと安心。
- 生成器の状態は、モナドの中で自然に進められる。
