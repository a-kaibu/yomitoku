---
title: "黄金比で散らして、上位ビットだけを使う"
description: "Apache Kafka の BaseHashTable.findSlot。hashCode に Fibonacci 数の定数を掛け、テーブルの大きさに合わせた上位ビットを取り出して格納先を決める。"
language: java
project: Apache Kafka
repo: https://github.com/apache/kafka
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "68986c8df89a6a4786d74be7e4eabc16c7202564"
file: server-common/src/main/java/org/apache/kafka/timeline/BaseHashTable.java
lines: [209, 218]
function: "BaseHashTable.findSlot"
difficulty: 3
format: 2
tags: [ハッシュ, ビット演算, データ構造]
---

## ひとことで

`findSlot(object, numElements)` は、オブジェクトを入れる「スロット（格納場所）」の番号を決めます。Kafka の時系列データ構造 `BaseHashTable` が、要素をどの場所へ入れるかを決めるための関数です。

ハッシュ値を、そのままテーブルの大きさで割るのではなく、一度大きな定数を掛けて、上位のビットだけを使います。この方法を、乗算型の Fibonacci ハッシュと呼びます。

## コード

::: code-group

```java:line-numbers=209 [日本語訳]
    static int findSlot(Object object, int numElements) {
        // ここでは、Knuth の乗算型 Fibonacci ハッシュを使った二次のハッシュを行う
        // そのあと、上位のビットをいくつか選ぶ
        // 選ぶビット数はテーブルの大きさで決まる
        // 大きさが 2 なら 1 ビット、4 なら 2 ビット、という具合である
        int objectHashCode = object.hashCode();
        int log2size = 32 - Integer.numberOfLeadingZeros(numElements);
        int shift = 65 - log2size;
        return (int) ((objectHashCode * -7046029254386353131L) >>> shift);
    }
```

```java:line-numbers=209 [原文]
    static int findSlot(Object object, int numElements) {
        // This performs a secondary hash using Knuth's multiplicative Fibonacci
        // hashing.  Then, we choose some of the highest bits.  The number of bits
        // we choose is based on the table size.  If the size is 2, we need 1 bit;
        // if the size is 4, we need 2 bits, etc.
        int objectHashCode = object.hashCode();
        int log2size = 32 - Integer.numberOfLeadingZeros(numElements);
        int shift = 65 - log2size;
        return (int) ((objectHashCode * -7046029254386353131L) >>> shift);
    }
```

:::

## 前提知識

- **ハッシュ表のスロット**: 要素を入れる配列の位置です。ハッシュ値から番号を作り、その番号の場所に入れます。
- **`hashCode()`**: オブジェクトから作られる整数です。同じ内容のオブジェクトは、同じ値を返すように作られています。
- **テーブルの大きさは 2 のべき乗**: 2 のべき乗なら、上位ビットを取り出すだけで、範囲内の番号が得られます。
- **`long` の掛け算**: `int` のハッシュ値を `long` の定数と掛けます。上位の桁まで広がった積が得られます。
- **`>>>`（符号なし右シフト）**: 下位のビットを捨てて、上位のビットを取り出します。結果は必ず 0 以上になります。
- **Fibonacci 数（黄金比）**: 2^64 を黄金比で割った値に近い定数です。これを掛けると、連続した値がうまく散らばります。

## 何をしているか

### 1. 大きさに応じたシフト量を求める

```java:line-numbers=215
        int log2size = 32 - Integer.numberOfLeadingZeros(numElements);
        int shift = 65 - log2size;
```

`numElements` のビット数（`log2size`）を求めます。テーブルの大きさが 2^k のとき、取り出す上位ビットの数が k です。`shift = 65 - log2size` は、`64 - k` を求める式で、取り出す上位 k ビットの位置を決めます。

### 2. 定数を掛けて上位を取る

```java:line-numbers=217
        return (int) ((objectHashCode * -7046029254386353131L) >>> shift);
```

`objectHashCode * -7046029254386353131L` は、ハッシュ値に 64 ビットの定数を掛けます。`-7046029254386353131L` は、符号付きで表した `0x9E3779B97F4A7C15` です。これは 2^64 を黄金比で割った値に近い数です。その積を `>>> shift` で右へずらし、上位のビットだけを残します。

## ここがすごい

- **上位ビットは散らばりがよい**: 掛け算では、下の桁の変化が上の桁へ伝わります。その結果、上位のビットは入力のどの桁の違いにも影響されやすくなります。下位のビットだけを使うより、偏りが少なくなります。
- **剰余を使わない**: テーブルの大きさで `%` を取る代わりに、シフトを 1 回使うだけで範囲内の番号が得られます。割り算より速く動きます。
- **2 のべき乗の大きさに合う**: テーブルの大きさが 2 のべき乗なら、取り出すビット数で範囲が決まります。`numElements` から直接ビット数を計算できるのが、この関数の工夫です。
- **黄金比の定数**: 黄金比に近い定数を掛けると、連続した値が一定の間隔で散らばることが知られています。コメントにあるとおり、この乗算型 Fibonacci ハッシュを使っています。

## まとめ

- ハッシュ値に黄金比由来の 64 ビット定数を掛け、上位ビットを取り出して番号にする。
- 取り出すビット数はテーブルの大きさで決まり、シフト 1 回で範囲内の値になる。
- 剰余を使わずに、散らばりのよい格納先を決められる。
