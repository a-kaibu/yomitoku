---
title: "バイト配列の比較を、8 バイトずつ後ろから行う"
description: "Netty の PlatformDependent0.equals。Unsafe で 8 バイト単位に読んで比べ、余りを 4 バイト、2 バイト、1 バイトの組み合わせで比べる。範囲が重なるように読むので、端数の分岐が少ない。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2013 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: common/src/main/java/io/netty/util/internal/PlatformDependent0.java
lines: [1023, 1050]
function: "PlatformDependent0.equals"
difficulty: 3
format: 2
tags: [最適化, 低レイヤ, 文字列処理]
---

## ひとことで

Netty の `ByteBuf` は、バイト配列の一部同士が等しいかを、高速に比べる必要があります。1 バイトずつ比べる代わりに、`PlatformDependent0.equals` は、Unsafe を使って、8 バイトを 1 つの `long` として読み、まとめて比べます。

## コード

```java:line-numbers=1023
    static boolean equals(byte[] bytes1, int startPos1, byte[] bytes2, int startPos2, int length) {
        int remainingBytes = length & 7;
        final long baseOffset1 = BYTE_ARRAY_BASE_OFFSET + startPos1;
        final long diff = startPos2 - startPos1;
        if (length >= 8) {
            final long end = baseOffset1 + remainingBytes;
            for (long i = baseOffset1 - 8 + length; i >= end; i -= 8) {
                if (UNSAFE.getLong(bytes1, i) != UNSAFE.getLong(bytes2, i + diff)) {
                    return false;
                }
            }
        }
        if (remainingBytes >= 4) {
            remainingBytes -= 4;
            long pos = baseOffset1 + remainingBytes;
            if (UNSAFE.getInt(bytes1, pos) != UNSAFE.getInt(bytes2, pos + diff)) {
                return false;
            }
        }
        final long baseOffset2 = baseOffset1 + diff;
        if (remainingBytes >= 2) {
            return UNSAFE.getChar(bytes1, baseOffset1) == UNSAFE.getChar(bytes2, baseOffset2) &&
                    (remainingBytes == 2 ||
                    UNSAFE.getByte(bytes1, baseOffset1 + 2) == UNSAFE.getByte(bytes2, baseOffset2 + 2));
        }
        return remainingBytes == 0 ||
                UNSAFE.getByte(bytes1, baseOffset1) == UNSAFE.getByte(bytes2, baseOffset2);
    }
```

## 前提知識

- **`Unsafe`**: JVM の内部の API で、配列の任意の位置を、型を指定して読めます。通常の配列アクセスより、境界の確認などが少なくなります。
- **`BYTE_ARRAY_BASE_OFFSET`**: Java の `byte` 配列の中で、最初の要素があるバイトのオフセットです。`Unsafe` は、このオフセットに位置を足して読みます。
- **`length & 7`**: 8 で割った余りです。8 バイトの塊で読んだあとに残る端数の長さになります。
- **`diff`**: 2 つの配列の開始位置の差です。2 つ目の配列の読み取り位置を、1 つ目の位置から求めるのに使います。

## 何をしているか

### 1. 8 バイトの塊を、後ろから比べる

```java:line-numbers=1027
        if (length >= 8) {
            final long end = baseOffset1 + remainingBytes;
            for (long i = baseOffset1 - 8 + length; i >= end; i -= 8) {
                if (UNSAFE.getLong(bytes1, i) != UNSAFE.getLong(bytes2, i + diff)) {
                    return false;
                }
            }
        }
```

`length >= 8` のとき、8 バイトずつ、末尾の方から先頭へ向かって比べます。`i` は `baseOffset1 - 8 + length` から始まり、`end`（先頭の端数の後ろ）まで 8 ずつ下がります。どちらかの `long` が違えば、すぐに `false` を返します。

### 2. 端数を、4・2・1 バイトの読み取りで埋める

```java:line-numbers=1035
        if (remainingBytes >= 4) {
            remainingBytes -= 4;
            long pos = baseOffset1 + remainingBytes;
            if (UNSAFE.getInt(bytes1, pos) != UNSAFE.getInt(bytes2, pos + diff)) {
                return false;
            }
        }
        final long baseOffset2 = baseOffset1 + diff;
        if (remainingBytes >= 2) {
            return UNSAFE.getChar(bytes1, baseOffset1) == UNSAFE.getChar(bytes2, baseOffset2) &&
                    (remainingBytes == 2 ||
                    UNSAFE.getByte(bytes1, baseOffset1 + 2) == UNSAFE.getByte(bytes2, baseOffset2 + 2));
        }
        return remainingBytes == 0 ||
                UNSAFE.getByte(bytes1, baseOffset1) == UNSAFE.getByte(bytes2, baseOffset2);
    }
```

残りの端数 `remainingBytes` は 0 から 7 です。4 バイト以上なら、後ろから 4 バイトを `int` で比べます。その後、残りが 2 バイト以上なら `char`（2 バイト）で比べ、3 バイトのときだけは 1 バイトの比較を足します。残りが 1 バイトなら、その 1 バイトを比べます。

## ここがすごい

- **読む単位を大きくする**: 8 バイトずつ比べるので、比較の回数が約 8 分の 1 になります。
- **後ろから比べる**: 8 バイトの塊を末尾から読むと、端数は先頭に残ります。その端数だけを、小さな読み取りで処理できます。
- **読み取りを重ねない**: 端数の処理では、4 バイトの `int` と 2 バイトの `char` を組み合わせ、3 バイトなら残りの 1 バイトだけを足します。全体をちょうど 1 回ずつ比べる形になっています。
- **位置の計算を 1 回に**: `diff` を先に求めておくので、2 つ目の配列の位置を、毎回の読み取りで計算し直す必要がありません。

## まとめ

- `equals` は、8 バイトの塊を末尾から `long` で比べ、端数を 4・2・1 バイトの読み取りで比べる。
- 比較の回数を減らし、端数の処理も少ない読み取りで済ませる。
- 2 つの配列の差（`diff`）を先に求めて、読み取りの位置を簡単にしている。
