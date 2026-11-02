---
title: "乱数の状態を、2 回の掛け算で混ぜて int の乱数にする"
description: "Java 標準の ThreadLocalRandom.mix32。64 ビットの状態を、XOR、シフト、掛け算で混ぜ、上位 32 ビットだけを int として返す。MurmurHash3 の仕上げと近い形。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/ThreadLocalRandom.java
lines: [133, 136]
function: "ThreadLocalRandom.mix32"
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 並行処理]
---

## ひとことで

`ThreadLocalRandom` は、スレッドごとに乱数の状態（シード）を持つ乱数生成器です。状態は、乱数を取り出すたびに一定の値だけ増えていきます。増えるだけの値は、そのまま使うと偏りが見えやすいので、乱数の値にする前に混ぜます。

`mix32` は、その状態を混ぜて、32 ビットの乱数（`int`）にするメソッドです。

## コード

```java:line-numbers=133
    private static int mix32(long z) {
        z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL;
        return (int)(((z ^ (z >>> 33)) * 0xc4ceb9fe1a85ec53L) >>> 32);
    }
```

## 前提知識

- **シード（状態）**: 乱数の並びを決める、内部の 64 ビットの値です。次の乱数を作るたびに、この値を更新します。
- **XOR と右シフト**: 上の方のビットを、右へずらして下のビットに XOR で混ぜます。上の変化が下へ届きます。
- **掛け算**: 下のビットの変化を、上のビットへ広げます。乗算は、上位のビットに影響を与えるのに使われます。
- **上位 32 ビット**: `long` の上の 32 ビットです。`>>> 32` で、その値を下へ移してから、`int` にします。

## 何をしているか

### 1. 上のビットを下へ混ぜ、定数を掛ける

```java:line-numbers=134
        z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL;
```

`z ^ (z >>> 33)` で、上の 31 ビットの変化を下へ混ぜます。そのあと定数を掛けて、下の変化を上へ広げます。

### 2. もう一度混ぜ、上位 32 ビットを返す

```java:line-numbers=135
        return (int)(((z ^ (z >>> 33)) * 0xc4ceb9fe1a85ec53L) >>> 32);
```

同じ形の混ぜ方を、もう一度行います。最後に `>>> 32` で上位 32 ビットを取り出し、`(int)` で `int` にして返します。

## ここがすごい

- **定数は MurmurHash3 系**: `0xff51afd7ed558ccd` と `0xc4ceb9fe1a85ec53` は、MurmurHash3 の 64 ビットの仕上げ（fmix64）で使われる定数と同じです。コメントには、このクラスの補助的なメソッドの多くが `SplittableRandom` と同じ実装だと書かれています。
- **最後の XOR を省く**: fmix64 の仕上げは、もう一度 `z ^ (z >>> 33)` を行います。この `mix32` は、それを省いて、上位 32 ビットを直接返します。計算が 1 段短くなります。
- **下位ビットを捨てる**: 下位 32 ビットは捨てています。上位 32 ビットは、2 回目の掛け算の結果なので、そこまでの混ぜ方の効果を受けています。
- **状態を受け取るだけ**: この関数は、引数の値を混ぜて返すだけです。状態を進める処理は、この関数の中にはありません。

## まとめ

- `mix32` は、64 ビットの状態を、XOR、シフト、掛け算の 2 回の混ぜ方で散らす。
- 最後に上位 32 ビットを取り出し、`int` の乱数として返す。
- 定数と形は MurmurHash3 の仕上げに近く、最後の XOR だけを省いている。
