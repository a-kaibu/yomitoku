---
title: "コードポイントを、上位のサロゲートの値へ変える"
description: "Java 標準の Character.highSurrogate。補助面の文字の番号から、UTF-16 の上位のサロゲートを、10 ビットのシフトと加算だけで求める。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2002, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Character.java
lines: [10022, 10025]
function: "Character.highSurrogate"
difficulty: 2
format: 2
tags: [文字列処理, ビット演算, 数値計算]
---

## ひとことで

Unicode の補助面の文字（65536 より大きい番号）は、UTF-16 では上位と下位の 2 つの `char` で表します。`highSurrogate` は、そのうち上位の `char` を求めるメソッドです。

`toCodePoint` の逆の計算になっています。こちらは、番号を 2 つの値に分ける側です。

## コード

```java:line-numbers=10022
    public static char highSurrogate(int codePoint) {
        return (char) ((codePoint >>> 10)
            + (MIN_HIGH_SURROGATE - (MIN_SUPPLEMENTARY_CODE_POINT >>> 10)));
    }
```

## 前提知識

- **コードポイント**: Unicode の文字の番号です。補助面の文字は `0x10000` 以上になります。
- **上位のサロゲート**: サロゲートペアの前半の `char` で、値は `0xD800` から `0xDBFF` までの範囲です。
- **`>>>`（符号なし右シフト）**: 右へずらし、空いた上のビットを 0 で埋めます。ここでは、番号を 1024 で割った商を取り出すのに使います。

## 何をしているか

### 1. 番号を 1024 で割り、範囲の先頭を足す

```java:line-numbers=10023
        return (char) ((codePoint >>> 10)
            + (MIN_HIGH_SURROGATE - (MIN_SUPPLEMENTARY_CODE_POINT >>> 10)));
```

`codePoint >>> 10` は、`codePoint` を 1024 で割った商です。その値に、`MIN_HIGH_SURROGATE - (MIN_SUPPLEMENTARY_CODE_POINT >>> 10)` という定数を足します。この定数は `0xD800 - 0x40` で、`0xD7C0` になります。

例として、😀（`U+1F600`）は `0x1F600 >>> 10` が `0x7D` になります。`0x7D + 0xD7C0` は `0xD83D` で、正しい上位の値です。

## ここがすごい

- **割り算を使わない**: 1024 で割る操作は、右シフトの 1 回で済みます。
- **定数を先に計算する**: `MIN_HIGH_SURROGATE - (MIN_SUPPLEMENTARY_CODE_POINT >>> 10)` は定数なので、実行時には足し算 1 回だけです。
- **下位の値との対になる**: 下位のサロゲートは `lowSurrogate` が、`codePoint & 0x3ff` を使って求めます。上位は 10 ビット右へずらし、下位は下の 10 ビットを取ります。2 つを合わせると、元の番号に戻ります。
- **戻り値は `char`**: 結果は 16 ビットの範囲に収まるので、`(char)` で型を変えるだけで済みます。

## まとめ

- `highSurrogate` は、コードポイントを 1024 で割った商に、定数を足して上位のサロゲートを求める。
- 割り算はシフトで、範囲の補正は定数の 1 回の足し算で済ませている。
- `lowSurrogate` と組み合わせると、番号を 2 つの `char` に分けて戻せる。
