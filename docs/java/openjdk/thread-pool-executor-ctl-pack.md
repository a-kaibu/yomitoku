---
title: "1 つの int に、実行状態と作業スレッド数を詰める"
description: "Java 標準の ThreadPoolExecutor の ctl。上位 3 ビットに実行状態、下位 29 ビットにスレッド数を入れ、1 つの AtomicInteger で両方を同時に更新する。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/ThreadPoolExecutor.java
lines: [383, 396]
function: "ThreadPoolExecutor.ctlOf"
difficulty: 3
format: 2
tags: [並行処理, ビット演算, ロック不要]
---

## ひとことで

`ThreadPoolExecutor` は、スレッドを管理する Java の仕組みです。このクラスは、今の状態（動いているか、停止中か）と、作業中のスレッド数を、1 つの `int` に一緒に入れて管理しています。その値は `ctl` という名前の `AtomicInteger` に入っています。

状態とスレッド数を 1 つの値にまとめたので、CAS の 1 回で両方を同時に変えられます。ロックを使わずに、「状態が RUNNING のときだけスレッドを増やす」といった判断を、確実に行えます。

## コード

::: code-group

```java:line-numbers=383 [日本語訳]
    private static final int COUNT_BITS = Integer.SIZE - 3;
    private static final int COUNT_MASK = (1 << COUNT_BITS) - 1;

    // runState は上位ビットに入れる
    private static final int RUNNING    = -1 << COUNT_BITS;
    private static final int SHUTDOWN   =  0 << COUNT_BITS;
    private static final int STOP       =  1 << COUNT_BITS;
    private static final int TIDYING    =  2 << COUNT_BITS;
    private static final int TERMINATED =  3 << COUNT_BITS;

    // ctl の詰め込みと取り出し
    private static int runStateOf(int c)     { return c & ~COUNT_MASK; }
    private static int workerCountOf(int c)  { return c & COUNT_MASK; }
    private static int ctlOf(int rs, int wc) { return rs | wc; }
```

```java:line-numbers=383 [原文]
    private static final int COUNT_BITS = Integer.SIZE - 3;
    private static final int COUNT_MASK = (1 << COUNT_BITS) - 1;

    // runState is stored in the high-order bits
    private static final int RUNNING    = -1 << COUNT_BITS;
    private static final int SHUTDOWN   =  0 << COUNT_BITS;
    private static final int STOP       =  1 << COUNT_BITS;
    private static final int TIDYING    =  2 << COUNT_BITS;
    private static final int TERMINATED =  3 << COUNT_BITS;

    // Packing and unpacking ctl
    private static int runStateOf(int c)     { return c & ~COUNT_MASK; }
    private static int workerCountOf(int c)  { return c & COUNT_MASK; }
    private static int ctlOf(int rs, int wc) { return rs | wc; }
```

:::

## 前提知識

- **`int` の 32 ビット**: 上位 3 ビットと下位 29 ビットに分けると、それぞれに別の情報を入れられます。
- **`COUNT_BITS` と `COUNT_MASK`**: `COUNT_BITS` は下位のビット数（29）です。`COUNT_MASK` は、その 29 ビットがすべて 1 の値です。
- **符号付きの `int`**: 最上位ビットが 1 のとき、`int` は負の数になります。`RUNNING` は負の値で、他の状態より小さくなります。
- **`AtomicInteger`**: 複数のスレッドから、CAS で安全に書き換えられる `int` です。
- **`|` と `&`**: `|` で値を合わせ、`& ~COUNT_MASK` や `& COUNT_MASK` で、片方のビットだけを取り出します。

## 何をしているか

### 1. 状態の値を上位ビットに置く

```java:line-numbers=383
    private static final int COUNT_BITS = Integer.SIZE - 3;
    private static final int COUNT_MASK = (1 << COUNT_BITS) - 1;

    // runState は上位ビットに入れる
    private static final int RUNNING    = -1 << COUNT_BITS;
    private static final int SHUTDOWN   =  0 << COUNT_BITS;
    private static final int STOP       =  1 << COUNT_BITS;
    private static final int TIDYING    =  2 << COUNT_BITS;
    private static final int TERMINATED =  3 << COUNT_BITS;
```

`COUNT_BITS` は 29 です。`RUNNING` は `-1 << 29` で、最上位の 3 ビットを使った負の値です。`SHUTDOWN`、`STOP`、`TIDYING`、`TERMINATED` は、`0`、`1`、`2`、`3` を `29` ビット左へずらした値です。こうすると、状態の大小関係が、そのまま `int` の大小関係になります。

### 2. 状態とスレッド数を 1 つにまとめる

```java:line-numbers=393
    // ctl の詰め込みと取り出し
    private static int runStateOf(int c)     { return c & ~COUNT_MASK; }
    private static int workerCountOf(int c)  { return c & COUNT_MASK; }
    private static int ctlOf(int rs, int wc) { return rs | wc; }
```

`ctlOf(rs, wc)` は、状態 `rs` とスレッド数 `wc` を `|` で合わせます。`runStateOf(c)` は、`c & ~COUNT_MASK` で上位の状態だけを取り出します。`workerCountOf(c)` は、`c & COUNT_MASK` で下位のスレッド数だけを取り出します。

## ここがすごい

- **大小比較だけで状態を判定できる**: `c < SHUTDOWN` のように、整数の比較で「停止に向かっているか」が分かります。状態を表す列挙型より、比較が速くなります。
- **1 回の CAS で 2 つを同時に更新する**: 状態とスレッド数が 1 つの値にあるので、「停止中なのでスレッドを増やさない」という判断と、増やす操作の間に、状態が変わる隙がありません。
- **ロックを使わない**: 状態の確認と更新を、`AtomicInteger` の CAS だけで行います。実行中の作業が多いほど、ロックの待ちが減ります。
- **スレッド数に上限がある**: 29 ビットでスレッド数を表せる上限は、約 5 億です。この上限を前提に、1 つの `int` に収める設計になっています。

## まとめ

- `ctl` は、上位 3 ビットに実行状態、下位 29 ビットにスレッド数を入れた 1 つの `int` である。
- 状態の値は負の数から順に並ぶので、整数の比較だけで状態の前後関係を判定できる。
- `ctlOf` で 2 つを合わせ、`runStateOf` と `workerCountOf` で取り出す。
