---
title: "バイト列を 4 バイトずつ int として読み、31 倍しながら混ぜる"
description: "Netty の ByteBufUtil.hashCode(ByteBuf)。読めるバイトを 4 つずつ int にし、31 を掛けて足していく。端数のバイトは 1 つずつ足し、結果が 0 なら 1 にする。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2012 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: buffer/src/main/java/io/netty/buffer/ByteBufUtil.java
lines: [208, 236]
function: "ByteBufUtil.hashCode"
difficulty: 2
format: 2
tags: [ハッシュ, 文字列処理, 最適化]
---

## ひとことで

`hashCode(buffer)` は、`ByteBuf` の読める部分（まだ読んでいないバイト）から、ハッシュ値（整数の指紋）を作るメソッドです。同じ内容のバッファからは、同じ値が出ます。

Netty は、バッファの中身をハッシュ表のキーにしたり、等しさを比べたりするときに、この値を使います。バイトを 1 つずつ混ぜるより速くなるように、4 バイトずつまとめて処理しています。

## コード

```java:line-numbers=208
    public static int hashCode(ByteBuf buffer) {
        final int aLen = buffer.readableBytes();
        final int intCount = aLen >>> 2;
        final int byteCount = aLen & 3;

        int hashCode = EmptyByteBuf.EMPTY_BYTE_BUF_HASH_CODE;
        int arrayIndex = buffer.readerIndex();
        if (buffer.order() == ByteOrder.BIG_ENDIAN) {
            for (int i = intCount; i > 0; i --) {
                hashCode = 31 * hashCode + buffer.getInt(arrayIndex);
                arrayIndex += 4;
            }
        } else {
            for (int i = intCount; i > 0; i --) {
                hashCode = 31 * hashCode + swapInt(buffer.getInt(arrayIndex));
                arrayIndex += 4;
            }
        }

        for (int i = byteCount; i > 0; i --) {
            hashCode = 31 * hashCode + buffer.getByte(arrayIndex ++);
        }

        if (hashCode == 0) {
            hashCode = 1;
        }

        return hashCode;
    }
```

## 前提知識

- **ハッシュ値**: 大量のデータを、1 つの `int` に要約した値です。同じデータなら同じ値になりますが、違うデータでも同じ値になることがあります。
- **31 倍のローリングハッシュ**: 「今までの値 × 31 + 次の値」と繰り返す方法です。Java の `String` のハッシュも、この考え方です。31 は、掛け算を速くしつつ、値を散らすのに適した素数です。
- **`getInt` と `getByte`**: バッファから 4 バイトを `int` として、または 1 バイトを読みます。`ByteOrder` によって、4 バイトの並び方が変わります。
- **`swapInt`**: バイトの並びを逆にする関数です。リトルエンディアンのバッファでも、ビッグエンディアンと同じ値を得るために使います。
- **端数**: 読めるバイト数を 4 で割った余りのバイトです。

## 何をしているか

### 1. 4 バイトずつの int を、31 倍して混ぜる

```java:line-numbers=209
        final int aLen = buffer.readableBytes();
        final int intCount = aLen >>> 2;
        final int byteCount = aLen & 3;

        int hashCode = EmptyByteBuf.EMPTY_BYTE_BUF_HASH_CODE;
        int arrayIndex = buffer.readerIndex();
        if (buffer.order() == ByteOrder.BIG_ENDIAN) {
            for (int i = intCount; i > 0; i --) {
                hashCode = 31 * hashCode + buffer.getInt(arrayIndex);
                arrayIndex += 4;
            }
        } else {
            for (int i = intCount; i > 0; i --) {
                hashCode = 31 * hashCode + swapInt(buffer.getInt(arrayIndex));
                arrayIndex += 4;
            }
        }
```

`intCount` は、読めるバイト数を 4 で割った個数です。ビッグエンディアンなら `getInt` の値をそのまま使い、リトルエンディアンなら `swapInt` で並びを直します。どちらでも、`31 * hashCode + 値` の形で混ぜていきます。

### 2. 端数のバイトを 1 つずつ混ぜる

```java:line-numbers=226

        for (int i = byteCount; i > 0; i --) {
            hashCode = 31 * hashCode + buffer.getByte(arrayIndex ++);
        }
```

4 で割り切れなかった残りのバイトを、1 つずつ同じ式で混ぜます。

### 3. 結果が 0 なら 1 にする

```java:line-numbers=230

        if (hashCode == 0) {
            hashCode = 1;
        }

        return hashCode;
```

結果が 0 になったときは 1 に変えて返します。空のバッファの値（`EMPTY_BYTE_BUF_HASH_CODE`）とは別に、0 を特別な値として残さないためと考えられます（コードには理由は書かれていません）。

## ここがすごい

- **4 バイトずつ読む**: 1 バイトずつ混ぜる場合より、掛け算と足し算の回数が約 4 分の 1 になります。
- **バイト順を統一する**: リトルエンディアンでも、`swapInt` で同じ値を作るので、バッファの並び方に関係なく、同じ内容なら同じハッシュになります。
- **0 を避ける**: 結果を 0 にしないことで、「ハッシュ値が 0 のもの」を特別扱いしなくて済みます。
- **読み取りだけで済む**: バッファの読み取り位置（`readerIndex`）を変えず、`arrayIndex` で位置を進めるので、中身が壊れません。

## まとめ

- `hashCode` は、読めるバイトを 4 つずつ `int` にし、31 倍しながら足していく。
- 端数は 1 バイトずつ、同じ式で足す。
- 結果が 0 なら 1 にして返す。バイト順は、ビッグエンディアンに揃えてから混ぜる。
