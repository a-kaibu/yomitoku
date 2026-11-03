---
title: "Word8 と Char を、何もせずに行き来させる"
description: "バイトと文字を相互に変換する w2c。範囲のチェックを行わず、整数の変換だけで済ませる、ByteString の基本の部品。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "Copyright (c) Don Stewart 2005-2009"
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString/Internal/Type.hs
lines: [1082, 1083]
function: "w2c"
difficulty: 1
format: 2
tags: [文字列処理, 型システム, 最適化]
---

## ひとことで

`w2c` は、1 バイトの値 `Word8` を、`Char` に変換する関数です。`w2c` の `w` は Word8、`c` は Char を表します。

ByteString の中身はバイトですが、利用者は文字として扱いたい場面が多くあります。この関数は、その橋渡しを行います。

## コード

```haskell:line-numbers=1082
w2c :: Word8 -> Char
w2c = unsafeChr . fromIntegral
```

## 前提知識

- **`Word8`**: 0 から 255 までの、1 バイトの整数です。
- **`Char`**: Haskell の文字です。内部的には Unicode の番号を持ちます。
- **`fromIntegral`**: 整数の型を別の整数の型へ変える関数です。
- **`unsafeChr`**: 整数を文字に変える関数です。範囲の検査を行わないので、速く動きます。

## 何をしているか

### 1. 整数に変えてから文字にする

```haskell:line-numbers=1082
w2c :: Word8 -> Char
w2c = unsafeChr . fromIntegral
```

`fromIntegral` で `Word8` を `Int` に変え、`unsafeChr` で文字にします。値 `65` の `Word8` は、`'A'` になります。

### 2. 変換は実行時にほとんど何もしない

コメントにあるように、この変換は「何もしない」に近い処理です。`INLINE` の指定があるので、呼び出し先に直接展開されます。結果として、ほぼ値をそのまま渡すだけになります。

## ここがすごい

範囲の検査を省いているのが、この関数の鍵です。`Word8` の値は、もともと 0 から 255 なので、`Char` の範囲に必ず収まります。だから、確認は不要だと判断しています。

一方、「何もしない」ことを型と名前で明示しているのも大事です。読む人は、ここでデータが失われないと安心して読めます。

## まとめ

- 値の範囲が保証されていれば、検査を省ける。
- 変換が安全だと分かる理由を、コメントに残すと読みやすい。
- 小さな変換は `INLINE` で、実行時の手間をほぼゼロにできる。
