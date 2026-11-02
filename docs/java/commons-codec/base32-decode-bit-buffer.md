---
title: "5 ビットずつの文字を 40 ビットに溜めて、5 バイトずつ書き出す"
description: "Apache Commons Codec の Base32.decode の復号部分。32 種類の文字をそれぞれ 5 ビットの値にし、8 文字分の 40 ビットをまとめて取り出して 5 バイトに戻す。"
language: java
project: Apache Commons Codec
repo: https://github.com/apache/commons-codec
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "7fa065c5b5f78c66322b9f33f5e396b2c2b62c27"
file: src/main/java/org/apache/commons/codec/binary/Base32.java
lines: [602, 612]
function: "Base32.decode"
difficulty: 3
format: 2
tags: [文字列処理, ビット演算, 低レイヤ]
---

## ひとことで

Base32 は、バイナリのデータを、英大文字と数字の 32 種類の文字で表す方法です。1 文字で 5 ビットを表すので、8 文字で 40 ビット、つまり 5 バイトになります。

`Base32.decode` は、入力の文字を 1 文字ずつ 5 ビットの値に変え、その値を 40 ビットの作業領域に溜めていきます。8 文字が揃ったら、5 バイトを取り出して出力します。

## コード

::: code-group

```java:line-numbers=602 [日本語訳]
                if (result >= 0) {
                    context.modulus = (context.modulus + 1) % BYTES_PER_ENCODED_BLOCK;
                    // 復号した値を、ビットの作業領域に集める
                    context.lbitWorkArea = (context.lbitWorkArea << BITS_PER_ENCODED_BYTE) + result;
                    if (context.modulus == 0) { // if (context.modulus == 0) { // 5 バイト分たまったので書き出せる
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 32 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 24 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 16 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 8 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea & MASK_8BITS);
                    }
```

```java:line-numbers=602 [原文]
                if (result >= 0) {
                    context.modulus = (context.modulus + 1) % BYTES_PER_ENCODED_BLOCK;
                    // collect decoded bytes
                    context.lbitWorkArea = (context.lbitWorkArea << BITS_PER_ENCODED_BYTE) + result;
                    if (context.modulus == 0) { // we can output the 5 bytes
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 32 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 24 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 16 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 8 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea & MASK_8BITS);
                    }
```

:::

## 前提知識

- **Base32 の文字**: `A` から `Z` と `2` から `7` の 32 種類です。各文字は 0 から 31 の値を表し、5 ビットで足ります。
- **8 文字で 5 バイト**: 5 ビット × 8 文字 = 40 ビット = 5 バイト × 8 ビットです。この 8 文字が、データの最小のまとまりになります。
- **`decodeTable`**: 文字の値（0 から 255 のバイト）を、5 ビットの値に変換する表です。対応しない文字は、負の値になっています。
- **`lbitWorkArea`**: 作業用の `long` です。ここに、5 ビットずつ詰めていきます。
- **`modulus`**: 今まで何文字を読んだかを、8 で割った余りで持つカウンタです。

## 何をしているか

### 1. 文字を 5 ビットの値にして、作業領域に詰める

```java:line-numbers=601
                final int result = this.decodeTable[b];
                if (result >= 0) {
                    context.modulus = (context.modulus + 1) % BYTES_PER_ENCODED_BLOCK;
                    // 復号した値を、ビットの作業領域に集める
                    context.lbitWorkArea = (context.lbitWorkArea << BITS_PER_ENCODED_BYTE) + result;
```

`decodeTable[b]` で、文字を 5 ビットの値 `result` に変えます。`lbitWorkArea` を 5 ビット左へずらしてから `result` を足すと、新しい 5 ビットが一番下に入ります。`modulus` は、8 文字ごとに 0 に戻ります。

### 2. 8 文字揃ったら、5 バイトを取り出す

```java:line-numbers=606
                    if (context.modulus == 0) { // if (context.modulus == 0) { // 5 バイト分たまったので書き出せる
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 32 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 24 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 16 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea >> 8 & MASK_8BITS);
                        buffer[context.pos++] = (byte) (context.lbitWorkArea & MASK_8BITS);
```

`modulus` が 0 になったとき、つまり 8 文字揃ったときに、5 バイトを書き出します。40 ビットの作業領域を、上の 8 ビットから順に `>> 32`、`>> 24`、`>> 16`、`>> 8` で取り出し、`& MASK_8BITS` で 8 ビットだけを残します。最後の `& MASK_8BITS` は、一番下の 8 ビットです。

## ここがすごい

- **桁を揃える必要がない**: 文字の境界とバイトの境界が 8 文字と 5 バイトで揃うので、途中で余ったビットを別に持ち越す計算が要りません。
- **同じ作業領域を使い回す**: `lbitWorkArea` は、左へずらして足すだけです。古いビットは、上へ押し出されて自然に消えます。
- **ビットの取り出しがシフトとマスクだけ**: 5 バイトの取り出しは、シフトと `& 0xFF` の繰り返しです。割り算を使わないので、速く動きます。
- **表で文字を値に変える**: 文字の判定と値の変換を、1 回の配列の参照で済ませています。不正な文字は、負の値として別に扱われます。

## まとめ

- Base32 は 1 文字 5 ビットなので、8 文字がちょうど 40 ビット、5 バイトになる。
- 文字を 5 ビットの値にして `lbitWorkArea` に左から詰め、8 文字揃ったら 5 バイトを取り出す。
- 割り算を使わず、シフトと `& 0xFF` だけで 5 バイトに戻す。
