---
title: "CRC-32C の 8 つの表を、1 バイトの表から作る"
description: "Java 標準の CRC32C の静的初期化。1 バイトごとの表を、ビットを逆順にした多項式で作り、その表から残りの 7 つの表を順に作る。スライシング・バイ・8 の準備。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2014, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/zip/CRC32C.java
lines: [85, 107]
function: "CRC32C (static initializer)"
difficulty: 3
format: 2
tags: [ビット演算, アルゴリズム, 低レイヤ]
---

## ひとことで

CRC は、データの誤り（壊れていないか）を調べるための検査値です。CRC-32C は、その中で、多項式 `0x1EDC6F41` を使う方式です。

Java の `CRC32C` は、起動時に複数の表（ルックアップ表）を作っておき、データの計算では、その表を引いて速く計算します。この記事は、その表を作る処理です。

## コード

::: code-group

```java:line-numbers=85 [日本語訳]
    static {
        // ルックアップ表を作る
        // 多項式の最上位の項は、r の最下位ビットに置く（逆順のビット表現）
        for (int index = 0; index < byteTables[0].length; index++) {
           int r = index;
            for (int i = 0; i < Byte.SIZE; i++) {
                if ((r & 1) != 0) {
                    r = (r >>> 1) ^ REVERSED_CRC32C_POLY;
                } else {
                    r >>>= 1;
                }
            }
            byteTables[0][index] = r;
        }

        for (int index = 0; index < byteTables[0].length; index++) {
            int r = byteTables[0][index];

            for (int k = 1; k < byteTables.length; k++) {
                r = byteTables[0][r & 0xFF] ^ (r >>> 8);
                byteTables[k][index] = r;
            }
        }
```

```java:line-numbers=85 [原文]
    static {
        // Generate lookup tables
        // High-order polynomial term stored in LSB of r.
        for (int index = 0; index < byteTables[0].length; index++) {
           int r = index;
            for (int i = 0; i < Byte.SIZE; i++) {
                if ((r & 1) != 0) {
                    r = (r >>> 1) ^ REVERSED_CRC32C_POLY;
                } else {
                    r >>>= 1;
                }
            }
            byteTables[0][index] = r;
        }

        for (int index = 0; index < byteTables[0].length; index++) {
            int r = byteTables[0][index];

            for (int k = 1; k < byteTables.length; k++) {
                r = byteTables[0][r & 0xFF] ^ (r >>> 8);
                byteTables[k][index] = r;
            }
        }
```

:::

## 前提知識

- **CRC**: データのビットを、多項式で割った余りを求める方法です。実装では、1 ビットずつのシフトと XOR で、同じ計算を行います。
- **表（ルックアップ表）**: 1 バイトの値ごとに、あらかじめ計算した結果を並べた配列です。データを 1 バイトずつ読むとき、表を引くだけで済みます。
- **逆順のビット表現**: 多項式を、ビットの並びを反転した形で持つ方式です。右へシフトしながら計算するときに、この形を使います。`Integer.reverse(CRC32C_POLY)` で作ります。
- **スライシング・バイ・8**: 8 つの表を使い、8 バイトを一度に処理する方式です。コメントに、その名前とアルゴリズムの出典が書かれています。

## 何をしているか

### 1. 1 バイトの表を作る

```java:line-numbers=88
        for (int index = 0; index < byteTables[0].length; index++) {
           int r = index;
            for (int i = 0; i < Byte.SIZE; i++) {
                if ((r & 1) != 0) {
                    r = (r >>> 1) ^ REVERSED_CRC32C_POLY;
                } else {
                    r >>>= 1;
                }
            }
            byteTables[0][index] = r;
        }
```

`index` は、0 から 255 までの 1 バイトの値です。その値を、ビットを 1 つずつ右へ送るたびに、最下位ビットが 1 なら多項式と XOR します。8 回送り終えた `r` が、そのバイトに対する CRC の値になります。この結果を `byteTables[0][index]` に入れます。

### 2. 残りの 7 つの表を、前の表から作る

```java:line-numbers=100
        for (int index = 0; index < byteTables[0].length; index++) {
            int r = byteTables[0][index];

            for (int k = 1; k < byteTables.length; k++) {
                r = byteTables[0][r & 0xFF] ^ (r >>> 8);
                byteTables[k][index] = r;
            }
        }
```

`r = byteTables[0][r & 0xFF] ^ (r >>> 8)` は、1 バイト分の計算を 1 回進めることと同じです。表 `k` の値は、表 `k - 1` の値に、もう 1 バイト分の計算を加えたものです。この繰り返しで、8 つの表ができます。

## ここがすごい

- **計算の結果を表にしておく**: 1 バイトずつ 8 回ビットを送る計算は、表を作る時の 1 回だけで済みます。データを処理するときは、表を引くだけになります。
- **表の関係が規則的**: 表 `k` は、表 `0` を `k` 回適用した結果です。そのため、ループで順に作れます。
- **多項式は逆順で持つ**: `REVERSED_CRC32C_POLY` を使うので、右シフトの計算だけで CRC を求められます。
- **表の作り方は定数だけで決まる**: 入力のデータに関係なく、この静的初期化は 1 回だけ実行されます。

## まとめ

- 静的初期化は、1 バイトの値ごとの CRC を、ビットを 8 回送る計算で作る。
- 残りの 7 つの表は、前の表の値に、1 バイト分の計算を加えて順に作る。
- この 8 つの表が、後のデータ処理で 8 バイトを一度に計算するための準備になる。
