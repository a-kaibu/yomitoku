---
title: "文字列を書かずに、UTF-8 のバイト数を先に数える"
description: "Netty の ByteBufUtil.utf8ByteCount。ASCII だけの先頭部分は 1 文字 1 バイトとして高速に数え、ASCII 以外が現れたら別のメソッドに任せる。書き込みの前に、必要な容量を求めるのに使う。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2012 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: buffer/src/main/java/io/netty/buffer/ByteBufUtil.java
lines: [1181, 1192]
function: "ByteBufUtil.utf8ByteCount"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, 低レイヤ]
---

## ひとことで

Netty は、文字列を `ByteBuf` に UTF-8 で書き込む前に、必要なバイト数を先に計算します。書き込み先の容量を、先に確保するためです。

`utf8ByteCount` は、その長さを数えるメソッドです。文字列を実際に変換せず、バイト数だけを求めます。

## コード

::: code-group

```java:line-numbers=1181 [日本語訳]
    private static int utf8ByteCount(final CharSequence seq, int start, int end) {
        if (seq instanceof AsciiString) {
            return end - start;
        }
        int i = start;
        //         // ASCII の高速な経路
        while (i < end && seq.charAt(i) < 0x80) {
            ++i;
        }
        //         // ASCII 以外は別のメソッドにまとめ、ASCII の場合のコードを小さく保つ
        return i < end ? (i - start) + utf8BytesNonAscii(seq, i, end) : i - start;
    }
```

```java:line-numbers=1181 [原文]
    private static int utf8ByteCount(final CharSequence seq, int start, int end) {
        if (seq instanceof AsciiString) {
            return end - start;
        }
        int i = start;
        // ASCII fast path
        while (i < end && seq.charAt(i) < 0x80) {
            ++i;
        }
        // !ASCII is packed in a separate method to let the ASCII case be smaller
        return i < end ? (i - start) + utf8BytesNonAscii(seq, i, end) : i - start;
    }
```

:::

## 前提知識

- **UTF-8**: 文字を 1 から 4 バイトで表す文字コードです。ASCII（0 から 127）の文字は 1 バイト、それ以外は 2 から 4 バイトになります。
- **`AsciiString`**: Netty の文字列の型で、すべての文字が ASCII であることが保証されています。そのため、長さがそのままバイト数になります。
- **`charAt(i) < 0x80`**: 文字の値が 128 未満、つまり ASCII かどうかの判定です。
- **容量の先取り**: 書き込み先の大きさを先に確保すると、途中で作り直す回数が減ります。

## 何をしているか

### 1. AsciiString は、長さをそのまま使う

```java:line-numbers=1182
        if (seq instanceof AsciiString) {
            return end - start;
        }
```

`AsciiString` なら、すべての文字が ASCII と分かっているので、`end - start` がそのままバイト数です。走査せずに答えが出ます。

### 2. ASCII の先頭部分は、1 文字 1 バイトで数える

```java:line-numbers=1185
        int i = start;
        //         // ASCII の高速な経路
        while (i < end && seq.charAt(i) < 0x80) {
            ++i;
        }
```

`while` で、文字が 0x80 未満である間は進めます。その分だけ、1 文字 1 バイトとして数えます。ここでは、文字の値を調べるだけで、変換はしません。

### 3. 残りに ASCII 以外があれば、別のメソッドに任せる

```java:line-numbers=1190
        //         // ASCII 以外は別のメソッドにまとめ、ASCII の場合のコードを小さく保つ
        return i < end ? (i - start) + utf8BytesNonAscii(seq, i, end) : i - start;
```

最初の ASCII 以外の文字が見つかったら、その位置から `utf8BytesNonAscii` で数えます。その結果と、ASCII の部分の長さを足して、全体のバイト数にします。

## ここがすごい

- **ASCII の場合は速い**: 多くの文字列は ASCII だけです。その場合は、比較と加算だけで、変換の計算をせずに済みます。
- **ASCII の場合のコードを小さく**: コメントにあるとおり、ASCII 以外の処理を別のメソッドに分け、ASCII の場合のコードを小さく保っています。小さい方がインライン化されやすい、と考えられます（コードには理由は書かれていません）。
- **書き込みと同じ結果**: Javadoc では、この計算が `writeUtf8` の書き込むバイト数と一致すると書かれています。事前の容量と、実際の書き込み量がずれません。
- **文字列を作らない**: 部分文字列を作らずに、添字の範囲だけで数えるので、余計なメモリを使いません。

## まとめ

- `utf8ByteCount` は、AsciiString なら長さをそのまま使い、そうでなければ ASCII の部分を 1 文字 1 バイトで数える。
- ASCII 以外が現れたら、`utf8BytesNonAscii` に残りを任せ、結果を足す。
- 変換せずにバイト数を求めるので、書き込み先の容量を先に確保できる。
