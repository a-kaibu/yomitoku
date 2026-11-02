---
title: "マスクで選んだビットを、右側へ詰め直す"
description: "Java 19 で追加された Integer.compress。マスクで選ばれたビットを順番を保ったまま右へ寄せる。5 回の並列プレフィックスの計算で、ループを減らして行う Hacker's Delight の手法。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) 1994, 2026, Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/lang/Integer.java
lines: [1791, 1813]
function: "Integer.compress"
difficulty: 3
format: 2
tags: [ビット演算, アルゴリズム, ハック]
---

## ひとことで

`Integer.compress(i, mask)` は、`i` のビットのうち、`mask` で 1 になっている位置のビットだけを取り出し、順番を保ったまま右の端へ詰めて返します。たとえば、マスクが選んだ 2 か所のビットを、下から 0 番目と 1 番目へ寄せるような働きです。

Java 19 で追加された比較的新しい API です。コードを見ると、ループの回数は 5 回だけで、ビット単位の操作をまとめて行っています。

## コード

::: code-group

```java:line-numbers=1791 [日本語訳]
    public static int compress(int i, int mask) {
        // Hacker's Delight（第 2 版）の 7.4 節「Compress」、または Generalized Extract を参照

        i = i & mask; // 不要なビットを消す
        int maskCount = ~mask << 1; // 右側にある 0 を数える

        for (int j = 0; j < 5; j++) {
            // 並列プレフィックス（部分和の並列計算）
            // マスクのプレフィックスは、右側に奇数個の 0 があるマスクのビットを示す
            int maskPrefix = parallelSuffix(maskCount);
            // 移動するビット
            int maskMove = maskPrefix & mask;
            // マスクを詰める
            mask = (mask ^ maskMove) | (maskMove >>> (1 << j));
            // 移動する i のビット
            int t = i & maskMove;
            // i を詰める
            i = (i ^ t) | (t >>> (1 << j));
            // 右側に 0 があるビットを数えて、マスクの数を調整する
            maskCount = maskCount & ~maskPrefix;
        }
        return i;
    }
```

```java:line-numbers=1791 [原文]
    public static int compress(int i, int mask) {
        // See Hacker's Delight (2nd ed) section 7.4 Compress, or Generalized Extract

        i = i & mask; // Clear irrelevant bits
        int maskCount = ~mask << 1; // Count 0's to right

        for (int j = 0; j < 5; j++) {
            // Parallel prefix
            // Mask prefix identifies bits of the mask that have an odd number of 0's to the right
            int maskPrefix = parallelSuffix(maskCount);
            // Bits to move
            int maskMove = maskPrefix & mask;
            // Compress mask
            mask = (mask ^ maskMove) | (maskMove >>> (1 << j));
            // Bits of i to be moved
            int t = i & maskMove;
            // Compress i
            i = (i ^ t) | (t >>> (1 << j));
            // Adjust the mask count by identifying bits that have 0 to the right
            maskCount = maskCount & ~maskPrefix;
        }
        return i;
    }
```

:::

このメソッドは、`parallelSuffix` という小さな補助メソッドを使っています。その定義は、同じクラスで次のとおりです。

```java:line-numbers=1931
    @ForceInline
    private static int parallelSuffix(int maskCount) {
        int maskPrefix = maskCount ^ (maskCount << 1);
        maskPrefix = maskPrefix ^ (maskPrefix << 2);
        maskPrefix = maskPrefix ^ (maskPrefix << 4);
        maskPrefix = maskPrefix ^ (maskPrefix << 8);
        maskPrefix = maskPrefix ^ (maskPrefix << 16);
        return maskPrefix;
    }
```

## 前提知識

- **マスク**: 使いたい位置だけを 1 にした値です。ここでは、どのビットを取り出すかを決めます。
- **並列プレフィックス**: 複数の桁の情報を、一度に何段かの計算で集める手法です。ここでは「右側にある 0 の個数の偶奇」を、5 段の XOR で求めています。
- **`~`（ビット反転）と `<<`（左シフト）**: 反転したり、ずらしたりする基本の演算です。
- **`parallelSuffix`**: 上の段の値を、少しずつずらして XOR していく補助メソッドです。桁の偶奇を広げる役目を持ちます。
- **`@IntrinsicCandidate`**: JIT コンパイラが、この関数を専用の CPU 命令で置き換えてよいことを示す注釈です。

## 何をしているか

### 1. 不要なビットを消す

```java:line-numbers=1794
        i = i & mask; // 不要なビットを消す
        int maskCount = ~mask << 1; // 右側にある 0 を数える
```

`i = i & mask` で、マスクに含まれないビットを 0 にします。`maskCount` は、マスクの各桁の右側に 0 が何個あるかを数えるための値です。

### 2. 5 回の段で少しずつ詰める

```java:line-numbers=1797
        for (int j = 0; j < 5; j++) {
            // 並列プレフィックス（部分和の並列計算）
            // マスクのプレフィックスは、右側に奇数個の 0 があるマスクのビットを示す
            int maskPrefix = parallelSuffix(maskCount);
```

`j` は 0 から 4 までの 5 回のループです。移動量 `1 << j` は、1、2、4、8、16 と倍々に増えます。段ごとに、詰めるべきビットを並列に求めます。

### 3. マスクと値を一緒に詰める

```java:line-numbers=1801
            // 移動するビット
            int maskMove = maskPrefix & mask;
            // マスクを詰める
            mask = (mask ^ maskMove) | (maskMove >>> (1 << j));
            // 移動する i のビット
            int t = i & maskMove;
            // i を詰める
            i = (i ^ t) | (t >>> (1 << j));
```

その段で動かすビット（`maskMove`）を決めます。マスクは、そのビットの分だけ右へ寄せて詰め直します。同じ動きを `i` にも適用して、対応するビットを一緒に寄せます。

### 4. 数え直して次の段へ

```java:line-numbers=1809
            // 右側に 0 があるビットを数えて、マスクの数を調整する
            maskCount = maskCount & ~maskPrefix;
```

右側の 0 の数を、今回動かした分だけ減らします。次の段では、より大きな移動量で同じ処理を続けます。最後の段が終わると、`i` の選ばれたビットが右端に詰まっています。

## ここがすごい

- **ループが 5 回だけ**: ビットを 1 つずつ数えて移動すると、32 回の繰り返しが必要です。ここでは移動量を 2 倍ずつ増やしながら、5 回で全ビットを詰めています。
- **並列に求める**: `parallelSuffix` は、右側の 0 の偶奇を、シフトと XOR を 5 回重ねるだけで全桁ぶん一度に求めます。
- **マスクも一緒に動かす**: `mask` 自体も詰め直すことで、次の段で必要な情報が正しく残ります。マスクと値を並べて更新する点が、この関数の要です。
- **CPU の命令に置き換え可能**: `@IntrinsicCandidate` があるので、対応した CPU では専用の命令で、この処理を一度に行えます。Java のコードは、その動きを表す参照実装として読めます。

## まとめ

- `compress` は、マスクで選んだビットを、順番を保ったまま右へ詰める。
- 移動量を 1、2、4、8、16 と増やした 5 段の処理で、全ビットを詰める。
- マスク自体も同時に詰め直すので、段ごとの動きが正しく続く。
