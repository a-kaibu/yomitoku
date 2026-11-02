---
title: "配列を 1.5 倍に広げるとき、int の溢れを最大値で止める"
description: "Java 標準の ScheduledThreadPoolExecutor の DelayedWorkQueue.grow。配列の容量を 50% 増やす計算が int で溢れたら、Integer.MAX_VALUE に頭打ちする。"
language: java
project: OpenJDK
repo: https://github.com/openjdk/jdk
license: GPL-2.0-only WITH Classpath-exception-2.0
copyright: "Copyright (c) Oracle and/or its affiliates. All rights reserved."
commit: "6c8f70f22e1621f7cd32a03150bee0f602e1a699"
file: src/java.base/share/classes/java/util/concurrent/ScheduledThreadPoolExecutor.java
lines: [990, 996]
function: "ScheduledThreadPoolExecutor.DelayedWorkQueue.grow"
difficulty: 2
format: 2
tags: [データ構造, 数値計算, 並行処理]
---

## ひとことで

`ScheduledThreadPoolExecutor` の内部には、遅延実行する作業を時刻の順に並べる、ヒープ（配列の二分木）のキューがあります。そのキューの配列が一杯になると、`grow` で大きくします。

`grow` は、今の容量の 1.5 倍を新しい容量にします。ところが、容量が非常に大きいと、1.5 倍の計算が `int` の範囲を超えてしまいます。このメソッドは、その溢れを検出して、容量を `Integer.MAX_VALUE` で止めます。

## コード

::: code-group

```java:line-numbers=990 [日本語訳]
        private void grow() {
            int oldCapacity = queue.length;
            int newCapacity = oldCapacity + (oldCapacity >> 1); // 容量を 50% 増やす
            if (newCapacity < 0) // if (newCapacity < 0) // 溢れ（int の最大値を超えて、負の数になった）
                newCapacity = Integer.MAX_VALUE;
            queue = Arrays.copyOf(queue, newCapacity);
        }
```

```java:line-numbers=990 [原文]
        private void grow() {
            int oldCapacity = queue.length;
            int newCapacity = oldCapacity + (oldCapacity >> 1); // grow 50%
            if (newCapacity < 0) // overflow
                newCapacity = Integer.MAX_VALUE;
            queue = Arrays.copyOf(queue, newCapacity);
        }
```

:::

## 前提知識

- **動的配列の成長**: 配列が一杯になったら、より大きい配列を作ってコピーする方法です。毎回 1 つずつ増やすと遅いので、1.5 倍や 2 倍に増やすのが一般的です。
- **`oldCapacity >> 1`**: 半分の値です。`oldCapacity + (oldCapacity >> 1)` で、1.5 倍になります。
- **`int` の溢れ**: `int` の最大値は約 21 億です。その値を超える計算は、負の数に折り返します。
- **`Integer.MAX_VALUE`**: `int` で表せる最大の値です。Java の配列の長さにも、この値が上限になります。
- **`Arrays.copyOf`**: 配列を、指定した長さの新しい配列にコピーします。

## 何をしているか

### 1. 容量を 1.5 倍として計算する

```java:line-numbers=991
            int oldCapacity = queue.length;
            int newCapacity = oldCapacity + (oldCapacity >> 1); // 容量を 50% 増やす
```

現在の配列の長さ `oldCapacity` に、その半分を足します。`oldCapacity` が十分に小さければ、結果は単純な 1.5 倍になります。

### 2. 溢れたら、最大値で止める

```java:line-numbers=993
            if (newCapacity < 0) // if (newCapacity < 0) // 溢れ（int の最大値を超えて、負の数になった）
                newCapacity = Integer.MAX_VALUE;
```

`oldCapacity` が約 14 億（`Integer.MAX_VALUE` の 2/3）を超えると、`oldCapacity + (oldCapacity >> 1)` は `int` の範囲を超え、負の数に折り返します。そこで `newCapacity < 0` なら、溢れたとみなして、`Integer.MAX_VALUE` にします。

### 3. 新しい配列にコピーする

```java:line-numbers=995
            queue = Arrays.copyOf(queue, newCapacity);
```

`Arrays.copyOf` で、新しい容量の配列に、今の要素をコピーします。

## ここがすごい

- **負の値で溢れを見つける**: `int` が溢れると負の数になるので、その符号を見るだけで検出できます。乗算や加算の前に、大きさを比べる必要がありません。
- **頭打ちにする**: 溢れたときに例外を投げず、取れる最大の容量にします。その後は、配列の上限に達するまで使えます。
- **1.5 倍の意味**: 2 倍よりゆるやかに増やすので、メモリの無駄が減ります。その一方で、要素を追加する回数あたりの平均のコピーは、一定の範囲に抑えられます。
- **呼び出し側の前提**: コメントにあるとおり、このメソッドはロックを持った状態で呼ばれます。並行したキューの変更と、配列の差し替えが衝突しないようにしています。

## まとめ

- `grow` は、今の容量の 1.5 倍を新しい容量にする。
- 計算結果が負になったら、`int` の溢れとみなし、`Integer.MAX_VALUE` で止める。
- 負の値で溢れを見つけるので、事前の大きさの比較は要らない。
