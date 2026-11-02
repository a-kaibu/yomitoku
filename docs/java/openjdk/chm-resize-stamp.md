---
title: "表の大きさから、拡張中であることを示す印を作る"
description: "Java 標準の ConcurrentHashMap.resizeStamp。表の大きさの先頭の 0 の個数に、符号ビットの印を立てた値を作る。拡張の開始と、どの大きさの拡張かを、1 つの int に入れる。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/ConcurrentHashMap.java
lines: [2311, 2313]
function: "ConcurrentHashMap.resizeStamp"
difficulty: 3
format: 2
tags: [並行処理, データ構造, ビット演算]
---

## ひとことで

`ConcurrentHashMap` は、複数のスレッドから同時に使える `Map` です。要素が増えると、内部の表（配列）を大きくします。このとき、複数のスレッドが協力して拡張を行うので、「今どの大きさの拡張が進んでいるか」を、スレッド同士で共有する必要があります。

`resizeStamp(n)` は、表の大きさ `n` から、その拡張を表す「印（スタンプ）」を作るメソッドです。この印は、大きさに応じて違う値になるので、古い拡張と新しい拡張を区別できます。

## コード

```java:line-numbers=2311
    static final int resizeStamp(int n) {
        return Integer.numberOfLeadingZeros(n) | (1 << (RESIZE_STAMP_BITS - 1));
    }
```

## 前提知識

- **表の大きさ `n`**: 内部の配列の長さです。`ConcurrentHashMap` では、大きさは 2 の累乗です。
- **`Integer.numberOfLeadingZeros(n)`**: `n` の上位にある 0 の個数を返します。2 の累乗では、この値が「2 を何回掛けたか」と 1 対 1 で対応します。
- **`sizeCtl`**: 表の状態を表す共有の `int` です。拡張の印を入れる場所として使われます。
- **`RESIZE_STAMP_BITS`**: 印に使うビット数で、この実装では 16 です。
- **`RESIZE_STAMP_SHIFT`**: 印を `sizeCtl` の上位に置くための左シフト量です。

## 何をしているか

### 1. 定数を確認する

```java:line-numbers=580
    private static final int RESIZE_STAMP_BITS = 16;
```

`RESIZE_STAMP_BITS` は 16 です。印は、16 ビットの領域に入る値として作られます。

```java:line-numbers=591
    private static final int RESIZE_STAMP_SHIFT = 32 - RESIZE_STAMP_BITS;
```

`RESIZE_STAMP_SHIFT` は `32 - 16` で、16 です。印を左へ 16 ビットずらすと、`int` の上位 16 ビットに入ります。

### 2. 印の値を作る

```java:line-numbers=2311
    static final int resizeStamp(int n) {
        return Integer.numberOfLeadingZeros(n) | (1 << (RESIZE_STAMP_BITS - 1));
    }
```

`Integer.numberOfLeadingZeros(n)` は、2 の累乗の大きさを、0 の個数として表します。そこに `1 << 15` を `|` で足すと、上位ビットにも 1 が立ちます。この上位のビットが、後で符号ビットになる部分です。

### 3. `sizeCtl` の上位に入れる

```java:line-numbers=2372
                int rs = resizeStamp(n) << RESIZE_STAMP_SHIFT;
```

`resizeStamp(n) << RESIZE_STAMP_SHIFT` で、印を `sizeCtl` の上位ビットに置きます。元の印の上位ビットが、ちょうど `int` の符号ビットの位置に移るので、この値は負の数になります。負の値は、「今、拡張中」であることを表す目印として使われます。

## ここがすごい

- **大きさが違えば印も違う**: 2 の累乗ごとに、先頭の 0 の個数が変わります。そのため、異なる大きさの拡張が重なっても、印を比べれば区別できます。
- **1 つの int に収める**: 拡張の印と、協力しているスレッドの数を、同じ `sizeCtl` に入れています。CAS の 1 回で、その両方を更新できます。
- **負の値で「拡張中」を表す**: 符号ビットを使うので、「拡張中かどうか」の判定が、`sizeCtl < 0` という比較だけで行えます。
- **ロックを使わない拡張**: スレッドは、この印を見て、拡張に参加するかどうかを判断します。ロックで止めることなく、拡張を分担できます。

## まとめ

- `resizeStamp(n)` は、表の大きさの先頭の 0 の個数に、符号ビットの印を `|` で加えた値を返す。
- 印を `RESIZE_STAMP_SHIFT` だけ左へずらして `sizeCtl` の上位に入れると、負の値になり、拡張中であることを示す。
- 大きさごとに印が違うので、異なる拡張を区別できる。
