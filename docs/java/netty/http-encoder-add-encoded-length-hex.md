---
title: "チャンクの長さを、String を作らずに 16 進数で書く"
description: "Netty の HttpObjectEncoder.addEncodedLengthHex。長さのビット数から 16 進数の桁数を求め、4 ビットずつ HEX 表で文字にして、String を作らずにバッファへ書き出す。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2012 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: codec-http/src/main/java/io/netty/handler/codec/http/HttpObjectEncoder.java
lines: [579, 596]
function: "HttpObjectEncoder.addEncodedLengthHex"
difficulty: 2
format: 2
tags: [文字列処理, ビット演算, 最適化]
---

## ひとことで

HTTP の「チャンク転送」では、データの大きさを、その前に 16 進数の文字列で書きます。たとえば 26 バイトなら `1a` と書き、改行（CRLF）を付けます。

`addEncodedLengthHex` は、この 16 進数の文字列を、`String` を作らずに `ByteBuf` へ直接書き込みます。Java 標準の `Long.toHexString()` と同じ考え方で、桁数と文字を決めます。

## コード

::: code-group

```java:line-numbers=579 [日本語訳]
    private static void addEncodedLengthHex(ChannelHandlerContext ctx, long contentLength, List<Object> out) {
        // Long.toHexString() の考え方を使うが、String を作らないようにしている
        int hexLen = contentLength == 0 ? 1 : (Long.SIZE - Long.numberOfLeadingZeros(contentLength) + 3) >>> 2;
        ByteBuf buf = ctx.alloc().buffer(hexLen + 2); // CRLF の 2 バイト分
        writeHexAscii(buf, contentLength, hexLen);
        ByteBufUtil.writeShortBE(buf, CRLF_SHORT);
        out.add(buf);
    }

    private static final byte[] HEX = {
            '0', '1', '2', '3', '4', '5', '6', '7',
            '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'
    };
    private static void writeHexAscii(ByteBuf out, long contentLength, int hexLen) {
        for (int shift = (hexLen - 1) << 2; shift >= 0; shift -= 4) {
            out.writeByte(HEX[(int) ((contentLength >>> shift) & 0xF)]);
        }
    }
```

```java:line-numbers=579 [原文]
    private static void addEncodedLengthHex(ChannelHandlerContext ctx, long contentLength, List<Object> out) {
        // logic is from Long.toHexString() but we want to avoid creating a String
        int hexLen = contentLength == 0 ? 1 : (Long.SIZE - Long.numberOfLeadingZeros(contentLength) + 3) >>> 2;
        ByteBuf buf = ctx.alloc().buffer(hexLen + 2); // +2 for CRLF
        writeHexAscii(buf, contentLength, hexLen);
        ByteBufUtil.writeShortBE(buf, CRLF_SHORT);
        out.add(buf);
    }

    private static final byte[] HEX = {
            '0', '1', '2', '3', '4', '5', '6', '7',
            '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'
    };
    private static void writeHexAscii(ByteBuf out, long contentLength, int hexLen) {
        for (int shift = (hexLen - 1) << 2; shift >= 0; shift -= 4) {
            out.writeByte(HEX[(int) ((contentLength >>> shift) & 0xF)]);
        }
    }
```

:::

## 前提知識

- **チャンク転送**: 送るデータの全体の長さが分からないときに、データを小さな塊（チャンク）に分けて送る方式です。各塊の前に、その大きさを 16 進数で書きます。
- **16 進数の 1 桁**: 4 ビットで表せます。値を 4 ビットずつ取り出すと、1 桁ずつ文字に変えられます。
- **`numberOfLeadingZeros`**: 最も上にある 1 のビットより上に、0 が何個並ぶかを返します。`64 - この値` で、数のビットの長さが分かります。
- **`HEX` 表**: 0 から 15 の値を、`'0'` から `'f'` の文字に変える表です。

## 何をしているか

### 1. 16 進数の桁数を決める

```java:line-numbers=581
        int hexLen = contentLength == 0 ? 1 : (Long.SIZE - Long.numberOfLeadingZeros(contentLength) + 3) >>> 2;
```

`contentLength` が 0 なら、桁数は 1 です。そうでなければ、ビットの長さ（`Long.SIZE - numberOfLeadingZeros`）に 3 を足して 4 で割ります。これは、ビットの長さを 4 で切り上げた値、つまり 16 進数の桁数と同じです。

### 2. 上の桁から、4 ビットずつ文字にする

```java:line-numbers=593
        for (int shift = (hexLen - 1) << 2; shift >= 0; shift -= 4) {
            out.writeByte(HEX[(int) ((contentLength >>> shift) & 0xF)]);
        }
```

`shift` は、最も上の桁のビット位置から始めて、4 ずつ下げます。各回で `(contentLength >>> shift) & 0xF` を取り出し、`HEX` 表で文字に変えて書き出します。

## ここがすごい

- **String を作らない**: `Long.toHexString()` は文字列を作りますが、この方法は 1 バイトずつ `ByteBuf` に書き込みます。チャンクの書き出しごとに、一時的な文字列を作らずに済みます。
- **桁数を計算で求める**: 数を文字列にしてから長さを数える代わりに、ビットの長さから桁数を直接求めます。
- **4 ビット単位で処理する**: 16 進数の 1 桁は 4 ビットなので、シフトとマスクだけで桁の値を取り出せます。
- **先に必要な容量を確保する**: `ctx.alloc().buffer(hexLen + 2)` で、桁数と CRLF の分の容量を、最初に確保します。

## まとめ

- `addEncodedLengthHex` は、長さのビット数から 16 進数の桁数を求め、バッファを確保する。
- `writeHexAscii` は、上の桁から 4 ビットずつ取り出し、`HEX` 表で文字にして書き出す。
- 文字列を作らずに、チャンクの大きさを 16 進数の文字として書けるので、通信ごとの一時的な割り当てを減らせる。
