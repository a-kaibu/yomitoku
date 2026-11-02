---
title: "8 バイトを一度に比べて、目的の文字の位置を探す"
description: "Netty の SWARUtil.applyPattern。long の 8 バイトを一度に比べ、目的のバイトと同じ位置の最上位ビットを立てる。SWAR（レジスタ内の並列処理）の代表的な例。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2024 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: common/src/main/java/io/netty/util/internal/SWARUtil.java
lines: [38, 42]
function: "SWARUtil.applyPattern"
difficulty: 3
format: 2
tags: [ビット演算, 文字列処理, 最適化]
---

## ひとことで

`applyPattern(word, pattern)` は、`long` の 8 個のバイトを、1 回の計算でまとめて比べるメソッドです。`pattern` は、探したいバイトを 8 個並べた値です。結果の `long` では、一致したバイトの位置だけ、各バイトの最上位ビットが 1 になります。

Netty は、通信の中の区切り文字（改行など）を探すときに、この考え方を使います。1 バイトずつ調べるより、ずっと速く探せます。

## コード

```java:line-numbers=38
    public static long applyPattern(final long word, final long pattern) {
        long input = word ^ pattern;
        long tmp = (input & 0x7F7F7F7F7F7F7F7FL) + 0x7F7F7F7F7F7F7F7FL;
        return ~(tmp | input | 0x7F7F7F7F7F7F7F7FL);
    }
```

## 前提知識

- **SWAR（SIMD within a register）**: 1 つの `long` の中に複数のバイトを詰め、ビット演算で同時に処理する方法です。CPU の SIMD 命令を使わずに、同じ考え方で速くできます。
- **`compilePattern`**: 1 バイトを、8 個並べた `long` に変えるメソッドです。`0x0101...01` を掛けると、8 個のコピーができます。
- **XOR（`^`）**: 同じ値なら 0、違えば 1 になる演算です。`word ^ pattern` で、探すバイトと一致した位置だけが 0 になります。
- **最上位ビット**: 1 バイトの中で、最も左の 1 ビットです。0x80 がこれに当たります。
- **`numberOfTrailingZeros`**: 最も右の 1 ビットより下にある 0 の個数を返します。

## 何をしているか

### 1. 目的のバイトを 0 にする

```java:line-numbers=39
        long input = word ^ pattern;
```

`word ^ pattern` で、探しているバイトと一致した位置は全部 0 になります。一致しない位置は 0 ではない値になります。以降は、「0 のバイトを見つける」問題になります。

### 2. 0 のバイトだけ、最上位ビットを立てる

```java:line-numbers=40
        long tmp = (input & 0x7F7F7F7F7F7F7F7FL) + 0x7F7F7F7F7F7F7F7FL;
        return ~(tmp | input | 0x7F7F7F7F7F7F7F7FL);
```

`input & 0x7F...` で、各バイトの下位 7 ビットだけを残し、`+ 0x7F...` を足します。下位 7 ビットが 0 でなければ、足した結果が 0x80 以上になるので、最上位ビットが立ちます。バイトの中で繰り上がりは起きないので、隣のバイトには影響しません。その後、`| input` で元の最上位ビットを加え、`~` で反転し、下位 7 ビットを 0 にする `0x7F...` のマスクを使うと、0 だったバイトだけに最上位ビットが残ります。

### 3. 最初の一致の位置を求める

```java:line-numbers=54
    public static int getIndex(final long word, final boolean isBigEndian) {
        final int zeros = isBigEndian? Long.numberOfLeadingZeros(word) : Long.numberOfTrailingZeros(word);
        return zeros >>> 3;
```

`getIndex` は、結果の `long` から、最初の一致の位置を取り出します。リトルエンディアンでは、下位のバイトが先頭なので、`numberOfTrailingZeros` を使い、その値を 8 で割ります。1 バイトが 8 ビットなので、`>>> 3` が割り算に当たります。一致しなかった場合は、0 ビットが 64 個になるので、結果は 8 になります。

### 4. 探すバイトを 8 個並べる

```java:line-numbers=26
    public static long compilePattern(byte byteToFind) {
        return (byteToFind & 0xFFL) * 0x101010101010101L;
```

`compilePattern` は、1 バイトを 8 個並べた値を作ります。`0x0101010101010101L` を掛けるだけで、各バイトに同じ値をコピーできます。

## ここがすごい

- **8 バイトを 1 回の計算で比べる**: 1 バイトずつの `if` を 8 回書く代わりに、加算とビット演算だけで、8 バイトの一致を同時に調べます。
- **繰り上がりを防ぐ工夫**: 下位 7 ビットだけを足すことで、バイトの境界をまたいで繰り上がりが起きないようにしています。この点が、単純な式との大きな違いです。
- **分岐が少ない**: 一致の判定に `if` を使わないので、CPU の分岐予測の失敗が起きにくくなります。
- **ビッグエンディアンとリトルエンディアンの両方に対応**: `isBigEndian` で、先頭のバイトが上位か下位かを切り替えて、同じ結果を得られます。

## まとめ

- `compilePattern` で探すバイトを 8 個並べ、`applyPattern` で 8 バイトを同時に比べる。
- 一致したバイトの最上位ビットだけが立つので、`getIndex` で最初の位置を求められる。
- 繰り上がりを下位 7 ビットに限ることで、隣のバイトに影響しない。
