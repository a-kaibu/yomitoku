---
title: "16 進数の 1 文字を、数の値に変える"
description: "text の hexDigitToInt。0〜9、a〜f、A〜F の文字を、文字コードの差から 0 から 15 の数に変換する。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) 2014 Bryan O'Sullivan"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Read.hs
lines: [62, 71]
function: "hexDigitToInt"
difficulty: 2
format: 2
tags: [文字列処理, 数値計算, ハック]
---

## ひとことで

`hexDigitToInt` は、16 進数の 1 文字を、数の値（0 から 15）に変換する関数です。`'0'` から `'9'`、`'a'` から `'f'`、`'A'` から `'F'` のどれにも対応します。

## コード

```haskell:line-numbers=62
hexDigitToInt :: Char -> Int
hexDigitToInt c
    | to0 < 10  = wordToInt to0
    | toa < 6   = wordToInt toa + 10
    | otherwise = wordToInt toA + 10
    where
        ordW = intToWord (ord c)
        to0 = ordW - intToWord (ord '0')
        toa = ordW - intToWord (ord 'a')
        toA = ordW - intToWord (ord 'A')
```

## 前提知識

- **16 進数**: 0 から 9 と、a から f（または A から F）を使って数を表す形式です。a は 10、f は 15 を表します。
- **文字コード**: `ord` で、文字を対応する番号に変えられます。
- **`Word`**: 0 以上の整数を表す型です。引き算で負になると、大きな数に折り返されます。
- **ガード（`|`）**: 条件を上から順に調べる書き方です。

## 何をしているか

### 1. 数字かどうかを確かめる

```haskell:line-numbers=64
    | to0 < 10  = wordToInt to0
```

`to0` は、`'0'` からの差です。その差が 10 より小さければ、0 から 9 の数字なので、そのまま値になります。

### 2. 小文字と大文字を確かめる

```haskell:line-numbers=65
    | toa < 6   = wordToInt toa + 10
    | otherwise = wordToInt toA + 10
```

`toa` は `'a'` からの差です。差が 6 より小さければ、`a` から `f` の範囲なので、10 を足します。そうでなければ、大文字の `A` から `F` として、同じように 10 を足します。

### 3. 差を求める部分

```haskell:line-numbers=69
        to0 = ordW - intToWord (ord '0')
```

文字の番号から、基準の文字の番号を引いています。こうすると、どの文字が何番目かが分かります。

## ここがすごい

`'0'` から `'9'` が連続し、`'a'` から `'f'` も連続していることを使っています。表を作らずに、引き算と比べ方だけで変換できます。

また、`Word` の引き算を使うと、範囲の外の文字は大きな値に折り返されます。それで「6 より小さいか」の確かめだけで、範囲の外を弾けるのも工夫です。

## まとめ

- 文字コードが連続していることを使うと、表なしで変換できる。
- 符号のない型の引き算は、範囲外の値を大きくして弾く働きをする。
- 大文字と小文字を分けて扱うと、読みやすく正しく書ける。
