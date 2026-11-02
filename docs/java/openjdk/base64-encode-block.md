---
title: "3 バイトを 24 ビットにまとめて、4 文字に分ける"
description: "Java 標準の Base64 エンコーダの encodeBlock。3 バイトを 1 つの 24 ビットの整数にまとめ、6 ビットずつ取り出して 64 文字の表で 4 文字に変換する。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2012, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Base64.java
lines: [428, 439]
function: "Base64.Encoder.encodeBlock"
difficulty: 2
format: 2
tags: [ビット演算, 文字列処理, 標準ライブラリ]
---

## ひとことで

`encodeBlock` は、バイト列を Base64 の文字列に変える中心の処理です。3 バイトの入力を 4 文字の出力に変えます。

Base64 は、バイナリのデータを、英字・数字・記号の限られた文字で表す方式です。メールの添付ファイルや、URL に含めるデータなどで使われます。

## コード

```java:line-numbers=428
        private void encodeBlock(byte[] src, int sp, int sl, byte[] dst, int dp, boolean isURL) {
            char[] base64 = isURL ? toBase64URL : toBase64;
            for (int sp0 = sp, dp0 = dp ; sp0 < sl; ) {
                int bits = (src[sp0++] & 0xff) << 16 |
                           (src[sp0++] & 0xff) <<  8 |
                           (src[sp0++] & 0xff);
                dst[dp0++] = (byte)base64[(bits >>> 18) & 0x3f];
                dst[dp0++] = (byte)base64[(bits >>> 12) & 0x3f];
                dst[dp0++] = (byte)base64[(bits >>> 6)  & 0x3f];
                dst[dp0++] = (byte)base64[bits & 0x3f];
            }
        }
```

## 前提知識

- **バイト**: 8 ビットの値です。3 バイトは 24 ビットになります。
- **Base64 の表**: 0 から 63 の数を、`A` から `Z`、`a` から `z`、`0` から `9`、`+`、`/` の 64 文字に対応させた表です。
- **6 ビット**: 64 種類を表すのに必要なビット数です。24 ビットは、6 ビットずつ 4 つに分けられます。
- **`>>>` と `&`**: ビットを右へずらしてから、下位 6 ビットだけを残すための組み合わせです。
- **`&0xff`**: `byte` を符号なしの 0 から 255 の値として扱うためのマスクです。

## 何をしているか

### 1. 3 バイトを 1 つの整数にまとめる

```java:line-numbers=431
                int bits = (src[sp0++] & 0xff) << 16 |
                           (src[sp0++] & 0xff) <<  8 |
                           (src[sp0++] & 0xff);
```

3 つのバイトを、それぞれ 16、8、0 ビット左へずらして、1 つの 24 ビットの整数にまとめます。先頭のバイトが一番上の位置に入ります。

### 2. 上の 6 ビットを文字にする

```java:line-numbers=434
                dst[dp0++] = (byte)base64[(bits >>> 18) & 0x3f];
```

`bits >>> 18` で、一番上の 6 ビットを一番下へ移します。`& 0x3f` で、6 ビット（0 から 63）だけを残し、表から文字を引きます。

### 3. 残りの 3 組も同じように取り出す

```java:line-numbers=435
                dst[dp0++] = (byte)base64[(bits >>> 12) & 0x3f];
                dst[dp0++] = (byte)base64[(bits >>> 6)  & 0x3f];
                dst[dp0++] = (byte)base64[bits & 0x3f];
```

同じ考え方で、12 ビット、6 ビット、0 ビットのずらし量を使い、残りの 3 文字を作ります。最後の文字は、ずらさずに下位 6 ビットを取ります。

### 4. 次の 3 バイトへ進む

`sp0` と `dp0` を進めて、入力の 3 バイトごとに、出力の 4 文字を書き出します。ループは、入力が残る限り続きます。

## ここがすごい

- **24 ビットの箱を作る**: 3 バイトを 1 つの整数にまとめると、6 ビットずつ取り出すだけで 4 文字ができます。計算の組み立てが単純になります。
- **マスクは最後に 1 回**: シフトした値の上位に残ったビットは、`& 0x3f` で一度に消せます。取り出すたびに同じ形で書けます。
- **表引きで文字にする**: 計算した 0 から 63 の数を、そのまま添字として表を引きます。文字の変換が、配列アクセス 1 回で済みます。
- **CPU の命令に置き換え可能**: `@IntrinsicCandidate` の注釈があり、対応する環境では、この処理を専用の命令で行えます。

## まとめ

- 3 バイトを 24 ビットの整数にまとめ、6 ビットずつ 4 つに分ける。
- 取り出した 0 から 63 の値を、Base64 の表で文字に変える。
- 単純なシフトと表引きだけで、速くバイナリを文字列に変換できる。
