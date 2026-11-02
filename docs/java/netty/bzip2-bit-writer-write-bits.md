---
title: "64 ビットの作業用バッファに溜めて、32 ビットずつ書き出す"
description: "Netty の Bzip2BitWriter.writeBits。1 ビット単位の値を、64 ビットの作業用バッファの上の空きに OR で詰め、32 ビット溜まったら ByteBuf へ書き出す。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2014 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: codec-compression/src/main/java/io/netty/handler/codec/compression/Bzip2BitWriter.java
lines: [41, 56]
function: "Bzip2BitWriter.writeBits"
difficulty: 3
format: 2
tags: [ビット演算, データ構造, 低レイヤ]
---

## ひとことで

bzip2 の圧縮データは、1 ビット単位で並んでいて、バイトの区切りに合わせていません。そのため、普通の `ByteBuf` のように 1 バイトずつ書くことはできません。

`Bzip2BitWriter` は、書きたいビットを、いったん 64 ビットの作業用の変数（`bitBuffer`）に溜めます。32 ビット以上溜まったら、その上位 32 ビットを `ByteBuf` に書き出します。`writeBits` は、その溜める操作と、書き出す操作を行うメソッドです。

## コード

```java:line-numbers=41
    void writeBits(ByteBuf out, final int count, final long value) {
        if (count < 0 || count > 32) {
            throw new IllegalArgumentException("count: " + count + " (expected: 0-32)");
        }
        int bitCount = this.bitCount;
        long bitBuffer = this.bitBuffer | value << 64 - count >>> bitCount;
        bitCount += count;

        if (bitCount >= 32) {
            out.writeInt((int) (bitBuffer >>> 32));
            bitBuffer <<= 32;
            bitCount -= 32;
        }
        this.bitBuffer = bitBuffer;
        this.bitCount = bitCount;
    }
```

## 前提知識

- **作業用バッファ**: `bitBuffer` は 64 ビットの `long` です。書いていないビットは下の方に空けておき、使っているビットは上から詰めます。`bitCount` は、使っているビットの数です。
- **ビットの詰め方**: 新しい値の下位 `count` ビットを、上から `bitCount` ビット目の後ろに並べます。
- **シフト量の扱い**: Java では、`long` のシフト量は下位 6 ビットだけが使われます。シフト量が 64 になると 0 として働きます。
- **`ByteBuf.writeInt`**: 4 バイトを書き出します。ここでは、32 ビットを 1 つの整数として渡します。

## 何をしているか

### 1. 新しいビットを、空いている場所へ詰める

```java:line-numbers=45
        int bitCount = this.bitCount;
        long bitBuffer = this.bitBuffer | value << 64 - count >>> bitCount;
        bitCount += count;
```

`value << 64 - count` は、`value` の下位 `count` ビットを、`long` の一番上に寄せます。そのあと `>>> bitCount` で、すでに溜まっているビットの後ろへ移します。`this.bitBuffer` と OR することで、溜まっているビットを壊さずに足せます。

### 2. 32 ビット溜まったら、上の 32 ビットを書き出す

```java:line-numbers=49
        if (bitCount >= 32) {
            out.writeInt((int) (bitBuffer >>> 32));
            bitBuffer <<= 32;
            bitCount -= 32;
        }
```

溜まったビットが 32 以上になったら、`bitBuffer >>> 32` の値（上位 32 ビット）を `writeInt` で書き出します。残りのビットは、`bitBuffer <<= 32` で上へ寄せて、`bitCount` を 32 減らします。

### 3. 作業用の状態を保存する

```java:line-numbers=54
        this.bitBuffer = bitBuffer;
        this.bitCount = bitCount;
```

最後に、新しい `bitBuffer` と `bitCount` をフィールドに戻します。次に書くときは、この状態から続きます。

## ここがすごい

- **1 回のシフトと OR で詰める**: 何ビットを書くときも、同じ式で済みます。1 ビットずつ書く処理と違い、ループがありません。
- **32 ビット単位で書き出す**: 書き出しの回数を、ビットの数の 32 分の 1 に減らせます。
- **書き出すのは上の 32 ビットだけ**: 書いていないビットは下に残っているので、次の書き込みと自然につながります。
- **引数の範囲を確かめる**: `count` が 0 から 32 の外にあると、例外を投げます。
- **注意点**: `count` が 0 のとき、`64 - count` は 64 になり、Java では 0 として働きます。そのため `value` が、`bitCount` の位置へずれた形で OR されます。この関数は、`count` が 0 のとき `value` に 0 を渡すことを前提にしていると読めます（コードには、この前提の説明がありません）。

## まとめ

- `writeBits` は、新しいビットを 64 ビットの `bitBuffer` の上の空きに OR で詰める。
- 32 ビット以上溜まったら、上位 32 ビットを `ByteBuf` に書き出し、残りを上へ寄せる。
- 状態は `bitBuffer` と `bitCount` の 2 つだけで、次の書き込みはそこから続く。
