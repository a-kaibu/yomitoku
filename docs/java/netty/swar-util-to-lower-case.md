---
title: "8 バイトをまとめて、ASCII の大文字を小文字にする"
description: "Netty の SWARUtil.toLowerCase(long)。大文字の位置だけを 1 回の計算で見つけ、その位置の 0x20 ビットを立てる。8 文字を同時に小文字へ変える。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2024 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: common/src/main/java/io/netty/util/internal/SWARUtil.java
lines: [143, 146]
function: "SWARUtil.toLowerCase"
difficulty: 3
format: 2
tags: [文字列処理, ビット演算, 最適化]
---

## ひとことで

`toLowerCase(word)` は、`long` に詰めた 8 個の ASCII 文字を、一度にすべて小文字に変えるメソッドです。大文字の A から Z だけを小文字にし、数字や記号はそのままにします。

HTTP のヘッダ名などは大文字と小文字を区別しないので、比べる前に小文字へそろえる必要があります。1 文字ずつ変えるより、8 文字まとめて変えたほうが速くなります。

## コード

```java:line-numbers=143
    public static long toLowerCase(final long word) {
        final long mask = applyUpperCasePattern(word) >>> 2;
        return word | mask;
    }
```

## 前提知識

- **ASCII の大文字と小文字**: 'A' は 0x41、'a' は 0x61 です。違いは、0x20 のビットだけです。そのため、大文字に 0x20 を足す（ORする）と、小文字になります。
- **大文字の範囲**: 'A' から 'Z' は 0x41 から 0x5A です。これ以外の文字に 0x20 を足すと、別の文字になってしまいます。
- **マスク**: `0x7F7F...` のように、各バイトの一部のビットだけを残す値です。
- **`applyUpperCasePattern`**: 大文字のバイトだけ、最上位ビットを立てるメソッドです。ここでは、その結果を使います。

## 何をしているか

### 1. 大文字の位置を見つける

```java:line-numbers=64
        long rotated = word & 0x7F7F7F7F7F7F7F7FL;
        rotated += 0x2525252525252525L;
        rotated &= 0x7F7F7F7F7F7F7F7FL;
        rotated += 0x1A1A1A1A1A1A1A1AL;
        rotated &= ~word;
        rotated &= 0x8080808080808080L;
        return rotated;
```

`applyUpperCasePattern` は、各バイトが 'A' から 'Z' の範囲なら、その最上位ビットを立てます。下位 7 ビットに 0x25 を足すと、'Z' より後ろの文字が 0x80 を超えます。続けて 0x1A を足すと、'A' から 'Z' の範囲の文字だけが 0x80 以上になります。最後に `~word` で、元から最上位ビットが立っている（ASCII でない）バイトを除外します。

### 2. 大文字の位置だけ 0x20 を立てる

```java:line-numbers=144
        final long mask = applyUpperCasePattern(word) >>> 2;
        return word | mask;
```

`applyUpperCasePattern(word) >>> 2` は、最上位ビット 0x80 を、0x20 の位置へずらします。0x80 を右へ 2 ビットずらすと、0x20 になります。大文字のバイトだけ 0x20 が立つので、そのまま `word | mask` を計算すると、大文字だけが小文字になります。

### 3. 他の文字は変わらない

大文字でないバイトは、マスクが 0 なので、`word | 0` で変わりません。数字や記号、すでに小文字の文字も、そのまま残ります。

## ここがすごい

- **8 文字を同時に変える**: 1 文字ずつの `if` と `+ 32` を、8 文字分まとめて計算できます。
- **0x20 の性質を使う**: ASCII で大文字と小文字は 0x20 の差だけなので、OR を使うと、比較も分岐もなしに変換できます。
- **範囲の判定も加算で**: 'A' から 'Z' の範囲判定を、加算と最上位ビットの判定だけで済ませています。
- **非 ASCII は範囲外**: 最上位ビットを使うので、1 バイトの値が 0x80 以上の場合は、マスクで除外されます。ASCII の範囲だけを扱う設計です。

## まとめ

- `toLowerCase(long)` は、8 バイトの中の大文字を見つけ、その位置に 0x20 を立てる。
- ASCII の大文字と小文字の違いは 0x20 のビットだけなので、OR で小文字にできる。
- 大文字以外のバイトは変わらず、比較や分岐を使わずに 8 文字をまとめて変換する。
