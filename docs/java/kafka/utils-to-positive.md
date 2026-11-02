---
title: "符号ビットを消して必ず正の数にする"
description: "Apache Kafka の Utils.toPositive。int の最上位（符号）ビットをマスクで 0 にし、どんな値も必ず 0 以上にする。ハッシュ値を剰余で振り分けるときの定番の一行。"
language: java
project: Apache Kafka
repo: https://github.com/apache/kafka
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "68986c8df89a6a4786d74be7e4eabc16c7202564"
file: clients/src/main/java/org/apache/kafka/common/utils/Utils.java
lines: [1194, 1196]
function: "Utils.toPositive"
difficulty: 1
format: 2
tags: [ビット演算, ハック, ハッシュ]
---

## ひとことで

`Utils.toPositive(number)` は、`int` の値を必ず 0 以上の数にして返します。負の数だった場合も、符号を外して正の数にします。たとえば `-1` は `2147483647` になります。

Kafka では、メッセージのキーからハッシュ値を計算し、それを分割数で割った余りで送り先のパーティションを決めます。ハッシュ値が負の数になると、剰余も負になってしまうため、この関数で正の数に直してから割り算をします。

## コード

```java:line-numbers=1194
    public static int toPositive(int number) {
        return number & 0x7fffffff;
    }
```

## 前提知識

- **符号付きの `int`**: Java の `int` は、負の数と正の数を両方扱えます。最上位のビットが 1 のときは負の数になります。
- **符号ビット**: 最上位の 1 ビットです。0 なら正、1 なら負を表します。
- **`0x7fffffff`**: 2 進数で `0111 1111 ... 1111`、つまり最上位だけが 0 で残りが 1 のマスクです。
- **`&`（AND）**: 同じ桁がどちらも 1 のときだけ 1 になる演算です。マスクで特定の桁を 0 にできます。
- **剰余 `%`**: 割り算の余りです。負の数の剰余は負になるので、先にこの関数で正の数にするのが安全です。

## 何をしているか

### 1. 最上位ビットを 0 にする

```java:line-numbers=1195
        return number & 0x7fffffff;
```

`number & 0x7fffffff` は、最上位の符号ビットだけを 0 にします。残りの 31 ビットは、そのまま残ります。

### 2. 結果は必ず 0 以上になる

符号ビットが 0 になると、結果は正の数か 0 になります。`Integer.MIN_VALUE`（`-2147483648`）でも、結果は 0 になります。どの入力でも、負の値は出てきません。

- `5` は `5` のまま。
- `-1`（`1111 ... 1111`）は `0111 ... 1111`、つまり `2147483647` になる。

## ここがすごい

- **1 つのマスクで完結する**: 符号を判定して分岐する必要がありません。`& 0x7fffffff` だけで、どんな値も正の数になります。
- **値の意味を大きく変えない**: 符号ビットを落とすだけなので、ハッシュ値の散らばり方はほとんど変わりません。ハッシュの偏りを増やさずに、正の数にできます。
- **`Math.abs` と違う**: `Math.abs(Integer.MIN_VALUE)` は、まだ負の数のままです。`toPositive` は、どの入力でも必ず 0 以上になるので、ハッシュ値の振り分けに安全です。
- **ハッシュとの組み合わせ**: 正の数になったハッシュ値を `%` でパーティション数で割ると、必ず 0 からパーティション数 - 1 の範囲に収まります。

## まとめ

- `number & 0x7fffffff` で、符号ビットだけを 0 にして正の数にする。
- どの入力でも 0 以上の値になるので、剰余による振り分けが安全に働く。
- `Math.abs` と違い、最小値でも負の数にならない。
