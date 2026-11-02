---
title: "配列の長さの差の符号で、保存形式を選ぶ"
description: "Java 標準の StringUTF16.coderFromArrayLen。圧縮した結果の長さと配列の長さの差の符号ビットを使い、分岐なしで LATIN1 か UTF16 の coder を返す。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2015, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/StringUTF16.java
lines: [240, 242]
function: "StringUTF16.coderFromArrayLen"
difficulty: 2
format: 2
tags: [文字列処理, ビット演算, 数値計算]
---

## ひとことで

`String` の内部では、文字の並びが 1 バイトで保存できる（LATIN1）か、2 バイトで保存する（UTF16）かを、`coder` という値で表します。

ある処理では、UTF16 の配列に文字を入れてから、1 バイトに縮められるかを試します。その結果の長さで、どちらの形の配列を使うかが決まります。`coderFromArrayLen` は、その判定を行います。

## コード

```java:line-numbers=240
    static byte coderFromArrayLen(byte[] value, int len) {
        return (byte) ((len - value.length) >>> Integer.SIZE - 1);
    }
```

## 前提知識

- **coder**: `LATIN1` は `0`、`UTF16` は `1` の値です。`String` の内部の保存形式を表します。
- **配列の長さ（`value.length`）**: UTF16 の配列の長さです。ここでは、1 文字を 2 バイトで書いた配列のバイト数になります。
- **`len`**: 1 バイトに縮めた後の長さです。縮められたときは、配列より短くなります。
- **符号ビット**: 差が負のときに 1 になるビットです。`>>> 31` で、最下位の 1 ビットに移します。

## 何をしているか

### 1. 長さの差を取る

```java:line-numbers=241
        return (byte) ((len - value.length) >>> Integer.SIZE - 1);
```

`len - value.length` は、縮めた長さと配列の長さの差です。`len` が配列と同じ長さなら差は 0、短ければ負になります。

### 2. 符号ビットを coder にする

```java:line-numbers=241
        return (byte) ((len - value.length) >>> Integer.SIZE - 1);
```

`>>> (Integer.SIZE - 1)` で、差の符号ビットを最下位へ移します。差が 0 なら 0（`LATIN1`）、負なら 1（`UTF16`）になります。

## ここがすごい

- **分岐を使わない**: 「同じ長さか」を `if` で判定する代わりに、差の符号で 0 か 1 を作ります。
- **比較を減算で置き換える**: 2 つの数の大小を、1 回の引き算と、符号ビットの取り出しで表しています。
- **前提がはっきりしている**: `len` は `value.length` を超えないように使われます。超えた場合、差は正になり、結果が `LATIN1` を指すので、この式は `len` が配列以下である前提で成り立ちます。
- **速く呼べる**: 小さな式なので、`@ForceInline` で呼び出しが展開され、文字列を作るたびの判定が軽くなります。

## まとめ

- `coderFromArrayLen` は、`len - value.length` の符号ビットを、`coder` の値として返す。
- `len` が配列と同じなら `LATIN1`（0）、短ければ `UTF16`（1）になる。
- 分岐なしの判定で、`String` の保存形式を選んでいる。
