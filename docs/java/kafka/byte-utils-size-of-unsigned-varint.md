---
title: "varint のバイト数を、先頭の 0 の数から割り算なしで求める"
description: "Kafka の ByteUtils.sizeOfUnsignedVarint。値の先頭の 0 ビットの数から、7 ビットずつに分けたときのバイト数を求める。7 で割る代わりに、掛け算とシフトを使う。"
language: java
project: Apache Kafka
repo: https://github.com/apache/kafka
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "68986c8df89a6a4786d74be7e4eabc16c7202564"
file: clients/src/main/java/org/apache/kafka/common/utils/internals/ByteUtils.java
lines: [557, 573]
function: "ByteUtils.sizeOfUnsignedVarint"
difficulty: 3
format: 2
tags: [ビット演算, アルゴリズム, 最適化]
---

## ひとことで

Kafka は、整数を「varint」という可変長の形で書きます。小さい値は 1 バイトで済み、大きい値は 5 バイトまで使います。書き込む前に、その値が何バイトになるかを知っておくと、バッファの大きさを前もって決められます。

`sizeOfUnsignedVarint` は、この長さを、値を 7 ビットずつ数えるループを使わずに求めます。`Integer.numberOfLeadingZeros` で得た先頭の 0 の数から、計算で直接求めます。

## コード

::: code-group

```java:line-numbers=557 [日本語訳]
    public static int sizeOfUnsignedVarint(int value) {
        // Protocol Buffers の varint は長さが可変で、最低 1 バイト（0 の場合も）
        // （0 でも）。値そのものは重要ではなく、大事なのは
        // 先頭の 0 ビットは出力から省かれる。この先頭の 0 の数を使える
        // 高速な命令で数えて、出力の長さを直接求められる

        // テストで、ループを使う場合の出力と一致することを確かめている

        // return (38 - leadingZeros) / 7 + leadingZeros / 32;

        // 上の式で実装できるが、Java の割り算の書き方は、狭い範囲の整数では効率が悪い
        // そのため、手でより良い形を作る

        int leadingZeros = Integer.numberOfLeadingZeros(value);
        int leadingZerosBelow38DividedBy7 = ((38 - leadingZeros) * 0b10010010010010011) >>> 19;
        return leadingZerosBelow38DividedBy7 + (leadingZeros >>> 5);
    }
```

```java:line-numbers=557 [原文]
    public static int sizeOfUnsignedVarint(int value) {
        // Protocol buffers varint encoding is variable length, with a minimum of 1 byte
        // (for zero). The values themselves are not important. What's important here is
        // any leading zero bits are dropped from output. We can use this leading zero
        // count w/ fast intrinsic to calc the output length directly.

        // Test cases verify this matches the output for loop logic exactly.

        // return (38 - leadingZeros) / 7 + leadingZeros / 32;

        // The above formula provides the implementation, but the Java encoding is suboptimal
        // when we have a narrow range of integers, so we can do better manually

        int leadingZeros = Integer.numberOfLeadingZeros(value);
        int leadingZerosBelow38DividedBy7 = ((38 - leadingZeros) * 0b10010010010010011) >>> 19;
        return leadingZerosBelow38DividedBy7 + (leadingZeros >>> 5);
    }
```

:::

## 前提知識

- **varint**: 数を 7 ビットずつに分け、1 バイトごとに 1 ビットを続きのしるしに使う形式です。先頭の 0 のビットは、出力から省かれます。
- **先頭の 0 の数（leading zeros）**: 最も上の 1 より上にある 0 の数です。`32 - leadingZeros` は、値のビットの長さになります。
- **7 で切り上げる**: ビットの長さを 7 で割って切り上げると、バイト数になります。例えば 7 ビットまでは 1 バイト、8 ビットから 14 ビットまでは 2 バイトです。
- **値 0**: 0 は、1 バイトとして書かれます。

## 何をしているか

### 1. 先頭の 0 の数を数える

```java:line-numbers=570
        int leadingZeros = Integer.numberOfLeadingZeros(value);
```

`numberOfLeadingZeros` は、CPU の命令で一度に数えられる値です。値が 0 のときは 32 を返します。

### 2. 7 で割る処理を、掛け算とシフトで作る

```java:line-numbers=571
        int leadingZerosBelow38DividedBy7 = ((38 - leadingZeros) * 0b10010010010010011) >>> 19;
        return leadingZerosBelow38DividedBy7 + (leadingZeros >>> 5);
```

`(38 - leadingZeros)` は、`32 - leadingZeros + 6`、つまりビットの長さに 6 を足した値です。7 で割って、切り上げたバイト数を求めます。割り算の代わりに、`0b10010010010010011` を掛けて `>>> 19` で右へずらすと、7 で割った値に近い結果になります。

最後に `leadingZeros >>> 5` は、先頭の 0 が 32 のとき（値が 0 のとき）だけ 1 になります。その分を足して、0 のときも 1 バイトになるようにしています。

## ここがすごい

- **ループなし**: 値を 7 ビットずつ右へずらして数えると、値が大きいほど回数が増えます。この方法は、どの値でも一定の手順で済みます。
- **割り算を避ける**: 7 で割る処理を、掛け算と右シフトだけで書いています。割り算より速く動くように書かれています。
- **元の式がコメントに残っている**: 直前のコメントには、単純な式 `(38 - leadingZeros) / 7 + leadingZeros / 32` が書かれています。掛け算を使う版は、その式が Java で効率が悪いことへの対応だと説明されています。テストは、ループの処理と一致することを確かめていると書かれています。
- **値 0 の扱い**: 0 のとき、先頭の 0 は 32 個です。そのときだけ `leadingZeros >>> 5` が 1 になるので、特別な分岐なしで 1 バイトになります。

## まとめ

- `sizeOfUnsignedVarint` は、先頭の 0 の数から、varint のバイト数を計算で求める。
- 7 で割る処理は、`0b10010010010010011` を掛けて `>>> 19` でずらす形で、割り算を避ける。
- 値 0 の場合は、`leadingZeros >>> 5` の 1 で、1 バイトになる。
