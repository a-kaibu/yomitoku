---
title: "マスクで切って、外れたら引き直す乱数"
description: "random ライブラリの unsignedBitmaskWithRejectionM。乱数の下位ビットを範囲の幅で切り、範囲を超えたら引き直すことで、偏りなく整数を作る。"
language: haskell
project: "random"
repo: https://github.com/haskell/random
license: "BSD-3-Clause"
copyright: "(c) The University of Glasgow 2001"
commit: "b0ae8e4df9fd1a49217a044ec16e64b10c70dd78"
file: src/System/Random/Internal.hs
lines: [1758, 1769]
function: "unsignedBitmaskWithRejectionM"
difficulty: 3
format: 2
tags: [乱数, 数値計算, アルゴリズム]
---

## ひとことで

`unsignedBitmaskWithRejectionM` は、0 から `range` までの整数を、偏りなく作る関数です。乱数を生成し、範囲を覆うマスクで切り、範囲を超えたら生成し直します。

単純に `乱数 mod (range + 1)` とすると、数の出やすさに偏りが出ます。この関数は、偏りを生まないために、引き直しを使っています。

## コード

```haskell:line-numbers=1758
unsignedBitmaskWithRejectionM ::
  forall a g m. (Ord a, FiniteBits a, Num a, StatefulGen g m) => (g -> m a) -> a -> g -> m a
unsignedBitmaskWithRejectionM genUniformM range gen = go
  where
    mask :: a
    mask = complement zeroBits `shiftR` countLeadingZeros (range .|. 1)
    go = do
      x <- genUniformM gen
      let x' = x .&. mask
      if x' > range
        then go
        else pure x'
```

## 前提知識

- **乱数生成器（`StatefulGen`）**: 乱数を次々に作る、状態を持つ生成器です。`genUniformM` は、その生成器から 1 つの値を取る関数です。
- **剰余の偏り**: 範囲の数が 2 の累乗でないとき、`mod` で割ると、一部の数が他より出やすくなります。
- **`complement zeroBits`**: 全ビットが 1 の値です。
- **`countLeadingZeros`**: 上位の 0 の数を返す関数です。範囲の幅を決めるために使います。

## 何をしているか

### 1. 範囲を覆うマスクを作る

```haskell:line-numbers=1763
    mask = complement zeroBits `shiftR` countLeadingZeros (range .|. 1)
```

`range` の最上位ビットより大きい、すべて 1 のマスクを作ります。たとえば範囲が 5（二進数で `101`）なら、マスクは `111`（7）です。このマスクは、範囲より少し大きい幅を持ちます。

### 2. 乱数を切って、範囲内なら採用する

```haskell:line-numbers=1765
      x <- genUniformM gen
      let x' = x .&. mask
      if x' > range
        then go
        else pure x'
```

乱数 `x` とマスクの「かつ」を取り、`x'` とします。`x'` が範囲を超えていたら、`go` で引き直します。超えていなければ、その値を返します。

## ここがすごい

範囲内の値だけを採用するので、どの数も同じ確率で出ます。偏りをなくすための、最も単純で確かな方法です。マスクは範囲を覆う最小の 2 の累乗なので、引き直しの回数は平均で 2 回未満に抑えられます。

また、乱数の生成と判定を、`go` という 1 つの再帰にまとめています。生成器は状態を持つので、その状態を次の呼び出しに正しく渡せる書き方になっています。

## まとめ

- 範囲つきの乱数は、剰余より引き直しのほうが偏りがない。
- マスクで切る範囲を、範囲より少し大きい 2 の累乗にすると、引き直しが少ない。
- 状態を持つ生成器は、再帰の中で次々に渡すと扱いやすい。
