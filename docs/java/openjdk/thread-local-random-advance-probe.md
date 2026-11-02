---
title: "XOR と左右のシフトで次の値へ進める乱数"
description: "Java 標準の ThreadLocalRandom.advanceProbe。3 回のシフトと XOR だけで 32 ビットの値を次の値へ進める xorshift 方式の乱数生成。乱数の状態を保存する部分にも注目する。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/ThreadLocalRandom.java
lines: [267, 273]
function: "ThreadLocalRandom.advanceProbe"
difficulty: 2
format: 2
tags: [乱数, ビット演算, 並行処理]
---

## ひとことで

`ThreadLocalRandom.advanceProbe(probe)` は、32 ビットの整数を次の値へ進めます。ここでの値は「どのスロットを使うか」を散らすための探査値です。乱数のように見える値を、わずか 3 回のシフトと XOR だけで作ります。

`ThreadLocalRandom` は、スレッドごとに独立した乱数の状態を持つ仕組みです。同じ乱数の状態を複数のスレッドが奪い合わないように、この関数が使われます。

## コード

::: code-group

```java:line-numbers=267 [日本語訳]
    static final int advanceProbe(int probe) {
        probe ^= probe << 13;   // xorshift（ビットを左右にずらして XOR する乱数の方式）
        probe ^= probe >>> 17;
        probe ^= probe << 5;
        U.putInt(JLA.currentCarrierThread(), PROBE, probe);
        return probe;
    }
```

```java:line-numbers=267 [原文]
    static final int advanceProbe(int probe) {
        probe ^= probe << 13;   // xorshift
        probe ^= probe >>> 17;
        probe ^= probe << 5;
        U.putInt(JLA.currentCarrierThread(), PROBE, probe);
        return probe;
    }
```

:::

## 前提知識

- **乱数生成器**: 前の値から次の値を計算する仕組みです。同じ開始値からは、同じ列が生まれます。
- **xorshift**: ビットを左右にずらしてから XOR を取る、とても速い乱数の方式です。掛け算を使わず、シフトと XOR だけで書けます。
- **`<<`（左シフト）と `>>>`（符号なし右シフト）**: ビットを左または右へ動かします。ビットの位置を入れ替えて、値を混ぜるために使われます。
- **`^=`（XOR の代入）**: 右側の値と XOR した結果を、同じ変数に入れ直します。
- **状態の保存**: 乱数の次の値は、前の値に依存します。そのため、次の値を計算したら、その結果を保存しておく必要があります。

## 何をしているか

### 1. 左へずらして XOR する

```java:line-numbers=268
        probe ^= probe << 13;   // xorshift（ビットを左右にずらして XOR する乱数の方式）
```

最初に、値を 13 ビット左へずらして、元の値と XOR します。上の桁の変化が、下の桁に混ざり込みます。

### 2. 右へずらして XOR する

```java:line-numbers=269
        probe ^= probe >>> 17;
```

次は、17 ビット右へずらして XOR します。今度は下の桁の変化が上へ伝わります。左右の往復で、ビット全体が混ざっていきます。

### 3. もう一度左へずらす

```java:line-numbers=270
        probe ^= probe << 5;
```

最後に 5 ビット左へずらして XOR します。3 つのシフト量（13、17、5）を組み合わせることで、32 ビットのすべての値を、一周して元に戻ることなく順に巡るように作られています。

### 4. 結果を保存する

```java:line-numbers=271
        U.putInt(JLA.currentCarrierThread(), PROBE, probe);
        return probe;
```

計算した新しい値を、現在のスレッドに保存して返します。次に呼ばれたときは、この保存された値から続きを計算します。

## ここがすごい

- **掛け算がない**: 乱数の生成は、普通は掛け算や剰余を多く使います。xorshift は、シフトと XOR だけで書けるので、とても速く動きます。
- **シフト量の組み合わせ**: 13、17、5 という数は、32 ビット全体を一周して値を巡るように選ばれた組み合わせです。どのような開始値でも、0 にならなければ、すべての非 0 の値を順に通ります。
- **スレッドごとの状態**: 乱数の状態をスレッドごとに持つので、複数のスレッドが同じ変数を取り合いません。ロックを使わずに、並行して乱数を作れます。
- **散らばりを使う**: `ThreadLocalRandom` 以外の場所でも、この種の乱数は、ハッシュ表の探査など、値を散らしたい場面で使われます。

## まとめ

- xorshift は、3 回のシフトと XOR で 32 ビットの値を次へ進める。
- シフト量を 13、17、5 とすることで、値が偏らずに巡るように作られている。
- 状態をスレッドごとに保存するので、ロックなしで乱数を作れる。
