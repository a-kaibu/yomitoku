---
title: "バイト列が、別のバイト列の先頭と一致するかを調べる"
description: "bytestring の isPrefixOf。短いほうが長いほうの先頭と同じかを、memcmp で一度に比べる。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "\"Copyright (c) Don Stewart 2005-2009\""
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString.hs
lines: [1496, 1503]
function: "isPrefixOf"
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, 最適化]
---

## ひとことで

`isPrefixOf` は、ひとつ目のバイト列が、ふたつ目のバイト列の先頭と同じかどうかを調べる関数です。

## コード

```haskell:line-numbers=1496
isPrefixOf :: ByteString -> ByteString -> Bool
isPrefixOf (BS x1 l1) (BS x2 l2)
    | l1 == 0   = True
    | l2 < l1   = False
    | otherwise = accursedUnutterablePerformIO $ unsafeWithForeignPtr x1 $ \p1 ->
        unsafeWithForeignPtr x2 $ \p2 -> do
            i <- memcmp p1 p2 (fromIntegral l1)
            return $! i == 0
```

## 前提知識

- **接頭辞（prefix）**: ある文字列の先頭から続く部分のことです。例えば `abc` の接頭辞には `a` や `ab` があります。
- **`memcmp`**: 2 つのメモリの範囲を、バイトごとに比べる C の関数です。一致すれば 0 を返します。
- **`fromIntegral`**: 数の型を変換する関数です。ここでは長さを `memcmp` の型に合わせます。

## 何をしているか

### 1. 空の接頭辞は必ず一致する

```haskell:line-numbers=1498
    | l1 == 0   = True
```

ひとつ目が空なら、どんな文字列の先頭とも一致するので `True` です。

### 2. 短すぎるなら一致しない

```haskell:line-numbers=1499
    | l2 < l1   = False
```

ふたつ目のほうが短ければ、ひとつ目が入りきらないので `False` になります。

### 3. 先頭を一度に比べる

```haskell:line-numbers=1500
    | otherwise = accursedUnutterablePerformIO $ unsafeWithForeignPtr x1 $ \p1 ->
        unsafeWithForeignPtr x2 $ \p2 -> do
            i <- memcmp p1 p2 (fromIntegral l1)
            return $! i == 0
```

両方の番地を取り出し、ひとつ目の長さ分だけを `memcmp` で比べます。戻り値が 0 なら、すべてのバイトが等しいという意味なので `True` を返します。

## ここがすごい

1 バイトずつ `if` で比べるのではなく、C の高速な `memcmp` に比べる処理を任せています。長いバイト列でも、短い比較の仕事がまとめて行われます。

空や長さの判定を先に置くことで、無駄な比較を避けています。

## まとめ

- 接頭辞の判定は、長さの確認のあと、先頭の範囲をまとめて比べればよい。
- 低い層の高速な比較（`memcmp`）を使うと、速さが大きく変わる。
- 特別な場合（空・短すぎ）を先に分けると、本体の処理が簡単になる。
