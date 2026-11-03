---
title: "バイト列が、別のバイト列の末尾と一致するかを調べる"
description: "bytestring の isSuffixOf。ふたつ目のバイト列の末尾の部分を、memcmp で一度に比べる。逆順にする必要はない。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "\"Copyright (c) Don Stewart 2005-2009\""
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString.hs
lines: [1524, 1531]
function: "isSuffixOf"
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, 最適化]
---

## ひとことで

`isSuffixOf` は、ひとつ目のバイト列が、ふたつ目のバイト列の末尾と同じかどうかを調べる関数です。

## コード

```haskell:line-numbers=1524
isSuffixOf :: ByteString -> ByteString -> Bool
isSuffixOf (BS x1 l1) (BS x2 l2)
    | l1 == 0   = True
    | l2 < l1   = False
    | otherwise = accursedUnutterablePerformIO $ unsafeWithForeignPtr x1 $ \p1 ->
        unsafeWithForeignPtr x2 $ \p2 -> do
            i <- memcmp p1 (p2 `plusPtr` (l2 - l1)) (fromIntegral l1)
            return $! i == 0
```

## 前提知識

- **接尾辞（suffix）**: ある文字列の末尾にくっつく部分のことです。例えば `abc` の接尾辞には `c` や `bc` があります。
- **`plusPtr`**: 番地に、バイト数を足して別の番地を作る操作です。
- **`memcmp`**: 2 つのメモリの範囲を比べる C の関数です。

## 何をしているか

### 1. 空の接尾辞は必ず一致する

```haskell:line-numbers=1526
    | l1 == 0   = True
```

ひとつ目が空なら、どんな文字列の末尾とも一致するので `True` です。

### 2. 短すぎるなら一致しない

```haskell:line-numbers=1527
    | l2 < l1   = False
```

ふたつ目のほうが短ければ、末尾に入りきらないので `False` になります。

### 3. 末尾の部分だけを比べる

```haskell:line-numbers=1528
    | otherwise = accursedUnutterablePerformIO $ unsafeWithForeignPtr x1 $ \p1 ->
        unsafeWithForeignPtr x2 $ \p2 -> do
            i <- memcmp p1 (p2 `plusPtr` (l2 - l1)) (fromIntegral l1)
            return $! i == 0
```

ふたつ目の番地から、`l2 - l1` バイト進んだ位置を選びます。そこから `l1` バイトを `memcmp` で比べるので、末尾だけを見ることになります。

## ここがすごい

接尾辞の判定を、ふたつのバイト列を逆順にしてから接頭辞の判定をする方法でも書けます。しかし、この実装は逆順にする手間を省き、番地を進めるだけで末尾を指しています。

メモリの配置を理解していると、同じ問題を別の見方で解けることがよく分かる例です。

## まとめ

- 末尾の一致は、末尾の番地を計算して比べると、逆順にせずに済む。
- 接頭辞の判定と並べて読むと、番地の使い方の違いが見える。
- 長さの確認を先にすると、範囲外の読み取りを防げる。
