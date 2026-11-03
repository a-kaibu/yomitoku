---
title: "指定したバイトを 1 つ読み取る"
description: "attoparsec の word8。指定した 1 バイトと一致すれば読み進め、違えば失敗する。失敗の理由には、期待したバイトが分かる表示を付ける。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [452, 453]
function: "word8"
difficulty: 1
format: 2
tags: [パース, 文字列処理, 防御的プログラミング]
---

## ひとことで

`word8 c` は、入力の次のバイトが `c` と同じであれば、そのバイトを読み取るパーサです。違うときは失敗し、失敗の理由として `c` が分かる表示を残します。

## コード

```haskell:line-numbers=452
word8 :: Word8 -> Parser Word8
word8 c = satisfy (== c) <?> show c
```

## 前提知識

- **`Word8`**: 1 バイトの整数を表す型です。`word8 10` の `10` は、改行文字の番号です。
- **`satisfy`**: 条件を満たすバイトを 1 つ読む、基本のパーサです。
- **`<?>`**: パーサに「名前」を付ける演算子です。失敗したときに、その名前がエラーに出ます。
- **`show`**: 値を文字列に変える関数です。

## 何をしているか

### 1. 一致する 1 バイトだけを読む

```haskell:line-numbers=453
word8 c = satisfy (== c) <?> show c
```

`(== c)` は、「`c` と等しいか」を調べる関数です。`satisfy` にこの関数を渡すと、条件に合うバイトだけが読み取られます。

### 2. 失敗したときの名前を付ける

`<?> show c` は、失敗したときに、期待していた値を表示させるための印です。数値のままでも、どのバイトを探していたかが分かります。

## ここがすごい

一致の判定を、関数 `(== c)` として `satisfy` に渡すだけで済みます。1 バイトを読むための専用の仕組みを、もう一度書く必要がありません。

また、`<?>` で失敗の理由を付けているので、パースに失敗したとき、どこで何を期待していたかが分かりやすくなります。

## まとめ

- 「一致するものを読む」は、条件の関数を渡す形で書ける。
- 部品を組み合わせると、小さな関数でも十分に役に立つ。
- 失敗の理由を付けておくと、デバッグがしやすい。
