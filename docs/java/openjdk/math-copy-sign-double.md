---
title: "符号だけを別の数からもらう"
description: "Java 標準の Math.copySign(double, double)。2 つの double のビットをマスクで分け、符号は sign から、大きさは magnitude から取って 1 つにまとめる。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Math.java
lines: [2974, 2980]
function: "Math.copySign"
difficulty: 2
format: 2
tags: [ビット演算, 数値計算, 低レイヤ]
---

## ひとことで

`Math.copySign(magnitude, sign)` は、`magnitude` の大きさと、`sign` の符号を組み合わせた数を返します。たとえば `copySign(3.0, -1.0)` は `-3.0` です。

浮動小数点数では、符号は 1 ビットで表されていて、それ以外のビットとは独立しています。このため、ビットをそのまま分けて組み直すだけで、大きさと符号を入れ替えられます。

## コード

```java:line-numbers=2974
    public static double copySign(double magnitude, double sign) {
        return Double.longBitsToDouble((Double.doubleToRawLongBits(sign) &
                                        (DoubleConsts.SIGN_BIT_MASK)) |
                                       (Double.doubleToRawLongBits(magnitude) &
                                        (DoubleConsts.EXP_BIT_MASK |
                                         DoubleConsts.SIGNIF_BIT_MASK)));
    }
```

## 前提知識

- **double のビット配置**: `double` は 64 ビットで、最上位の 1 ビットが符号、続く 11 ビットが指数、残りの 52 ビットが仮数です。
- **`doubleToRawLongBits`**: `double` のビット列を `long` として取り出すメソッドです。NaN のときも、ビットを変えずに取り出します。
- **マスク**: `&` で、特定のビットだけを残す操作です。`SIGN_BIT_MASK` は符号ビットだけが 1 の値です。
- **`longBitsToDouble`**: `long` のビット列を、もう一度 `double` として解釈し直すメソッドです。

## 何をしているか

### 1. 符号ビットを sign から取り出す

```java:line-numbers=2975
        return Double.longBitsToDouble((Double.doubleToRawLongBits(sign) &
                                        (DoubleConsts.SIGN_BIT_MASK)) |
```

`sign` のビット列と符号ビットのマスクの `&` を取ると、符号ビットだけが残ります。残りのビットは全部 0 になります。

### 2. 大きさを magnitude から取り出す

```java:line-numbers=2977
                                       (Double.doubleToRawLongBits(magnitude) &
                                        (DoubleConsts.EXP_BIT_MASK |
                                         DoubleConsts.SIGNIF_BIT_MASK)));
```

同じように、`magnitude` のビット列から、指数と仮数のビットだけを残します。指数と仮数のマスクを `|` で合わせた値が、符号ビット以外の全部 1 のマスクになります。

### 3. 2 つを合わせて double に戻す

`|` で 2 つのビット列を合わせ、`longBitsToDouble` で `double` に戻します。符号ビットは `sign` の値になり、それ以外は `magnitude` の値になります。

## ここがすごい

- **比較も計算もしない**: 符号を調べる `if` や、符号を掛ける乗算がありません。ビットの `&` と `|` だけで答えが出ます。
- **0 や無限大でも同じ式**: 符号付きの 0（`-0.0`）も、無限大も、同じ式で正しく扱えます。`copySign(1.0, -0.0)` は `-1.0` になります。
- **NaN の符号も取り出せる**: 生のビットを使うので、NaN の符号ビットも `sign` からそのまま取れます。
- **intrinsic 対象**: コードの上にある `@IntrinsicCandidate` は、JIT が専用の命令に置き換えてよい目印です。短い式だからこそ、高速化の対象になりやすいメソッドです。

## まとめ

- `copySign` は、符号ビットを `sign` から、残りのビットを `magnitude` から取って組み合わせる。
- 符号を調べる分岐がなく、マスクと `|` だけで済む。
- `double` のビット配置を知っていれば、読み解くことができる。
