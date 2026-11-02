---
title: "53 ビットの乱数から 0 以上 1 未満の小数を作る"
description: "Java 標準の Random.nextDouble()。内部の next を 2 回呼び、26 ビットと 27 ビットを合わせて 53 ビットの整数にし、2 の -53 乗を掛けて小数にする。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1995, 2024, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Random.java
lines: [691, 693]
function: "Random.nextDouble"
difficulty: 2
format: 2
tags: [乱数, 数値計算, ビット演算]
---

## ひとことで

`Random.nextDouble()` は、0 以上 1 未満の `double` の乱数を返します。`double` の仮数部は 53 ビットなので、53 ビットの整数を作り、その値を 2 の -53 乗で割った形で小数にしています。

## コード

```java:line-numbers=691
    public double nextDouble() {
        return (((long)(next(Double.PRECISION - 27)) << 27) + next(27)) * DOUBLE_UNIT;
    }
```

## 前提知識

- **`next(bits)`**: `Random` の内部のメソッドで、指定したビット数の乱数を `int` にして返します。`next(26)` は 26 ビットの値を返します。
- **仮数の桁数**: `double` の仮数は、隠れた 1 を含めて 53 ビットです。`Double.PRECISION` はこの値を表す定数です。
- **`DOUBLE_UNIT`**: `0x1.0p-53` という定数で、`1.0 / (1L << 53)` と同じ値です。この定数を掛けると、整数を 0 以上 1 未満の小数に変換できます。
- **`long` のシフト**: `<<` は、ビットを左へずらす演算です。`<< 27` は、値を 2 の 27 乗倍することに当たります。

## 何をしているか

### 1. 26 ビットの乱数を作る

```java:line-numbers=691
    public double nextDouble() {
        return (((long)(next(Double.PRECISION - 27)) << 27) + next(27)) * DOUBLE_UNIT;
```

`next(Double.PRECISION - 27)` は `next(26)` と同じ意味です。この値は `long` にキャストしてから 27 ビット左へずらします。上位 26 ビットとして、値の大きな位置に置かれることになります。

### 2. 27 ビットの乱数を足す

`+ next(27)` で、下位 27 ビットの乱数を足します。上位の 26 ビットと下位の 27 ビットを合わせると、ちょうど 53 ビットの整数になります。

### 3. 2 の -53 乗を掛けて小数にする

`* DOUBLE_UNIT` で、53 ビットの整数を 0 以上 1 未満の小数にします。53 ビットの最大値は `2^53 - 1` なので、結果は必ず 1 より小さくなります。

## ここがすごい

- **53 ビット全部を使う**: `double` の仮数部に入る桁数をちょうど使っています。そのため、0 から 1 の間の値が、同じ間隔で均一に出てきます。
- **乱数 2 回で済む**: 53 ビットを 1 回の `next` で作ることはできません。`next` は最大 32 ビットしか返さないので、2 回に分けて合わせています。
- **浮動小数点の演算は 1 回だけ**: 整数を作るところは全部 `long` のビット演算です。小数になるのは最後の掛け算 1 回だけで、丸めの誤差が入りにくい作りです。

## まとめ

- `nextDouble` は、26 ビットと 27 ビットの乱数を合わせて 53 ビットの整数を作る。
- その整数に 2 の -53 乗を掛けて、0 以上 1 未満の `double` にする。
- `double` の仮数部の桁数を使い切るのが、この実装の要点である。
