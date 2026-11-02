---
title: "2 つのサロゲートの文字から、1 つのコードポイントを計算する"
description: "Java 標準の Character.toCodePoint。UTF-16 の上位と下位のサロゲートを、シフトと加算 1 回で元の Unicode のコードポイントに戻す。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2002, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Character.java
lines: [9783, 9791]
function: "Character.toCodePoint"
difficulty: 2
format: 2
tags: [文字列処理, 数値計算, ビット演算]
---

## ひとことで

Java の `char` は 16 ビットで、UTF-16 の 1 単位を表します。絵文字のような 65536 より大きい文字は、`char` 2 つの組（サロゲートペア）で表されます。

`toCodePoint` は、その 2 つの `char` から、元の 1 つの Unicode のコードポイント（文字の番号）を求めます。

## コード

::: code-group

```java:line-numbers=9783 [日本語訳]
    public static int toCodePoint(char high, char low) {
        //         // 次の式を最適化した形（同じ値になる）:
        //         // return ((high - MIN_HIGH_SURROGATE) << 10)
        //         //         + (low - MIN_LOW_SURROGATE)
        //         //         + MIN_SUPPLEMENTARY_CODE_POINT;
        return ((high << 10) + low) + (MIN_SUPPLEMENTARY_CODE_POINT
                                       - (MIN_HIGH_SURROGATE << 10)
                                       - MIN_LOW_SURROGATE);
    }
```

```java:line-numbers=9783 [原文]
    public static int toCodePoint(char high, char low) {
        // Optimized form of:
        // return ((high - MIN_HIGH_SURROGATE) << 10)
        //         + (low - MIN_LOW_SURROGATE)
        //         + MIN_SUPPLEMENTARY_CODE_POINT;
        return ((high << 10) + low) + (MIN_SUPPLEMENTARY_CODE_POINT
                                       - (MIN_HIGH_SURROGATE << 10)
                                       - MIN_LOW_SURROGATE);
    }
```

:::

## 前提知識

- **コードポイント**: Unicode で、文字ごとに決められた番号です。たとえば 😀 は `U+1F600` です。
- **サロゲートペア**: 65536 より大きい文字を、上位（high）と下位（low）の 2 つの 16 ビットの値で表す方法です。上位は `0xD800` から、下位は `0xDC00` から始まる範囲に入ります。
- **`MIN_SUPPLEMENTARY_CODE_POINT`**: 補助面の最初の番号で、`0x10000` です。サロゲートで表せる文字は、ここから始まります。
- **`<<` と `+`**: 左へ 10 ビットずらすと 1024 倍になります。上位の値に 1024 を掛けるのは、下位の 10 ビットを空けるためです。

## 何をしているか

### 1. 上位を 1024 倍して、下位を足す

```java:line-numbers=9788
        return ((high << 10) + low) + (MIN_SUPPLEMENTARY_CODE_POINT
                                       - (MIN_HIGH_SURROGATE << 10)
                                       - MIN_LOW_SURROGATE);
```

上位の値を 10 ビット左へずらすと、下位の値を入れる場所が空きます。そこへ下位の値を足すと、2 つの値が 1 つの数にまとまります。

### 2. 定数で、ずれを補正する

```java:line-numbers=9788
        return ((high << 10) + low) + (MIN_SUPPLEMENTARY_CODE_POINT
                                       - (MIN_HIGH_SURROGATE << 10)
                                       - MIN_LOW_SURROGATE);
```

`(MIN_SUPPLEMENTARY_CODE_POINT - (MIN_HIGH_SURROGATE << 10) - MIN_LOW_SURROGATE)` は定数なので、コンパイル時に 1 つの値にまとめられます。この 1 回の加算で、サロゲートの範囲の開始位置のぶんのずれを戻します。

例として、😀（`U+1F600`）は上位 `0xD83D`、下位 `0xDE00` で表されます。`0xD83D << 10` に `0xDE00` を足し、補正の定数を足すと、`0x1F600` になります。

## ここがすごい

- **条件分岐がない**: 上位と下位が正しい範囲かどうかは調べず、計算だけで番号を求めます。範囲の確認は、呼び出し側の `isSurrogatePair` に任せています。
- **定数をまとめる**: 元の式の `- MIN_HIGH_SURROGATE` などの引き算を、1 つの定数にまとめています。コメントにあるとおり、最適化の結果でも、元の式と同じ値になります。
- **シフトで 1024 倍**: 掛け算の代わりに左シフトを使い、1 回の命令で済ませています。
- **元の式が残されている**: コメントに、読みやすい形の式が書かれています。最適化された式の意味を、そこで確かめられます。

## まとめ

- `toCodePoint` は、上位の値を 1024 倍して下位を足し、補正の定数を加えて、コードポイントを求める。
- 補正の定数は、サロゲートの範囲の開始位置のずれを戻すためのものである。
- 元の式と同じ値になるように、ずれの計算を 1 つの定数にまとめて、速く計算している。
