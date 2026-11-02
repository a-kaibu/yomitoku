---
title: "浮動小数点数のビットに 1 を足して、次の値を得る"
description: "Java 標準の Math.nextUp(double)。IEEE 754 の表現では、正の数のビットパターンは値の大きさの順に並ぶため、生のビットに 1 を足すだけで、次に大きい浮動小数点数が得られる。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [3263, 3272]
function: "Math.nextUp"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 低レイヤ]
---

## ひとことで

`Math.nextUp(d)` は、`d` より大きい、いちばん近い `double` の値を返します。たとえば `nextUp(1.0)` は、`1.0` の次に表せる値です。

浮動小数点数は、同じ大きさでも少しずつ間隔があります。どの値の次かを知りたいとき、この関数で正確に一つ先の値が得られます。

## コード

::: code-group

```java:line-numbers=3263 [日本語訳]
    public static double nextUp(double d) {
        // 条件分岐は 1 つにし、よくある場合を先に処理する
        if (d < Double.POSITIVE_INFINITY) {
            // +0.0 を足して -0.0 を消す（+0.0 + -0.0 は +0.0 になる）
            final long transducer = Double.doubleToRawLongBits(d + 0.0D);
            return Double.longBitsToDouble(transducer + ((transducer >= 0L) ? 1L : -1L));
        } else { // d は NaN か正の無限大
            return d;
        }
    }
```

```java:line-numbers=3263 [原文]
    public static double nextUp(double d) {
        // Use a single conditional and handle the likely cases first.
        if (d < Double.POSITIVE_INFINITY) {
            // Add +0.0 to get rid of a -0.0 (+0.0 + -0.0 => +0.0).
            final long transducer = Double.doubleToRawLongBits(d + 0.0D);
            return Double.longBitsToDouble(transducer + ((transducer >= 0L) ? 1L : -1L));
        } else { // d is NaN or +Infinity
            return d;
        }
    }
```

:::

## 前提知識

- **IEEE 754**: `double` の標準的な表現方式です。64 ビットを、符号・指数・仮数の 3 つの部分に分けて持ちます。
- **符号ビット**: 最上位の 1 ビットです。1 なら負の数、0 なら正の数を表します。
- **生のビット（raw bits）**: `Double.doubleToRawLongBits` は、`double` の 64 ビットを、そのまま `long` として読み出します。値への変換は含みません。
- **`-0.0` と `+0.0`**: 値は等しいのに、符号ビットだけが違う 0 です。
- **`Double.POSITIVE_INFINITY`**: 正の無限大です。これより大きい値はありません。

## 何をしているか

### 1. 無限大と NaN を先に除く

```java:line-numbers=3265
        if (d < Double.POSITIVE_INFINITY) {
```

`d < POSITIVE_INFINITY` のときだけ次の値を求めます。NaN と正の無限大は、それ以上大きくできないので、そのまま返します。

### 2. -0.0 を +0.0 にそろえる

```java:line-numbers=3267
            final long transducer = Double.doubleToRawLongBits(d + 0.0D);
```

`d + 0.0D` は、`-0.0` を `+0.0` に変えます。それ以外の値は変わりません。こうしておくと、0 の次は必ず最小の正の数になります。

### 3. 生のビットに 1 を足す

```java:line-numbers=3268
            return Double.longBitsToDouble(transducer + ((transducer >= 0L) ? 1L : -1L));
```

正の数では、ビットパターンを整数として見たときの大きさが、値の大きさと同じ順番になります。そのため、生のビットに 1 を足すと、次に大きい値のビットになります。負の数では、符号を除いた大きさが小さくなる方向へ進むので、`-1` を足します。

## ここがすごい

- **ビットを足すだけ**: 浮動小数点の計算の規則を調べなくても、整数の 1 を足すだけで、次の値が得られます。
- **順番がそのまま並ぶ**: IEEE 754 の表現は、正の数の中で、指数と仮数を並べたときに値の大きさの順になるように作られています。その性質を、そのまま使っています。
- **分岐は 1 つ**: 符号による処理の違いは、`transducer >= 0` の 1 か所だけです。よくあるケースを先に、分かりやすく書いています。
- **0 と無限大の扱い**: `-0.0` の補正と、無限大・NaN の除外によって、どの入力でも期待どおりの結果になります。

## まとめ

- 正の `double` は、生のビットを整数として見ても、値の大きさと同じ順に並ぶ。
- 生のビットに 1 を足すと次の値、負の数では 1 を引くと次の値になる。
- `-0.0` を先に `+0.0` にし、無限大と NaN は除いて扱う。
