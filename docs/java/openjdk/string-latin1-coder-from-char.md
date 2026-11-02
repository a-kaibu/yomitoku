---
title: "文字が 1 バイトに収まるかを、符号ビットだけで判定する"
description: "Java 標準の StringLatin1.coderFromChar。文字が 0xFF 以下なら LATIN1、大きければ UTF16 を返す。0xFF から引いた差の符号ビットを使い、分岐なしで決める。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2015, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/StringLatin1.java
lines: [70, 72]
function: "StringLatin1.coderFromChar"
difficulty: 2
format: 2
tags: [文字列処理, ビット演算, 数値計算]
---

## ひとことで

Java の `String` は、内部に文字列を、1 文字 1 バイト（LATIN1）か、1 文字 2 バイト（UTF16）の形で保存します。ほとんどの文字が 1 バイトに収まるなら、1 バイトの形の方が省メモリです。

`coderFromChar` は、1 文字を見て、その文字をどちらの形で保存すればよいかを返します。`LATIN1` は `0`、`UTF16` は `1` の値です。

## コード

```java:line-numbers=70
    static byte coderFromChar(char cp) {
        return (byte)((0xff - cp) >>> (Integer.SIZE - 1));
    }
```

## 前提知識

- **LATIN1 と UTF16**: `String` の内部の保存形式です。LATIN1 は 1 文字 1 バイト、UTF16 は 1 文字 2 バイトです。`coder` という値で、どちらかを表します。
- **`char`**: Java の 16 ビットの文字の型です。値の範囲は 0 から 65535 です。
- **`0xff`**: 1 バイトに収まる最大の値（255）です。
- **符号ビット**: 32 ビットの `int` の最上位のビットです。負の数なら 1 になります。

## 何をしているか

### 1. 0xFF から文字の値を引く

```java:line-numbers=71
        return (byte)((0xff - cp) >>> (Integer.SIZE - 1));
```

`0xff - cp` は、文字 `cp` が 255 以下なら 0 以上になります。255 より大きければ、負の数になります。

### 2. 符号ビットだけを取り出す

```java:line-numbers=71
        return (byte)((0xff - cp) >>> (Integer.SIZE - 1));
```

`>>> (Integer.SIZE - 1)` は、`int` の最上位ビット（符号ビット）を、一番下の 1 ビットへ移します。差が負なら 1、0 以上なら 0 です。`(byte)` で型を変えると、`coder` の値（`UTF16` は `1`、`LATIN1` は `0`）になります。

例として、`é`（`0xE9`）は `0xFF - 0xE9 = 0x16` で正なので、0 になり `LATIN1` です。`あ`（`0x3042`）は差が負なので、1 になり `UTF16` です。

## ここがすごい

- **分岐がない**: `if (cp > 0xff)` と書かず、差の符号ビットで 0 か 1 を作るので、分岐の予測が外れる心配がありません。
- **比べ方を 1 つの式に**: 比較と結果の変換が、1 行の式にまとまっています。
- **`coder` の型に合わせる**: 結果が `byte` の `LATIN1` / `UTF16` の値と一致するので、そのまま保存形式として使えます。
- **引き算の溢れが起きない**: 文字の範囲は 0 から 65535 で、`0xff - cp` は `int` の中に収まるので、符号の判定が正しく働きます。

## まとめ

- `coderFromChar` は、`0xFF - cp` の符号ビットを、1 バイトの `coder` の値として取り出す。
- 255 以下なら `LATIN1`（0）、大きければ `UTF16`（1）になる。
- 分岐なしで、文字の保存形式を 1 行で決めている。
