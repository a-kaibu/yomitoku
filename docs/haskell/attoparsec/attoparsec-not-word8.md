---
title: "指定した 1 バイト以外を、1 つ読み取る"
description: "attoparsec の notWord8。指定したバイト以外のものを読み取る。一致したら失敗し、失敗の理由に期待しないバイトを表示する。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [457, 458]
function: "notWord8"
difficulty: 1
format: 2
tags: [パース, 文字列処理, 防御的プログラミング]
---

## ひとことで

`notWord8 c` は、入力の次のバイトが `c` 以外であれば、そのバイトを読み取るパーサです。`c` と同じだったときは失敗します。

## コード

```haskell:line-numbers=457
notWord8 :: Word8 -> Parser Word8
notWord8 c = satisfy (/= c) <?> "not " ++ show c
```

## 前提知識

- **`(/= c)`**: 「`c` と等しくない」を調べる関数です。`/=` は、等しくないという意味の比較演算子です。
- **`satisfy`**: 条件を満たす 1 バイトを読み取る、基本のパーサです。
- **`<?>`**: パーサに名前を付ける演算子です。失敗したときに、その名前が表示されます。
- **`++`**: 文字列どうしをつなげる演算子です。

## 何をしているか

### 1. 等しくないという条件を渡す

```haskell:line-numbers=458
notWord8 c = satisfy (/= c) <?> "not " ++ show c
```

`(/= c)` は、受け取ったバイトが `c` と違うかを調べる関数です。`satisfy` に渡すと、`c` 以外のバイトだけが読み取られます。

### 2. 失敗のときの名前を作る

`<?> "not " ++ show c` は、失敗したときに「not 数値」という表示を出すための名前です。何を期待していたかが、エラーから分かるようになっています。

## ここがすごい

`word8` の「一致する」の判定を、`/=` に変えるだけで、「一致しない」の読み取りが作れます。部品の一部を変えるだけで、反対の意味の関数になっています。

また、失敗の表示も一緒に作ることで、パースの失敗が分かりやすくなっています。

## まとめ

- 反対の条件は、比較を 1 つ変えるだけで作れる。
- 対になる関数は、同じ形で書くと読みやすい。
- 失敗の理由を付けると、どの入力が悪かったかが分かる。
