---
title: "UTF-8 の 3 バイトを、XOR の定数で 1 文字の番号にする"
description: "Java 標準の String.decode3。UTF-8 の 3 バイト文字を、3 つのバイトを 6 ビットずつずらして XOR し、目印のビットを定数で打ち消して char にする。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/String.java
lines: [1213, 1220]
function: "String.decode3"
difficulty: 3
format: 2
tags: [文字列処理, ビット演算, 低レイヤ]
---

## ひとことで

UTF-8 では、日本語の多くの文字（たとえば `中`）が 3 バイトで表されます。`中` は `E4 B8 AD` です。

`String` は、3 バイトの文字を `decode3` で 1 つの `char` に直します。前の記事の `decode2`（2 バイト）と同じ考え方を、3 バイトに広げた形です。

## コード

```java:line-numbers=1213
    private static char decode3(int b1, int b2, int b3) {
        return (char)((b1 << 12) ^
                (b2 <<  6) ^
                (b3 ^
                        (((byte) 0xE0 << 12) ^
                                ((byte) 0x80 <<  6) ^
                                ((byte) 0x80 <<  0))));
    }
```

## 前提知識

- **UTF-8 の 3 バイト文字**: 1 バイト目は `1110xxxx`、2 バイト目と 3 バイト目は `10xxxxxx` の形です。`x` の部分に、文字の番号のビットが入ります。
- **符号拡張**: Java の `byte` は符号付きなので、`0xE4` は `-28` として、`int` の上の桁まで 1 で埋まった値になります。
- **XOR の打ち消し**: 同じ値を 2 回 XOR すると、元に戻ります。目印の部分を定数で作っておくと、XOR で消せます。
- **`<< 12` と `<< 6`**: 1 バイト目は 12 ビット、2 バイト目は 6 ビット左へずらし、それぞれのビットの位置に合わせます。

## 何をしているか

### 1. 3 つのバイトを、位置をずらして XOR で重ねる

```java:line-numbers=1214
        return (char)((b1 << 12) ^
                (b2 <<  6) ^
                (b3 ^
```

`b1 << 12` で 1 バイト目を、`b2 << 6` で 2 バイト目を、それぞれ上の位置へずらします。`b3` はずらさずに、最後の XOR に加わります。

### 2. 目印のビットを、定数の XOR で消す

```java:line-numbers=1217
                        (((byte) 0xE0 << 12) ^
                                ((byte) 0x80 <<  6) ^
                                ((byte) 0x80 <<  0))));
```

`(byte) 0xE0 << 12`、`(byte) 0x80 << 6`、`(byte) 0x80 << 0` は、UTF-8 の 3 バイト文字の目印（`1110`、`10`、`10`）を、符号拡張つきで作った定数です。この定数を XOR に含めると、目印が打ち消され、文字の番号だけが残ります。

例として、`中`（`E4 B8 AD`）は、`0x4E2D` になります。`中` の番号は、U+4E2D です。

## ここがすごい

- **3 つのバイトを 1 つの式で扱う**: ずらしと XOR だけで、3 バイトが 1 つの番号にまとまります。分岐や一時的な変数がありません。
- **定数の式が目印を表す**: `(byte) 0xE0 << 12` と書かれているので、どの位置の目印を消しているかが読み取れます。
- **符号拡張の打ち消し**: 1 バイト目、2 バイト目、定数のすべてが同じ方法で符号拡張されるので、上の桁が正しく 0 になります。
- **`char` に収まる**: 3 バイト文字の番号は 16 ビットに収まるので、最後に `(char)` へ変換するだけで結果になります。

## まとめ

- `decode3` は、3 バイトを `<< 12`、`<< 6`、そのままで重ね、目印を定数の XOR で消す。
- 目印の定数も符号拡張されているので、上の桁まで正しく打ち消される。
- 結果は `char` の番号で、`中` は `E4 B8 AD` から `0x4E2D` になる。
