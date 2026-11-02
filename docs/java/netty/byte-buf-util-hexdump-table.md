---
title: "1 バイトの 16 進表記を、先に表にして使い回す"
description: "Netty の ByteBufUtil.HexUtil の HEXDUMP_TABLE。256 通りのバイトについて 2 文字の 16 進表記を先に作り、ダンプのたびに配列の 2 文字分をコピーする。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2012 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: buffer/src/main/java/io/netty/buffer/ByteBufUtil.java
lines: [1524, 1529]
function: "ByteBufUtil.HexUtil"
difficulty: 1
format: 2
tags: [文字列処理, 最適化, 探索]
---

## ひとことで

Netty の `ByteBufUtil.hexDump` は、バイトの列を `3f 0a ff` のような 16 進の文字列に直します。1 バイトごとに数字を計算するより、あらかじめ作った表を使う方が速くなります。

`HEXDUMP_TABLE` は、その表です。0 から 255 までの 256 個のバイトについて、2 文字の 16 進表記を並べています。

## コード

```java:line-numbers=1524
        static {
            final char[] DIGITS = "0123456789abcdef".toCharArray();
            for (int i = 0; i < 256; i ++) {
                HEXDUMP_TABLE[ i << 1     ] = DIGITS[i >>> 4 & 0x0F];
                HEXDUMP_TABLE[(i << 1) + 1] = DIGITS[i       & 0x0F];
            }
```

## 前提知識

- **16 進表記**: 1 バイトを、0 から f までの 2 桁の文字で表す書き方です。たとえば `255` は `ff` です。
- **`char` 配列**: 文字を 1 つずつ並べた配列です。`HEXDUMP_TABLE` は、2 文字ずつ 256 組を並べています。
- **`& 0x0F`（下位 4 ビット）と `>>> 4`（上位 4 ビット）**: 1 バイトを、上位と下位の 4 ビットに分けるための操作です。16 進の 1 桁は、この 4 ビットに対応します。
- **`static` 初期化**: クラスが読み込まれたときに 1 回だけ実行される処理です。

## 何をしているか

### 1. 256 通りの 16 進表記を作る

```java:line-numbers=1525
            final char[] DIGITS = "0123456789abcdef".toCharArray();
            for (int i = 0; i < 256; i ++) {
                HEXDUMP_TABLE[ i << 1     ] = DIGITS[i >>> 4 & 0x0F];
                HEXDUMP_TABLE[(i << 1) + 1] = DIGITS[i       & 0x0F];
            }
```

`DIGITS` は `0123456789abcdef` の 16 文字です。`for` で `i` を 0 から 255 まで進め、`i >>> 4 & 0x0F` で上位 4 ビット、`i & 0x0F` で下位 4 ビットの文字を取り出します。その 2 文字を、`i << 1`（2 倍）の位置に並べます。

そのため、`HEXDUMP_TABLE[2 * i]` と `HEXDUMP_TABLE[2 * i + 1]` が、バイト `i` の 2 文字になります。

### 2. ダンプでは、表から 2 文字をコピーする

```java:line-numbers=1609
            for (; srcIdx < endIndex; srcIdx ++, dstIdx += 2) {
                System.arraycopy(
                    HEXDUMP_TABLE, (array[srcIdx] & 0xFF) << 1,
                    buf, dstIdx, 2);
```

バイトごとに `(array[srcIdx] & 0xFF) << 1` で、表の中の位置を求めます。`& 0xFF` で符号を外し、`<< 1` で 2 倍して、その 2 文字を `System.arraycopy` で出力の配列へ移します。

## ここがすごい

- **計算を 1 回にまとめる**: 16 進の変換は、起動時の 1 回だけです。ダンプの際は、配列のコピーだけになります。
- **添字がそのまま位置になる**: `i << 1` によって、バイトの値が、表の 2 文字分の位置と 1 対 1 に対応します。
- **符号を外す**: Java の `byte` は符号付きなので、`& 0xFF` で 0 から 255 の値に直してから添字にしています。
- **必要なときだけ作る**: コメントに書かれているとおり、この表は重い初期化なので、`HexUtil` という別のクラスに置かれ、使われるまで作られません。

## まとめ

- `HEXDUMP_TABLE` は、256 通りのバイトの 16 進表記（2 文字）を、起動時に 1 回作る。
- ダンプでは、`(バイト & 0xFF) << 1` の位置から 2 文字をコピーするだけで済む。
- 表は必要になったときだけ作られるよう、別のクラスに置かれている。
