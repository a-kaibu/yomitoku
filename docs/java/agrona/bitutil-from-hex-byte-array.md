---
title: "16 進の文字の列を、2 文字ずつ 1 バイトに戻す"
description: "Agrona の BitUtil.fromHexByteArray。ASCII の 16 進の文字を表で 4 ビットの値に変え、2 文字ずつ組にして 1 バイトにまとめる。"
language: java
project: Agrona
repo: https://github.com/real-logic/agrona
license: Apache-2.0
copyright: "Copyright 2014-2025 Real Logic Limited."
commit: "4e576b8628ee8d5516c7352eae95720263b4dc59"
file: agrona/src/main/java/org/agrona/BitUtil.java
lines: [183, 195]
function: "BitUtil.fromHexByteArray"
difficulty: 2
format: 2
tags: [文字列処理, 低レイヤ, ビット演算]
---

## ひとことで

16 進数の表記（たとえば `ff`）は、1 バイトを 2 文字で表します。`fromHexByteArray` は、この 2 文字の組を 1 バイトに戻します。

入力は、16 進の文字が ASCII の並びで書かれた `byte` の配列です。出力は、元のバイトの配列です。

## コード

```java:line-numbers=183
    public static byte[] fromHexByteArray(final byte[] buffer)
    {
        final byte[] outputBuffer = new byte[buffer.length >> 1];

        for (int i = 1; i < buffer.length; i += 2)
        {
            final int hi = FROM_HEX_DIGIT_TABLE[buffer[i - 1]] << 4;
            final int lo = FROM_HEX_DIGIT_TABLE[buffer[i]];
            outputBuffer[(i - 1) >> 1] = (byte)(hi | lo);
        }

        return outputBuffer;
    }
```

## 前提知識

- **16 進の 1 桁**: 0 から 15 までの値（4 ビット）を、`0`〜`9`、`a`〜`f` の文字で表したものです。
- **ニブル（nibble）**: 4 ビットの値のことです。1 バイトは 2 つのニブルでできています。
- **FROM_HEX_DIGIT_TABLE**: 文字の番号（0 から 127）を添字にして、その文字が表す 4 ビットの値を引く表です。`A`〜`F` と `a`〜`f` は同じ値になるように作られています。
- **`(byte)` のキャスト**: 結果の 4 ビットを 2 つ合わせた値を、1 バイトの型に変えます。

## 何をしているか

### 1. 表で、2 文字をそれぞれ 4 ビットの値にする

```java:line-numbers=187
        for (int i = 1; i < buffer.length; i += 2)
        {
            final int hi = FROM_HEX_DIGIT_TABLE[buffer[i - 1]] << 4;
            final int lo = FROM_HEX_DIGIT_TABLE[buffer[i]];
```

`i` を 1 から 2 ずつ進めます。`buffer[i - 1]` は上の桁の文字、`buffer[i]` は下の桁の文字です。上の桁の値は表から取って、`<< 4`（16 倍）でずらします。下の桁の値は表から取り、そのままにします。

### 2. 2 つを OR で 1 バイトにまとめる

```java:line-numbers=191
            outputBuffer[(i - 1) >> 1] = (byte)(hi | lo);
```

`hi | lo` で、上の 4 ビットと下の 4 ビットを合わせ、1 バイトにします。結果の添字は `(i - 1) >> 1`（2 で割った値）で、入力の 2 文字が 1 つの出力に対応します。

## ここがすごい

- **表で変換を済ませる**: 文字ごとに `if` で数字か英字かを判定する代わりに、添字で値を引くだけです。
- **大文字と小文字を同じ表で扱う**: 表の作り方で、`a` と `A` が同じ値になっています。
- **ずらしと OR で組み立てる**: 上の桁を 4 ビット左へずらして OR で足すので、足し算の繰り上がりの心配がありません。
- **不正な入力を検出しない**: 16 進の文字以外の ASCII は、表の中で 0 として扱われ、エラーになりません。ASCII 以外の値は負の添字になり、例外が出ます。入力の形は呼び出し側で確かめる必要があります。

## まとめ

- `fromHexByteArray` は、2 文字ずつの組を、表で 4 ビットの値にし、上の桁をずらして OR で 1 バイトにする。
- 入力の 2 文字が、出力の 1 バイトに対応する。
- 不正な文字は検出されないので、入力の形は呼び出し側で確かめる必要がある。
