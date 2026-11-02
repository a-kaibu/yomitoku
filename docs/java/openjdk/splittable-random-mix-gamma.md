---
title: "分割用の増分を、0 と 1 の切り替わりが多い奇数にする"
description: "Java 標準の SplittableRandom.mixGamma。乱数の分割に使う増分（gamma）を MurmurHash3 の混ぜ方で作り、奇数にしてから、ビットの切り替わりが少なければ交互のビットを XOR する。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 2013, 2024, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/SplittableRandom.java
lines: [206, 212]
function: "SplittableRandom.mixGamma"
difficulty: 3
format: 2
tags: [数値計算, ビット演算, アルゴリズム]
---

## ひとことで

`SplittableRandom` は、乱数の生成器を、別の生成器へ分けられる仕組みです。分けるときには、「次の値をどれだけ進めるか」を決める増分（gamma）が必要です。

`mixGamma` は、その増分を作ります。増分は奇数である必要があり、また、ビットの 0 と 1 の並びがよく変わる値である必要があります。このメソッドは、その両方を満たすように作ります。

## コード

::: code-group

```java:line-numbers=206 [日本語訳]
    private static long mixGamma(long z) {
        z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL; //         z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL; // MurmurHash3 の混ぜ定数
        z = (z ^ (z >>> 33)) * 0xc4ceb9fe1a85ec53L;
        z = (z ^ (z >>> 33)) | 1L;                  //         z = (z ^ (z >>> 33)) | 1L;                  // 奇数にする
        int n = Long.bitCount(z ^ (z >>> 1));       //         int n = Long.bitCount(z ^ (z >>> 1));       // 隣り合うビットが違う箇所の数を数える（十分にあるか）
        return (n < 24) ? z ^ 0xaaaaaaaaaaaaaaaaL : z;
    }
```

```java:line-numbers=206 [原文]
    private static long mixGamma(long z) {
        z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL; // MurmurHash3 mix constants
        z = (z ^ (z >>> 33)) * 0xc4ceb9fe1a85ec53L;
        z = (z ^ (z >>> 33)) | 1L;                  // force to be odd
        int n = Long.bitCount(z ^ (z >>> 1));       // ensure enough transitions
        return (n < 24) ? z ^ 0xaaaaaaaaaaaaaaaaL : z;
    }
```

:::

## 前提知識

- **gamma（増分）**: 生成器の状態を、1 回の乱数ごとに進める量です。奇数なら、2 の累乗の周期で、すべての状態を一度ずつ通ります。
- **MurmurHash3 の混ぜ方**: XOR とシフト、大きな奇数の掛け算を組み合わせて、入力の変化を全体に広げる手法です。
- **ビットの切り替わり（transition）**: 隣り合うビットが、0 と 1 で違う箇所です。`z ^ (z >>> 1)` の 1 は、その箇所を表します。
- **`Long.bitCount`**: 1 のビットの個数です。切り替わりの数を数えるのに使います。

## 何をしているか

### 1. 混ぜて、奇数にする

```java:line-numbers=207
        z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL; //         z = (z ^ (z >>> 33)) * 0xff51afd7ed558ccdL; // MurmurHash3 の混ぜ定数
        z = (z ^ (z >>> 33)) * 0xc4ceb9fe1a85ec53L;
        z = (z ^ (z >>> 33)) | 1L;                  //         z = (z ^ (z >>> 33)) | 1L;                  // 奇数にする
```

2 回の XOR シフトと掛け算で、入力の値を散らします。最後の `| 1L` で、最も下のビットを 1 にします。これで、増分は奇数になります。

### 2. 切り替わりを数える

```java:line-numbers=210
        int n = Long.bitCount(z ^ (z >>> 1));       //         int n = Long.bitCount(z ^ (z >>> 1));       // 隣り合うビットが違う箇所の数を数える（十分にあるか）
```

`z ^ (z >>> 1)` は、隣り合うビットが違う箇所だけ 1 になる値です。その 1 の数が、切り替わりの数です。

### 3. 少なければ、交互のビットを XOR する

```java:line-numbers=211
        return (n < 24) ? z ^ 0xaaaaaaaaaaaaaaaaL : z;
```

切り替わりが 24 未満なら、`0xAAAA...` と XOR します。この定数は、1 と 0 が交互に並んでいるので、XOR すると奇数の位置のビットがすべて反転します。その結果、切り替わりの数は、もとの数の `64 - n` になります。`n < 24` のとき、この値は 40 より大きくなります。

## ここがすごい

- **偏りを補正する**: 混ぜた値が、たまたま 0 と 1 が長く続く形になることがあります。その場合、切り替わりが少ない増分では、乱数の質が落ちます。この処理で、その偏りを補正します。
- **奇数を保つ**: `0xAAAA...AA` の最も下のビットは 0 です。XOR しても、最下位は 1 のまま残るので、奇数であることは保たれます。
- **切り替わりの数の関係**: 64 ビットすべてで、隣り合うビットの XOR は、`0xAAAA...AA` と `0x5555...55` を合わせると、すべて 1 になります。そのため、切り替わりは `64 - n` になります。この関係で、補正の結果が必ず十分な数になります。
- **判定は 1 回の命令**: `Long.bitCount` は、CPU の命令で 1 回に数えられます。ほぼ追加の費用なしで、増分の質を確かめられます。

## まとめ

- `mixGamma` は、乱数の増分を MurmurHash3 の混ぜ方で作り、最後に奇数にする。
- 切り替わりが 24 未満なら、交互のビットを XOR して、切り替わりを `64 - n` に増やす。
- 奇数であることと、切り替わりの多さを、どちらも保ったまま増分を決める。
