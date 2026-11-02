---
title: "8 文字の数字を、8 バイトの計算で一度に数値にする"
description: "Agrona の AsciiEncoding.parseEightDigitsLittleEndian。ASCII の 8 桁の数字が入った long を、掛け算と足し算だけで 1 つの int に変換する。ループを使わない SWAR の例。"
language: java
project: Agrona
repo: https://github.com/real-logic/agrona
license: Apache-2.0
copyright: "Copyright 2014-2025 Real Logic Limited."
commit: "4e576b8628ee8d5516c7352eae95720263b4dc59"
file: agrona/src/main/java/org/agrona/AsciiEncoding.java
lines: [421, 428]
function: "AsciiEncoding.parseEightDigitsLittleEndian"
difficulty: 3
format: 2
tags: [文字列処理, 数値計算, 最適化]
---

## ひとことで

`parseEightDigitsLittleEndian(bytes)` は、ASCII の数字 8 文字（`"12345678"` など）が、そのまま並んだ `long` を受け取り、それを 1 つの `int` の数値（12345678）に変換します。

普通は、1 文字ずつ読んで「今までの値 × 10 + 次の数字」を 8 回繰り返します。このメソッドは、8 文字を 1 つの `long` の中で一度に計算するので、ループがありません。ログの解析や、ネットワークのテキストを数値に直す場面で役立ちます。

## コード

```java:line-numbers=421
    public static int parseEightDigitsLittleEndian(final long bytes)
    {
        long val = bytes - 0x3030303030303030L;
        val = (val * 10) + (val >> 8);
        val = (((val & 0x000000FF000000FFL) * 0x000F424000000064L) +
            (((val >> 16) & 0x000000FF000000FFL) * 0x0000271000000001L)) >> 32;
        return (int)val;
    }
```

## 前提知識

- **ASCII の数字**: `'0'` は 0x30、`'9'` は 0x39 です。下位 4 ビットが、数字の値そのものになります。`bytes - 0x3030...` で、各バイトの 0x30 を引くと、数字の値 0 から 9 になります。
- **リトルエンディアン**: 数字の並びを `long` に入れるとき、先頭の文字が最も下のバイトに入る順番です。`"12345678"` の場合、下位のバイトから順に `'1'`、`'2'`、…、`'8'` が入ります。
- **SWAR（SIMD within a register）**: 1 つの `long` の中の複数のバイトを、同時に計算する考え方です。
- **桁の重み**: 10 進数では、先頭の桁ほど大きい重みを持ちます。8 桁の数は、`d0 × 10^7 + d1 × 10^6 + … + d7` です。

## 何をしているか

### 1. 数字の値を取り出す

```java:line-numbers=423
        long val = bytes - 0x3030303030303030L;
```

`bytes - 0x3030303030303030L` で、各バイトから 0x30 を引き、0 から 9 の数字の値にします。事前に「8 桁の数字である」と確かめてあるので、引き算で借り（桁の繰り下がり）は起きません。

### 2. 2 桁ずつにまとめる

```java:line-numbers=424
        val = (val * 10) + (val >> 8);
```

`val * 10 + (val >> 8)` で、隣り合う 2 つの数字を組み合わせます。偶数位置のバイトには、`10 × 先頭の数字 + 次の数字` が入ります。1 バイトに収まるので、隣のバイトに溢れることはありません。結果として、2 桁の値が 4 つ（`p0`、`p1`、`p2`、`p3`）できます。

### 3. 2 桁の値を、重みを掛けて合計する

```java:line-numbers=425
        val = (((val & 0x000000FF000000FFL) * 0x000F424000000064L) +
            (((val >> 16) & 0x000000FF000000FFL) * 0x0000271000000001L)) >> 32;
```

2 つの項で、`p0` に 10^6、`p2` に 100、`p1` に 10^4、`p3` に 1 の重みを掛けて足します。`0x000F4240` は 1,000,000、`0x2710` は 10,000、`0x64` は 100 です。`>> 32` で、上位 32 ビットの結果を取り出します。こうして、`p0 × 10^6 + p1 × 10^4 + p2 × 100 + p3` が求まり、これが 8 桁の数です。

### 4. 結果を int にする

```java:line-numbers=427
        return (int)val;
```

結果は 99999999 以下なので、`int` に収まります。`(int)` で変換して返します。

### 補足: 8 桁かどうかの判定

```java:line-numbers=410
    public static boolean isEightDigitAsciiEncodedNumber(final long value)
    {
        return 0L == ((((value + 0x4646464646464646L) | (value - 0x3030303030303030L)) & 0x8080808080808080L));
```

このメソッドを使う前には、`isEightDigitAsciiEncodedNumber` で、8 バイトすべてが数字かを確かめます。各バイトに 0x46 を足したときと 0x30 を引いたときの両方で、範囲外（0x80 以上）のビットが立たないかを、まとめて調べています。

## ここがすごい

- **ループなしで 8 文字を処理する**: 掛け算 2 回と、シフトと足し算で、8 桁の変換が終わります。分岐や繰り返しがないので、CPU のパイプラインが詰まりにくいです。
- **桁の重みを、掛け算の桁あふれで選ぶ**: `0x000F424000000064L` の掛け算では、上位の `long` へ溢れた部分が捨てられ、必要な項だけが上位 32 ビットに残ります。
- **判定と変換を分けている**: 判定は `isEightDigit...`、変換は `parseEight...` で、呼び出し側が判定の結果を見てから変換できます。
- **数字の値が `int` に収まる**: 8 桁は `int` の範囲に収まるので、変換の結果を `(int)` でそのまま返せます。

## まとめ

- `parseEightDigitsLittleEndian` は、8 バイトの ASCII 数字から 0x30 を引き、隣の桁を組み合わせて 2 桁ずつにまとめる。
- 2 桁の値 4 つに、10^6、10^4、100、1 の重みを掛けて足すと、8 桁の数が上位 32 ビットに出る。
- 事前の判定関数で 8 桁の数字かを確かめてから使うのが前提になる。
