---
title: "「以上で最小の 2 のべき乗」を 1 行で求める"
description: "HashMap の配列の大きさを決める関数。-1 を先頭の 0 の数だけ右シフトして、ループなしで「cap 以上の最小の 2 のべき乗」を作る。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1997, 2025, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/HashMap.java
lines: [377, 380]
function: "HashMap.tableSizeFor"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 標準ライブラリ]
---

## ひとことで

`HashMap.tableSizeFor(cap)` は、**`cap` 以上で最小の 2 のべき乗** を返します。`10` なら `16`、`16` なら `16`、`17` なら `32` です。

`new HashMap<>(10)` のように初期容量を指定すると、HashMap は内部の配列の長さを 2 のべき乗に切り上げます。その計算がこの関数です。ループを使わず、ビット演算と比較だけで済ませています。

## コード

```java:line-numbers=377
    static final int tableSizeFor(int cap) {
        int n = -1 >>> Integer.numberOfLeadingZeros(cap - 1);
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
    }
```

`MAXIMUM_CAPACITY` は同じファイルで `1 << 30`（約 10 億）と定義されています。

```java:line-numbers=245
    static final int MAXIMUM_CAPACITY = 1 << 30;
```

## 前提知識

- **2 のべき乗**: 1, 2, 4, 8, 16 … のように 2 を何回か掛けた数です。2 進数では `1` が 1 つだけ立った形（`10000` など）になります。
- **`-1` のビット**: Java の `int` で `-1` は 32 ビットすべてが `1` です。
- **`>>>`（符号なし右シフト）**: 右にずらし、左端に `0` を入れます。`-1 >>> 28` は下位 4 ビットだけが 1、つまり `15` です。
- **`Integer.numberOfLeadingZeros(x)`**: `x` の上位から 0 が何個続くかを返す関数です。`9`（`1001`）なら `28` です。
- **三項演算子の連鎖**: `a ? b : c ? d : e` は「`a` なら `b`、そうでなく `c` なら `d`、それ以外は `e`」です。

## 何をしているか

### 1. 「cap - 1 と同じ桁数の全部 1」を作る

```java:line-numbers=378
        int n = -1 >>> Integer.numberOfLeadingZeros(cap - 1);
```
`cap = 10` で追います。

- `cap - 1 = 9` は 2 進数で `1001`（4 桁）。上位の 0 は 28 個です。
- `-1 >>> 28` は下位 4 ビットだけが 1 の `1111` = `15`。

つまり `n` は「`cap - 1` を 2 進数で書いたときと同じ桁数で、全部 1 の数」になります。

### 2. 1 を足して 2 のべき乗に

```java:line-numbers=379
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
```
`1111 + 1 = 10000` = `16`。全部 1 の数に 1 を足すと、繰り上がりでちょうど 2 のべき乗になります。

### なぜ `cap - 1` なのか

`cap` がすでに 2 のべき乗、たとえば `16`（`10000`）だとします。そのまま使うと桁数は 5 で、`11111 + 1 = 32` になってしまいます。先に 1 を引いて `15`（`1111`）にしておけば、`16` が返ります。**ちょうど 2 のべき乗のときに大きくしすぎない** ための 1 です。

### 端のケース

```java:line-numbers=379
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
```
- `cap = 1` のとき `cap - 1 = 0` で、上位の 0 は 32 個です。Java のシフトは量を 0〜31 に丸めるので `-1 >>> 32` は `-1 >>> 0` = `-1` になり、`n < 0` で `1` が返ります。`cap = 0` のときも `-1` から先頭の 0 が 0 個なので `n = -1` で、同じく `1` です。
- 大きすぎる値は `MAXIMUM_CAPACITY` で頭打ちにします。

## ここがすごい

- **昔はシフトを 5 回**: 以前の JDK では `n |= n >>> 1; n |= n >>>2; …; n |= n >>> 16;` と、最上位の 1 から下を全部 1 で埋める処理を 5 段で書いていました。現在の版は、CPU の専用命令に置き換わる `numberOfLeadingZeros` を使って、1 回のシフトで同じ「全部 1」を作ります。
- **-1 を材料にする発想**: 「全部 1 のビット列を、必要な桁数だけ残す」という逆向きの考え方です。上から埋めるのではなく、全部 1 から削るので、計算が 1 回で終わります。
- **境界値がシフトの性質で自然に処理される**: `cap` が 0 や 1 のときも、Java のシフト量の丸めによって `n` が負になり、1 つの比較でまとめて扱えます。

## まとめ

- 全部 1 の数に 1 を足すと 2 のべき乗になる。
- `-1 >>> k` で「下位 32-k ビットだけが 1」の数が作れる。
- 「以上で最小の 2 のべき乗」では、ちょうど 2 のべき乗の入力のために、先に 1 を引いておく。
