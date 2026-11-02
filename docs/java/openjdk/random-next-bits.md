---
title: "48 ビットの線形合同法で、乱数の種を進める"
description: "Java 標準の java.util.Random の next(bits)。48 ビットの種を、掛け算・足し算・マスクで更新し、上位ビットを返す線形合同法の乱数生成。CAS のループで並行に安全にする。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1995, 2024, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/Random.java
lines: [432, 440]
function: "Random.next"
difficulty: 2
format: 2
tags: [乱数, ビット演算, 並行処理]
---

## ひとことで

`Random.next(bits)` は、乱数の「種（seed）」を次の値へ進め、その上位 `bits` ビットを返します。`nextInt()` や `nextLong()` などの基本になる関数です。

乱数は、前の種から次の種を計算する仕組みで作られます。この仕組みを線形合同法（LCG）と呼びます。同じ種からは、いつも同じ乱数列が生まれます。

## コード

```java:line-numbers=432
    protected int next(int bits) {
        long oldseed, nextseed;
        AtomicLong seed = this.seed;
        do {
            oldseed = seed.get();
            nextseed = (oldseed * multiplier + addend) & mask;
        } while (!seed.compareAndSet(oldseed, nextseed));
        return (int)(nextseed >>> (48 - bits));
    }
```

この関数が使う定数は、同じクラスで次のように定義されています。

```java:line-numbers=298
    private static final long multiplier = 0x5DEECE66DL;
    private static final long addend = 0xBL;
    private static final long mask = (1L << 48) - 1;
```

## 前提知識

- **乱数の種（seed）**: 乱数の列を決める初期値です。種が同じなら、同じ列になります。
- **線形合同法**: `next = (seed * a + c) mod m` の形で、次の種を作る方法です。掛け算、足し算、剰余だけで書けます。
- **`mask`**: 下位 48 ビットだけを残すマスクです。`(1L << 48) - 1` は、48 個の 1 が並んだ値です。
- **`AtomicLong`**: 複数のスレッドから安全に更新できる `long` です。`compareAndSet` は、「期待した値のときだけ新しい値に変える」操作です。
- **上位ビット**: 種の上の桁ほど、計算の影響を多く受けて、乱れがよいとされています。

## 何をしているか

### 1. 種を次の値へ進める

```java:line-numbers=436
            oldseed = seed.get();
            nextseed = (oldseed * multiplier + addend) & mask;
```

`oldseed * multiplier + addend` で、種を 1 回進めます。結果を `mask` で 48 ビットに切り詰めるので、種は常に 48 ビット以内に保たれます。

### 2. 競合があったらやり直す

```java:line-numbers=434
        AtomicLong seed = this.seed;
        do {
            oldseed = seed.get();
            nextseed = (oldseed * multiplier + addend) & mask;
        } while (!seed.compareAndSet(oldseed, nextseed));
```

`compareAndSet` で、読んだ種がまだ同じかを確かめ、同じなら新しい種を書き込みます。他のスレッドが先に進めていたら、もう一度読み直して計算します。ロックを使わずに、複数のスレッドから安全に呼べます。

### 3. 上位ビットを返す

```java:line-numbers=439
        return (int)(nextseed >>> (48 - bits));
```

`nextseed >>> (48 - bits)` で、48 ビットの種の上位 `bits` ビットを取り出します。`bits` が 32 なら、上位 32 ビットを返します。下位のビットは周期が短いため、捨てて使います。

## ここがすごい

- **わずかな計算で乱数になる**: 掛け算と足し算、マスクだけで次の種が得られます。とても速く、メモリもほとんど使いません。
- **下位ビットを捨てる理由**: 線形合同法では、下位のビットほど周期が短く、規則性が見えやすくなります。上位だけを返すことで、その弱点を避けています。
- **ロックなしで並行に動く**: CAS のループを使うので、複数のスレッドが同時に呼んでも、種が壊れません。
- **仕様として固定されている**: 乱数列が同じ種から決まる性質は、テストの再現にも使われます。定数は、ドキュメントの式にも書かれています。

## まとめ

- 乱数の種は、掛け算と足し算、48 ビットのマスクで次の値へ進む。
- CAS のループで、複数のスレッドが同時に呼んでも安全に更新する。
- 上位 `bits` ビットを返し、下位ビットの規則性を避ける。
