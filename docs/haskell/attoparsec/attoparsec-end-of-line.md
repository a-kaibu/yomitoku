---
title: "行の終わりを、LF か CRLF のどちらでも読む"
description: "attoparsec の endOfLine。改行文字 LF（10）を読むか、CRLF（\r\n）を読めば成功する。どちらの改行の書き方にも対応する。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [495, 496]
function: "endOfLine"
difficulty: 1
format: 2
tags: [パース, 文字列処理, 移植性]
---

## ひとことで

`endOfLine` は、行の終わりを読むパーサです。Unix の改行 `LF`（バイトの値 10）と、Windows の改行 `CRLF`（`\r\n`）のどちらも読み取れます。

## コード

```haskell:line-numbers=495
endOfLine :: Parser ()
endOfLine = (word8 10 >> return ()) <|> (string "\r\n" >> return ())
```

## 前提知識

- **改行文字の違い**: Unix 系は `LF`（10）だけで行を終えます。Windows は `CR`（13）と `LF` の 2 文字で終えます。
- **`>>`**: 左の処理を実行してから右を実行する演算子です。
- **`return ()`**: 結果を捨てて、何もない値 `()` で成功させる処理です。
- **`<|>`**: 左が失敗したら右を試す演算子です。

## 何をしているか

### 1. LF を 1 つ読む

```haskell:line-numbers=496
endOfLine = (word8 10 >> return ()) <|> (string "\r\n" >> return ())
```

まず `word8 10` で LF を読みます。読めたら `return ()` で結果を捨てて、成功にします。

### 2. だめなら CRLF を読む

同じ行の右側では、`string "\r\n"` で、CR と LF の 2 文字を読みます。左が失敗したときだけ、この候補が試されます。

## ここがすごい

2 種類の改行を、`<|>` で並べるだけで扱えます。どちらが来ても、同じ結果（`()`）で成功するので、呼び出し側は改行の種類を気にしなくてよくなります。

先に LF を試し、だめなら CRLF を試すという順番も、ごく普通の読み方になっています。

## まとめ

- 複数の書き方を持つ部品は、`<|>` で候補を並べると書きやすい。
- 結果を `()` にそろえると、呼び出し側が種類を区別しなくてよい。
- 移植性（別の環境で動くこと）を考えると、改行の違いは大切な問題になる。
