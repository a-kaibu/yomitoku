---
title: "桁数の見積もりを、割り算だけで決める"
description: "10 進数の表示で、64 ビットの語にいくつの桁が入るかを、2 進数のビット数から計算する base10。小さく見積もって、確実に収める。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) 2013 Bryan O'Sullivan"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Builder/Int/Digits.hs
lines: [36, 45]
function: "base10"
difficulty: 3
format: 2
tags: [数値計算, 最適化, 入出力]
---

## ひとことで

`base10` は、10 進数で表示するときの「基数の情報」を作る値です。ここで大事なのは、`maxWord`（10 の何乗までを 1 つの語で扱えるか）と、`maxDigits`（何桁ずつまとめて処理するか）の 2 つです。

整数を 10 進数にするとき、大きな数を一度に割ると、割り算の回数を減らせます。そのために、語（ワード）に収まる最大の桁数を、先に計算しておきます。

## コード

::: code-group

```haskell:line-numbers=36 [日本語訳]
base10 :: Base
base10 = Base
  { base = 10
  , maxWord = 10 ^ maxDigits10
  , maxDigits = maxDigits10
  } where
    -- log_10 2 = 0.301... > 3/10 なので、3/10 で近似する
    -- 一般には下からの近似だが、
    -- 丸めのおかげで、64 ビットの語では正確になる。
    maxDigits10 = finiteBitSize (0 :: Word) * 3 `div` 10
```

```haskell:line-numbers=36 [原文]
base10 :: Base
base10 = Base
  { base = 10
  , maxWord = 10 ^ maxDigits10
  , maxDigits = maxDigits10
  } where
    -- log_10 2 = 0.301... > 3/10
    -- In general this is an underapproximation, and it is close enough that
    -- the rounding makes it exact for 64-bit words.
    maxDigits10 = finiteBitSize (0 :: Word) * 3 `div` 10
```

:::

## 前提知識

- **`Word` の大きさ**: `Word` は符号なしの整数型で、ビット数は環境によって決まります。64 ビットの環境では 64 ビットです。
- **レコードの構文**: `Base { base = 10, maxWord = ..., maxDigits = ... }` は、名前付きの値を組み立てる書き方です。
- **`where` の中の定義**: `maxDigits10` は、`base10` の中だけで使う値です。
- **`finiteBitSize`**: 型のビット数を返す関数です。`(0 :: Word)` と書いて、`Word` の型を指定しています。
- **`div`**: 整数の割り算です。小数点以下は切り捨てられます。

## 何をしているか

### 1. 基数を決める

```haskell:line-numbers=37
base10 = Base
  { base = 10
  , maxWord = 10 ^ maxDigits10
  , maxDigits = maxDigits10
```

`base = 10` で基数を指定します。`maxWord = 10 ^ maxDigits10` は、10 を `maxDigits10` 回掛けた値です。これより大きい数は、2 つ以上の語に分けて扱います。

### 2. 語のビット数から桁数を決める

::: code-group

```haskell:line-numbers=44 [日本語訳]
    -- 丸めのおかげで、64 ビットの語では正確になる。
    maxDigits10 = finiteBitSize (0 :: Word) * 3 `div` 10
```

```haskell:line-numbers=44 [原文]
    -- the rounding makes it exact for 64-bit words.
    maxDigits10 = finiteBitSize (0 :: Word) * 3 `div` 10
```

:::

`finiteBitSize (0 :: Word) * 3 `div` 10` は、「ビット数 × 3 ÷ 10」を計算します。`log_10 2` が約 0.301 なので、ビット数に 0.3 を掛けると、10 進数で何桁ぶん表せるかが分かります。ここでは 3/10 で近似しているので、必ず少なめの桁数になります。

64 ビットなら、`64 * 3 div 10` は `19` です。10 の 19 乗は、64 ビットの `Word` に収まるので、安全な値です。

## ここがすごい

桁数を「少なめ」に見積もっているのが、この関数の工夫です。多めに見積もると、語からあふれてしまい、正しく計算できなくなります。少なめなら、確実に収まります。

また、`log_10 2` を正確な浮動小数点で計算せず、`3 div 10` という整数の計算だけで求めています。整数の計算だけで済むので、速くて、結果も必ず同じになります。

コメントにあるように、64 ビットの語では、この近似が正確な値になるように切り捨てが働きます。環境が変わったときに、この考えがどう効くかを読み取れる例です。

## まとめ

- 10 進数の変換では、語に収まる桁数を先に知っておくと速い。
- 桁数は、ビット数に `log_10 2` を掛けて見積もれる。
- 整数だけの計算で近似すると、結果が環境によらず確実になる。
