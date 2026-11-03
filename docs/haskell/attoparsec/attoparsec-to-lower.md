---
title: "英字の大文字を、ビットを足すだけで小文字にする"
description: "attoparsec の toLower。ASCII の大文字は 65〜90 で、小文字との差は 32 だけ。範囲を確かめて 32 を足すだけで変換している。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [178, 180]
function: "toLower"
difficulty: 1
format: 2
tags: [文字列処理, Unicode, パース]
---

## ひとことで

`toLower` は、1 バイト（`Word8`）の値を受け取り、それが英字の大文字なら小文字に変える関数です。英字以外は、そのまま返します。

## コード

```haskell:line-numbers=178
toLower :: Word8 -> Word8
toLower w | w >= 65 && w <= 90 = w + 32
          | otherwise          = w
```

## 前提知識

- **`Word8`**: 0 から 255 までの数を入れられる、1 バイトの整数型です。文字を数の値で扱うときに使います。
- **ASCII**: 英数字や記号を、0 から 127 までの数に割り当てた決まりです。`A` は 65、`a` は 97 です。
- **ガード（`|`）**: 条件を上から順に調べて、最初に当たった式を返す書き方です。
- **`otherwise`**: 「それ以外のすべて」を表す条件です。

## 何をしているか

### 1. 大文字の範囲を確かめる

```haskell:line-numbers=179
toLower w | w >= 65 && w <= 90 = w + 32
```

`65` は `A`、`90` は `Z` の値です。この範囲に入るかを調べます。入っていれば、`w + 32` を返します。

### 2. それ以外はそのまま返す

```haskell:line-numbers=180
          | otherwise          = w
```

数字や記号、すでに小文字のものは、そのまま `w` を返します。

## ここがすごい

ASCII では、大文字と小文字の差がちょうど 32 です。そのため、変換表を用意しなくても、足し算 1 回で変換できます。`2 の 5 乗` である 32 は、ビットで見ると 1 つのビットを立てるだけの違いです。

この関数は、文字列を 1 バイトずつ読むパーサの中で使われます。表を引くよりも軽く、速く判定できます。

## まとめ

- 文字コードの規則を知ると、変換が足し算で済むことがある。
- 範囲を先に調べておくと、変換してはいけない文字を守れる。
- 1 バイトずつ扱う処理では、小さく速い関数が好まれる。
