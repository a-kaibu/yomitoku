---
title: "同じ identityHashCode でも偶数の添字に散らす掛け算"
description: "Java 標準の IdentityHashMap.hash。オブジェクトの identityHashCode を -254 倍して、下位ビットを使いつつ添字を必ず偶数にする。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2000, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/IdentityHashMap.java
lines: [314, 318]
function: "IdentityHashMap.hash"
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, データ構造]
---

## ひとことで

`IdentityHashMap` は、キーの `equals` ではなく、オブジェクトの同一性（同じ参照か）でキーを比べるマップです。このマップの中では、キーを表の添字に変える必要があります。

`hash` メソッドは、その添字を計算します。`System.identityHashCode` で得た値を、少し変わった方法で混ぜてから、表の大きさで割った余りを求めます。

## コード

::: code-group

```java:line-numbers=314 [日本語訳]
    private static int hash(Object x, int length) {
        int h = System.identityHashCode(x);
        //         // -254 を掛けて、ハッシュの下位ビットを使い、添字を偶数にする
        return ((h << 1) - (h << 8)) & (length - 1);
    }
```

```java:line-numbers=314 [原文]
    private static int hash(Object x, int length) {
        int h = System.identityHashCode(x);
        // Multiply by -254 to use the hash LSB and to ensure index is even
        return ((h << 1) - (h << 8)) & (length - 1);
    }
```

:::

## 前提知識

- **`identityHashCode`**: オブジェクトの `hashCode()` を上書きしていても、そのオブジェクトの「本来の」ハッシュ値を返すメソッドです。同一性で比べるマップには、この値を使います。
- **表の大きさは 2 の累乗**: `length - 1` は、下位のビットがすべて 1 のマスクになります。`& (length - 1)` は、割り算の余りを求めるより速く、添字を表の中に収められます。
- **線形探索**: 添字が衝突したら、隣の場所を順に見ていく方法です。このマップは、隣の位置へ進む形で衝突を解決します。
- **ビットの左シフト**: `h << 1` は `h` を 2 倍、`h << 8` は 256 倍にします。引き算で、`-254` 倍を作っています。

## 何をしているか

### 1. identityHashCode を -254 倍に混ぜる

```java:line-numbers=315
        int h = System.identityHashCode(x);
        //         // -254 を掛けて、ハッシュの下位ビットを使い、添字を偶数にする
```

`h` は、キーの同一性のハッシュ値です。コメントにあるとおり、`(h << 1) - (h << 8)` は `h * (2 - 256)` と同じ、つまり `h * -254` です。

### 2. 表の大きさで切り詰める

```java:line-numbers=317
        return ((h << 1) - (h << 8)) & (length - 1);
```

`& (length - 1)` で、表の大きさの範囲に収めます。`-254` は偶数なので、結果は必ず偶数になります。

## ここがすごい

- **偶数の添字だけを使う**: 表はキーと値を 1 組ずつ、隣り合う 2 つの場所に置く作りです。添字を偶数に揃えることで、キーの位置がずれません。
- **シフトと引き算で掛け算をする**: `h * -254` を、乗算命令を使わずに、シフトと引き算だけで作っています。古い JVM でも速く動くように、単純な形にしていると考えられます。
- **下位ビットを使う**: 2 の累乗の表では、添字は下位のビットだけで決まります。掛け算で下位ビットを混ぜることで、ハッシュ値の上の方だけが違う場合でも、添字が散らばります。
- **同じ式を再利用する**: `put` や `get` は、このメソッドを使って添字を求めます。表の大きさが変わったときも、式を変える必要はありません。

## まとめ

- `hash` は、`identityHashCode` を `-254` 倍にしてから、表の大きさで切り詰める。
- `-254` は偶数なので、添字は必ず偶数になり、キーと値の組がずれない。
- 掛け算はシフトと引き算で書かれ、下位ビットを混ぜて添字を散らす。
