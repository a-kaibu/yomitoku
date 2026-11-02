---
title: "1 つの long に、読み手と書き手の数を上下に分けて入れる"
description: "Java 標準の ReentrantReadWriteLock の内部状態。1 つの long の上位 32 ビットに読み取りの保持数、下位 32 ビットに書き込みの保持数を入れ、ビット演算で取り出す。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/locks/ReentrantReadWriteLock.java
lines: [268, 276]
function: "ReentrantReadWriteLock.Sync.sharedCount"
difficulty: 3
format: 2
tags: [並行処理, ビット演算, ロック不要]
---

## ひとことで

`ReentrantReadWriteLock` は、読み取りのロックと書き込みのロックを持つ、Java のロックです。読み取りは同時に複数のスレッドが持てますが、書き込みは 1 つのスレッドだけが持てます。

このロックは、読み取りの数と書き込みの数を、1 つの `long` の中に一緒に入れて管理しています。上位の 32 ビットが読み取りの数、下位の 32 ビットが書き込みの数です。1 つの値だけを更新すれば、2 つの数を同時に変えられるので、排他制御が簡単になります。

## コード

::: code-group

```java:line-numbers=268 [日本語訳]
        static final int SHARED_SHIFT   = 32;
        static final long SHARED_UNIT    = (1L << SHARED_SHIFT);
        static final long MAX_COUNT      = Integer.MAX_VALUE;
        static final long EXCLUSIVE_MASK = (1L << SHARED_SHIFT) - 1;

        /** 読み取りの保持数を返す。 */
        static int sharedCount(long c)    { return (int)(c >>> SHARED_SHIFT); }
        /** 書き込みの保持数を返す。 */
        static int exclusiveCount(long c) { return (int)(c & EXCLUSIVE_MASK); }
```

```java:line-numbers=268 [原文]
        static final int SHARED_SHIFT   = 32;
        static final long SHARED_UNIT    = (1L << SHARED_SHIFT);
        static final long MAX_COUNT      = Integer.MAX_VALUE;
        static final long EXCLUSIVE_MASK = (1L << SHARED_SHIFT) - 1;

        /** Returns the number of shared holds represented in count. */
        static int sharedCount(long c)    { return (int)(c >>> SHARED_SHIFT); }
        /** Returns the number of exclusive holds represented in count. */
        static int exclusiveCount(long c) { return (int)(c & EXCLUSIVE_MASK); }
```

:::

## 前提知識

- **読み取りロックと書き込みロック**: 読み取りは互いに邪魔しないので、同時に持てます。書き込みは、他の読み手も書き手もいない間だけ持てます。
- **保持数（hold count）**: 同じロックを何回取ったかの数です。再入可能なロックでは、同じスレッドが何回も取れるので、数で管理します。
- **`>>>`**: 符号を無視して、ビットを右へずらす演算です。`c >>> 32` で、上位 32 ビットを取り出せます。
- **`&`（マスク）**: 特定のビットだけを残す演算です。`c & EXCLUSIVE_MASK` で、下位 32 ビットを取り出せます。
- **`long` の 64 ビット**: 上位と下位を分けると、1 つの変数に 2 つの 32 ビットの数を入れられます。

## 何をしているか

### 1. 2 つの数を、1 つの long の上下に分ける

```java:line-numbers=268
        static final int SHARED_SHIFT   = 32;
        static final long SHARED_UNIT    = (1L << SHARED_SHIFT);
        static final long MAX_COUNT      = Integer.MAX_VALUE;
        static final long EXCLUSIVE_MASK = (1L << SHARED_SHIFT) - 1;
```

`SHARED_SHIFT` は 32 です。`SHARED_UNIT` は `1L << 32` で、読み取りの数を 1 増やすための値です。読み取りが 1 増えると、上位 32 ビットの値が 1 増えます。`EXCLUSIVE_MASK` は、下位 32 ビットだけが 1 の値で、書き込みの数を取り出すマスクです。

### 2. 読み取りの数を取り出す

```java:line-numbers=274
        static int sharedCount(long c)    { return (int)(c >>> SHARED_SHIFT); }
```

`c >>> 32` で、上位 32 ビットを下位へずらします。その結果を `int` にキャストすると、読み取りの保持数になります。

### 3. 書き込みの数を取り出す

```java:line-numbers=276
        static int exclusiveCount(long c) { return (int)(c & EXCLUSIVE_MASK); }
```

`c & EXCLUSIVE_MASK` で、下位 32 ビットだけを残します。その結果が、書き込みの保持数です。

## ここがすごい

- **1 回の書き換えで 2 つの状態を変える**: 読み取りと書き込みの数が同じ変数の中にあるので、CAS で 1 回書き換えれば、状態の整合性が保たれます。2 つの変数を別々に更新すると、途中の状態が見えてしまう危険があります。
- **マスクとシフトだけで取り出せる**: 数を取り出すのに、割り算や分岐は要りません。ホットパスでも速く済みます。
- **上限を 32 ビットに収める**: `MAX_COUNT` は `Integer.MAX_VALUE` です。それぞれの数が `int` の範囲に収まるように設計されています。
- **ロックの状態を 1 つの値で見られる**: 状態が 1 つの `long` なので、デバッグや判定が簡単です。

## まとめ

- `ReentrantReadWriteLock` は、読み取りの数を上位 32 ビット、書き込みの数を下位 32 ビットに入れている。
- `sharedCount` は、`c >>> 32` で読み取りの数を、`exclusiveCount` は、`c & EXCLUSIVE_MASK` で書き込みの数を取り出す。
- 1 つの値にまとめることで、2 つの数を 1 回の CAS で同時に更新できる。
