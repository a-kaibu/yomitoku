---
title: "掛け算の上位ビットで、乱数の範囲を決める"
description: "random ライブラリの unbiasedWordMult32RM。32 ビットの乱数と範囲の幅を掛けて、上位 32 ビットを結果にする。割り算を使わない偏りのない方法。"
language: haskell
project: "random"
repo: https://github.com/haskell/random
license: "BSD-3-Clause"
copyright: "(c) The University of Glasgow 2001"
commit: "b0ae8e4df9fd1a49217a044ec16e64b10c70dd78"
file: src/System/Random/Internal.hs
lines: [1681, 1684]
function: "unbiasedWordMult32RM"
difficulty: 3
format: 2
tags: [乱数, 数値計算, 最適化]
---

## ひとことで

`unbiasedWordMult32RM` は、指定した範囲の整数を、掛け算を使って作る関数です。32 ビットの乱数と範囲の幅を掛け、その上位の 32 ビットを取り出します。

割り算（剰余）を使う方法より速く、しかも偏りが少ない方法です。論文（Lemire の方法）に基づいて作られています。

## コード

```haskell:line-numbers=1681
unbiasedWordMult32RM :: forall a g m. (Integral a, StatefulGen g m) => (a, a) -> g -> m a
unbiasedWordMult32RM (b, t) g
  | b <= t = (+ b) . fromIntegral <$> unbiasedWordMult32 (fromIntegral (t - b)) g
  | otherwise = (+ t) . fromIntegral <$> unbiasedWordMult32 (fromIntegral (b - t)) g
```

## 前提知識

- **範囲の幅**: `t - b` のように、上限と下限の差です。
- **上位と下位のビット**: 64 ビットの積の上位 32 ビットは、「範囲の割合」を表します。乱数が大きいほど、結果も大きくなります。
- **`fromIntegral`**: 整数の型を変換する関数です。
- **符号なしの整数**: 負の値を持たない整数で、幅を正しく表します。

## 何をしているか

### 1. 範囲の大小を揃える

```haskell:line-numbers=1683
  | b <= t = (+ b) . fromIntegral <$> unbiasedWordMult32 (fromIntegral (t - b)) g
  | otherwise = (+ t) . fromIntegral <$> unbiasedWordMult32 (fromIntegral (b - t)) g
```

`b <= t` なら、幅は `t - b`、そうでなければ `b - t` です。どちらも非負の幅として、`unbiasedWordMult32` に渡します。結果には、小さいほうの値を足します。

### 2. 幅の範囲で乱数を作る

`unbiasedWordMult32` は、`0` から幅までの `Word32` の乱数を作ります。内部では、乱数と幅の積を求め、上位のビットを結果にします。

具体例で見ます。幅が 9 で、乱数が `0x80000000`（半分の値）なら、積の上位は約 4 になります。つまり、範囲の中ほどの値が出ます。

## ここがすごい

割り算の代わりに、掛け算と上位ビットの取り出しだけで範囲に写しています。割り算は掛け算より遅いので、乱数を大量に作る場面で効きます。

また、拒否する場合（引き直す場合）は、下位ビットを見て少しだけ判定します。この部分は、コメントで Lemire の論文を参照しています。アルゴリズムの出典を、コードのすぐ近くに残しているのも、読み手への親切です。

## まとめ

- 範囲への写像は、割り算より掛け算と上位ビットのほうが速い。
- 幅を非負に揃えてから計算すると、大小の分岐を一か所にできる。
- 出典となる論文を、コメントに残しておくと確かめやすい。
