---
title: "0x1f のマスクで大文字と小文字を同じ値にそろえるハッシュ"
description: "Netty が大文字と小文字を区別しないハッシュを作るときの 4 文字パック関数。各文字と 0x1f の AND だけで、英字の大小を同じ値に写す。0x20 のビットを捨てる、よく考えられた一手。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2012 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: common/src/main/java/io/netty/util/internal/PlatformDependent.java
lines: [949, 961]
function: "PlatformDependent.hashCodeAsciiSanitizeInt"
difficulty: 3
format: 2
tags: [ハッシュ, 文字列処理, ビット演算]
---

## ひとことで

`hashCodeAsciiSanitizeInt(value, offset)` は、文字列の 4 文字を **1 つの `int`** にまとめる関数です。ただし、その際に **英字の大文字と小文字を同じ値にそろえる** のが特徴です。

Netty は、ヘッダー名のような「大文字と小文字を区別しない」文字列のハッシュを作ります。その元になる 4 文字ぶんの値を、この関数が作ります。

## コード

::: code-group

```java:line-numbers=949 [日本語訳]
    private static int hashCodeAsciiSanitizeInt(CharSequence value, int offset) {
        if (BIG_ENDIAN_NATIVE_ORDER) {
            // unsafe.getInt の呼び出しを、ビッグエンディアンのマシンで真似している
            return (value.charAt(offset + 3) & 0x1f) |
                   (value.charAt(offset + 2) & 0x1f) << 8 |
                   (value.charAt(offset + 1) & 0x1f) << 16 |
                   (value.charAt(offset) & 0x1f) << 24;
        }
        return (value.charAt(offset + 3) & 0x1f) << 24 |
               (value.charAt(offset + 2) & 0x1f) << 16 |
               (value.charAt(offset + 1) & 0x1f) << 8 |
               (value.charAt(offset) & 0x1f);
    }
```

```java:line-numbers=949 [原文]
    private static int hashCodeAsciiSanitizeInt(CharSequence value, int offset) {
        if (BIG_ENDIAN_NATIVE_ORDER) {
            // mimic a unsafe.getInt call on a big endian machine
            return (value.charAt(offset + 3) & 0x1f) |
                   (value.charAt(offset + 2) & 0x1f) << 8 |
                   (value.charAt(offset + 1) & 0x1f) << 16 |
                   (value.charAt(offset) & 0x1f) << 24;
        }
        return (value.charAt(offset + 3) & 0x1f) << 24 |
               (value.charAt(offset + 2) & 0x1f) << 16 |
               (value.charAt(offset + 1) & 0x1f) << 8 |
               (value.charAt(offset) & 0x1f);
    }
```

:::

## 前提知識

- **ASCII の大文字と小文字**: `'A'` は `0x41`、`'a'` は `0x61` です。違うのは `0x20`（下から 6 番目のビット）だけです。
- **`0x1f`**: 2 進数で `0001 1111` です。AND を取ると、下位 5 ビットだけが残ります。
- **`charAt(i)`**: 文字列の `i` 番目の文字を返します。`char` は 16 ビットの数です。
- **`<<`（左シフト）**: ビットを左にずらして、4 文字を `int` の中の別々の 8 ビットに置きます。
- **エンディアン**: 4 バイトを、どちらの端から並べるかの決まりです。CPU によって違うので、ビッグエンディアンとリトルエンディアンの 2 つの分岐があります。

## 何をしているか

### 1. 各文字の下位 5 ビットだけを残す

```java:line-numbers=957
        return (value.charAt(offset + 3) & 0x1f) << 24 |
               (value.charAt(offset + 2) & 0x1f) << 16 |
               (value.charAt(offset + 1) & 0x1f) << 8 |
               (value.charAt(offset) & 0x1f);
```

各文字を `& 0x1f` で処理すると、下位 5 ビットだけが残ります。

- `'A'`（`0x41`）→ `0x01`
- `'a'`（`0x61`）→ `0x01`

大文字と小文字の違いは `0x20` のビットだけなので、`& 0x1f` でそのビットが消えます。結果、英字の大文字と小文字が同じ値になります。

### 2. 4 文字を 1 つの `int` に詰める

同じ行で、`<< 24`、`<< 16`、`<< 8` と左にずらし、OR で 4 つを合わせます。`offset + 3` の文字が一番上の 8 ビットに入ります。

### 3. 具体的な値で追う

`"Host"` と `"HOST"` を比べます。

- `H`（`0x48`）と `h`（`0x68`）は、どちらも `0x08`。
- `o` と `O` は、どちらも `0x0f`。
- `s` と `S` は、どちらも `0x13`。
- `t` と `T` は、どちらも `0x14`。

4 文字を詰めた `int` は、大文字でも小文字でも同じ値になります。

### 4. ビッグエンディアンの分岐

```java:line-numbers=950
        if (BIG_ENDIAN_NATIVE_ORDER) {
            // unsafe.getInt の呼び出しを、ビッグエンディアンのマシンで真似している
            return (value.charAt(offset + 3) & 0x1f) |
                   (value.charAt(offset + 2) & 0x1f) << 8 |
                   (value.charAt(offset + 1) & 0x1f) << 16 |
                   (value.charAt(offset) & 0x1f) << 24;
        }
```

ビッグエンディアンの CPU では、詰める順序が逆になります。この分岐は、Java の `unsafe.getInt` で読んだときと同じ値になるように、並びを合わせています。

## ここがすごい

- **1 つのマスクで大小を同一視**: 英字の大文字と小文字は、ASCII の並びで `0x20` だけ違います。その 1 ビットを `& 0x1f` で消すことで、大小を区別しないハッシュが、比較もなしで作られます。
- **衝突の注意**: `& 0x1f` は、英字以外の文字も同じ値にしてしまいます。たとえば `'!'`（`0x21`）と `'A'` は、どちらも `0x01` です。ハッシュが一致しても、最後は大小を区別しない比較で確かめる設計なので、問題になりません。ハッシュは、あくまで絞り込みの道具なのです。
- **速く読むための詰め込み**: 4 文字を 1 回の `int` にまとめると、ハッシュの計算を 4 文字ずつ進められます。ハッシュ値の計算は、ヘッダーの処理の中で何度も使われるので、この速さは効きます。
- **エンディアンを意識**: CPU の並び方に合わせて、2 つの書き方を用意しています。移植性を保ちながら、どの環境でも同じ結果になるように作られています。

## まとめ

- `& 0x1f` は、英字の大文字と小文字を同じ値にそろえるマスク。
- 文字を `int` に詰めると、ハッシュの計算が速くなる。
- 大小を同一視するハッシュは、一致したときに最後の比較で確かめる。
