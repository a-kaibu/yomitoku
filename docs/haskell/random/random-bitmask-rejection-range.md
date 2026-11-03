---
title: "上限と下限の大小を気にせず、範囲の乱数を作る"
description: "random ライブラリの unsignedBitmaskWithRejectionRM。下限が上限より大きくても、順番を入れ替えて同じ範囲として扱う。"
language: haskell
project: "random"
repo: https://github.com/haskell/random
license: "BSD-3-Clause"
copyright: "(c) The University of Glasgow 2001"
commit: "b0ae8e4df9fd1a49217a044ec16e64b10c70dd78"
file: src/System/Random/Internal.hs
lines: [1722, 1726]
function: "unsignedBitmaskWithRejectionRM"
difficulty: 2
format: 2
tags: [乱数, 数値計算, 防御的プログラミング]
---

## ひとことで

`unsignedBitmaskWithRejectionRM` は、下限と上限の組 `(bottom, top)` を受け取り、その間の整数を作る関数です。下限が上限より大きくても、順番を入れ替えて同じ範囲として扱います。

前の記事の `unsignedBitmaskWithRejectionM` は、範囲の幅だけを受け取ります。この関数は、組から幅を計算し、呼び出し側の手間を減らします。

## コード

```haskell:line-numbers=1722
unsignedBitmaskWithRejectionRM (bottom, top) gen
  | bottom == top = pure top
  | otherwise = (b +) <$> unsignedBitmaskWithRejectionM uniformM r gen
  where
    (b, r) = if bottom > top then (top, bottom - top) else (bottom, top - bottom)
```

## 前提知識

- **符号なしの整数**: 負の数を持たない整数です。この関数は符号なしだけを扱うという注意が、ソースの上のコメントにあります。
- **`(b +) <$> ...`**: 結果に `b` を足す計算です。`<$>` は、関数を中の値に適用する演算子です。
- **`where` の組の分解**: `(b, r) = ...` で、2 つの値を同時に名前付けしています。
- **`bottom == top`**: 下限と上限が同じときの特別な場合です。

## 何をしているか

### 1. 範囲が 1 点なら、その値を返す

```haskell:line-numbers=1723
  | bottom == top = pure top
```

下限と上限が等しいなら、乱数は要りません。その値 `top` をそのまま返します。

### 2. 小さいほうを基準に幅を求める

```haskell:line-numbers=1726
    (b, r) = if bottom > top then (top, bottom - top) else (bottom, top - bottom)
```

下限が上限より大きければ、基準を上限にし、幅を `bottom - top` とします。そうでなければ、基準を下限にし、幅を `top - bottom` とします。どちらの場合も、基準 `b` は小さいほうの値です。

### 3. 幅で乱数を作り、基準を足す

```haskell:line-numbers=1724
  | otherwise = (b +) <$> unsignedBitmaskWithRejectionM uniformM r gen
```

幅 `r` を範囲として、前の記事の関数で乱数を作ります。そして、結果に基準 `b` を足して、目的の範囲の値にします。

## ここがすごい

下限と上限の大小を、最初に 1 か所で揃えています。呼び出す側は、どちらの順で書いても正しく動きます。小さな思いやりが、誤りを防いでいます。

また、乱数の計算は幅だけで済むので、範囲の位置は後から足すだけです。「幅を作る」と「位置をずらす」を分けた、シンプルな設計です。

## まとめ

- 範囲の入力は、大小の順番を先に揃えると誤りを防げる。
- 乱数は「幅」で作り、「位置」は後から足すと分けて考えられる。
- 特別な場合（1 点の範囲）は、先頭で返すと後の処理が単純になる。
