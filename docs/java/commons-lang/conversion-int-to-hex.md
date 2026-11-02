---
title: "int の 4 ビットずつを、既存の文字列の好きな位置へ 16 進数字で書き込む"
description: "Apache Commons Lang の Conversion.intToHex。int の任意の位置から 4 ビットずつ取り出して 16 進数字に変え、既存の文字列の指定位置へ上書きまたは追加する。"
language: java
project: Apache Commons Lang
repo: https://github.com/apache/commons-lang
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "0a6e19f9c828d6a9087d55826367f537cef85854"
file: src/main/java/org/apache/commons/lang3/Conversion.java
lines: [950, 970]
function: "Conversion.intToHex"
difficulty: 2
format: 2
tags: [文字列処理, ビット演算, 低レイヤ]
---

## ひとことで

`intToHex` は、`int` の一部のビットを 16 進数の文字に変えて、既存の文字列の指定位置に書き込むメソッドです。たとえば `0x1234` の下位 16 ビットは `"1234"` という 16 進の文字列になります。

ふつうの `Integer.toHexString` は、値全体を文字列にします。このメソッドは、どこから何桁分を、どの位置に書くかを指定できるので、フォーマットの一部を組み立てる場面で使えます。

## コード

```java:line-numbers=950
    public static String intToHex(final int src, final int srcPos, final String dstInit, final int dstPos, final int nHexs) {
        if (0 == nHexs) {
            return dstInit;
        }
        if (((long) nHexs - 1) * 4 + srcPos >= Integer.SIZE) {
            throw new IllegalArgumentException("(nHexs - 1) * 4 + srcPos >= 32");
        }
        final StringBuilder sb = new StringBuilder(dstInit);
        int append = sb.length();
        for (int i = 0; i < nHexs; i++) {
            final int shift = i * 4 + srcPos;
            final int bits = 0xF & src >> shift;
            if (dstPos + i == append) {
                ++append;
                sb.append(intToHexDigit(bits));
            } else {
                sb.setCharAt(dstPos + i, intToHexDigit(bits));
            }
        }
        return sb.toString();
    }
```

## 前提知識

- **16 進数の 1 桁**: 4 ビットで表せます。0 から 15 の値が、`0` から `9`、`a` から `f` に対応します。
- **ニブル（nibble）**: 4 ビットのまとまりのことです。1 バイトは 2 ニブルからできています。
- **`0xF & src >> shift`**: `>>` は `&` より強く結びつくので、まず `src` を `shift` ビット右へずらし、その後 `0xF` でマスクします。これで、下位から 4 ビットを取り出せます。
- **`Character.forDigit(nibble, 16)`**: 0 から 15 の値を、16 進の文字に変えるメソッドです。
- **`StringBuilder`**: 文字列を途中で書き換えたり、末尾に足したりできる可変の文字列です。

## 何をしているか

### 1. 入力の範囲を確かめる

```java:line-numbers=951
        if (0 == nHexs) {
            return dstInit;
        }
        if (((long) nHexs - 1) * 4 + srcPos >= Integer.SIZE) {
            throw new IllegalArgumentException("(nHexs - 1) * 4 + srcPos >= 32");
        }
```

`nHexs` 桁を取り出すと、一番上の桁の位置は `(nHexs - 1) * 4 + srcPos` になります。この値が 32 以上なら、`int` のビットの外に出てしまうので、例外を投げます。計算に `long` を使っているのは、大きな `nHexs` で整数が溢れないようにするためです。

### 2. 4 ビットずつ取り出して、16 進の文字に変える

```java:line-numbers=957
        final StringBuilder sb = new StringBuilder(dstInit);
        int append = sb.length();
        for (int i = 0; i < nHexs; i++) {
            final int shift = i * 4 + srcPos;
            final int bits = 0xF & src >> shift;
```

`shift` は、`i` 番目の桁の開始ビットです。`0xF & src >> shift` で、その 4 ビットを取り出し、`intToHexDigit` で 16 進の文字にします。

### 3. 既存の文字列の位置へ、上書きか追加をする

```java:line-numbers=962
            if (dstPos + i == append) {
                ++append;
                sb.append(intToHexDigit(bits));
            } else {
                sb.setCharAt(dstPos + i, intToHexDigit(bits));
            }
```

書き込む位置が、今の末尾（`append`）と同じなら、新しい文字を末尾に追加します。そうでなければ、既存の位置の文字を置き換えます。`dstInit` の途中に書くこともでき、末尾を超えない限りは、既存の内容が残ります。

## ここがすごい

- **位置を自由に指定できる**: 取り出すビットの位置（`srcPos`）と、書き込む位置（`dstPos`）を別々に指定できます。16 進の文字列を、部分的に組み立てられます。
- **桁数の上限を計算で確かめる**: `long` で `(nHexs - 1) * 4 + srcPos` を計算し、32 ビットを超えるかを判定します。溢れてから気づくことがありません。
- **マスクとシフトだけで桁を取る**: 割り算も、表の検索も使わず、ビットの移動とマスクで 4 ビットを取り出します。
- **末尾への追加と上書きを 1 つの処理で**: `dstPos + i == append` の判定で、末尾の追加と既存の位置の置き換えを、同じループで扱います。

## まとめ

- `intToHex` は、`int` の `srcPos` から 4 ビットずつ取り出し、16 進の文字にする。
- 取り出す範囲は、`long` で計算した上限で 32 ビット以内に収まるかを確かめる。
- 書き込み先は、末尾なら追加、途中なら上書きする。
