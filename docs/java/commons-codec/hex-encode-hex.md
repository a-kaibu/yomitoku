---
title: "16 文字の表を引いて、1 バイトを 2 文字に変える"
description: "Apache Commons Codec の Hex.encodeHex の中心部分。1 バイトの上位 4 ビットと下位 4 ビットをそれぞれ 16 文字の表で引くだけで、16 進数の文字列を作る。計算も変換もほとんどない素直な実装。"
language: java
project: Apache Commons Codec
repo: https://github.com/apache/commons-codec
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "7fa065c5b5f78c66322b9f33f5e396b2c2b62c27"
file: src/main/java/org/apache/commons/codec/binary/Hex.java
lines: [215, 222]
function: "Hex.encodeHex"
difficulty: 1
format: 2
tags: [文字列処理, ビット演算, 標準ライブラリ]
---

## ひとことで

`Hex.encodeHex(data)` は、バイトの配列を **16 進数の文字列**（例: `0x1F` を `1f`）に変換します。ファイルのハッシュ値や、通信の中身を人が読める形で表すときによく使われます。

この記事で扱うのは、その中心にある `encodeHex` の 1 つです。1 バイトを必ず **ちょうど 2 文字** に変換します。

## コード

::: code-group

```java:line-numbers=215 [日本語訳]
    private static char[] encodeHex(final byte[] data, final int dataOffset, final int dataLen, final char[] toDigits, final char[] out, final int outOffset) {
        // 2 つの文字で 1 つの 16 進数の値を表す。
        for (int i = dataOffset, j = outOffset; i < dataOffset + dataLen; i++) {
            out[j++] = toDigits[(0xF0 & data[i]) >>> 4];
            out[j++] = toDigits[0x0F & data[i]];
        }
        return out;
    }
```

```java:line-numbers=215 [原文]
    private static char[] encodeHex(final byte[] data, final int dataOffset, final int dataLen, final char[] toDigits, final char[] out, final int outOffset) {
        // two characters form the hex value.
        for (int i = dataOffset, j = outOffset; i < dataOffset + dataLen; i++) {
            out[j++] = toDigits[(0xF0 & data[i]) >>> 4];
            out[j++] = toDigits[0x0F & data[i]];
        }
        return out;
    }
```

:::

このコードが使う数字の表は、同じファイルで次のように定義されています。

```java:line-numbers=64
    private static final char[] DIGITS_LOWER = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };
```

## 前提知識

- **16 進数**: 0〜9 と a〜f（または A〜F）の 16 種類の記号で数を表す方法です。1 桁で 4 ビット（0〜15）を表せます。
- **1 バイトと 2 桁**: 1 バイトは 8 ビットなので、16 進数だと必ず 2 桁になります。`0x05` は `05`、`0xFF` は `ff` です。
- **`byte`**: Java の 8 ビットの整数型で、値の範囲は −128〜127 です。負の値は 2 の補数で表されます。
- **`char[]`**: 文字の配列です。結果を文字列にするために、いったん配列に詰めます。
- **`>>> 4`**: 4 ビット右にずらして、上位の 4 ビットを下位へ運びます。

## 何をしているか

### 1. 1 バイトを 2 つに分ける

```java:line-numbers=218
            out[j++] = toDigits[(0xF0 & data[i]) >>> 4];
            out[j++] = toDigits[0x0F & data[i]];
```

1 バイトの上位 4 ビットと下位 4 ビットを、別々に取り出します。

- 上位 4 ビット: `0xF0 & data[i]` で取り出し、`>>> 4` で 0〜15 の値にします。
- 下位 4 ビット: `0x0F & data[i]` で取り出します。すでに 0〜15 の値です。

### 2. 表で文字に変える

`toDigits[...]` は、0〜15 の値を、対応する文字（`0` から `9`、`a` から `f`）に変える表です。

### 3. 具体的な値で追う

`data[i] = 0x1F`（10 進数で 31）で追います。

- 上位 4 ビット: `0x1F & 0xF0 = 0x10`。`>>> 4` で `1`。表の `1` は `'1'`。
- 下位 4 ビット: `0x1F & 0x0F = 0xF`。表の `15` は `'f'`。

よって `"1f"` という 2 文字が出力されます。

### 4. 配列に順に入れる

`j` は出力の位置です。1 バイトごとに 2 つずつ、上位の文字、下位の文字の順に入れていきます。ループは `i` と `j` を同時に進めます。

## ここがすごい

- **表を引くだけ**: 「0〜15 なら `'0'` から `'9'`、10 以上なら `'a'` から」という条件分岐を書かずに、16 文字の配列を 1 回引くだけで変換しています。分岐が減り、速く、読みやすくなります。
- **大文字と小文字を切り替える**: 表が 2 つ（`DIGITS_LOWER` と `DIGITS_UPPER`）あり、どちらを使うかを引数で選べます。変換の仕組みは同じで、表だけを差し替えています。
- **出力の大きさを事前に決める**: 出力の配列は、入力の長さの 2 倍（`dataLength << 1`）として、最初に確保します。途中で配列を広げ直す必要がなく、無駄なコピーが起きません。
- **マスクの役割**: `0xF0 & data[i]` のように、必要なビットだけを残します。`byte` は負の数になることがあるため、マスクで上位の符号の影響を消す役割もあります。

## まとめ

- 1 バイトは、上位 4 ビットと下位 4 ビットに分けて、それぞれ 1 文字に変換できる。
- 16 種類の記号の表を引けば、条件分岐なしで変換できる。
- 出力の大きさが分かっているなら、最初に配列を確保して、一度に埋める。
