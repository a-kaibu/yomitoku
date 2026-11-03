---
title: "バイト列の中で、ひとつの値が何回出てくるかを数える"
description: "bytestring の count。指定したバイトが、バイト列に何回現れるかを、memchr を使う C の関数で数える。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "\"Copyright (c) Don Stewart 2005-2009\""
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString.hs
lines: [1324, 1326]
function: "count"
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, 最適化]
---

## ひとことで

`count` は、バイト列の中に、指定したバイトが何回現れるかを数える関数です。結果は `Int` で返します。

## コード

```haskell:line-numbers=1324
count :: Word8 -> ByteString -> Int
count w (BS x m) = accursedUnutterablePerformIO $ unsafeWithForeignPtr x $ \p ->
    fromIntegral <$> c_count p (fromIntegral m) w
```

## 前提知識

- **`Word8`**: 1 バイトの数です。文字 `a` などは、この数で表されます。
- **`C の関数`**: Haskell の外で書かれた関数を呼び出す仕組みです。`c_count` は、その 1 つです。
- **`fromIntegral`**: 数の型を変換します。C の関数の結果は `CLong` などで返るので、`Int` に直します。

## 何をしているか

### 1. バイト列の番地を取り出す

```haskell:line-numbers=1325
count w (BS x m) = accursedUnutterablePerformIO $ unsafeWithForeignPtr x $ \p ->
```

`BS x m` は、バッファの `ForeignPtr` と長さ `m` です。`unsafeWithForeignPtr` で、その番地を一時的に使える形にしています。

### 2. C の関数で数える

```haskell:line-numbers=1326
    fromIntegral <$> c_count p (fromIntegral m) w
```

`c_count p m w` は、番地 `p` から長さ `m` の範囲で、`w` が何回出てくるかを数える C の関数です。その結果を `fromIntegral` で `Int` に変えています。

## ここがすごい

1 バイトずつ数えるのではなく、C の高速な関数に任せています。内部では、`memchr` を使って一致する場所を次々に見つけていくので、大きなバイト列でも速く数えられます。

コメントに書かれているとおり、「要素を並べて長さを取る」と同じ意味ですが、中間のリストを作らないので、メモリも節約できます。

## まとめ

- 出現回数を数えるなら、中間のリストを作らずに数える方法が速い。
- 高速な C の関数を呼ぶと、ループを自分で書くより効率が良い。
- 関数の意味は、同じ結果を返す素朴な式（長さを取る）と比べると分かりやすい。
