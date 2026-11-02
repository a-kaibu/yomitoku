---
title: "メモリ使用量の見積もりを、次の整列位置へ切り上げる"
description: "Apache Lucene の RamUsageEstimator.alignObjectSize。オブジェクトのバイト数を JVM の整列単位の倍数へ切り上げる。余りを引く形で、ビット演算を使わずに書いている。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/RamUsageEstimator.java
lines: [166, 169]
function: "RamUsageEstimator.alignObjectSize"
difficulty: 1
format: 2
tags: [数値計算, 低レイヤ]
---

## ひとことで

Java のオブジェクトは、メモリの上で決まった単位（整列単位）にそろえて置かれます。たとえば 8 バイトの単位なら、オブジェクトのサイズは 8 の倍数として確保されます。

Lucene の `RamUsageEstimator` は、オブジェクトが使うメモリ量を見積もるクラスです。`alignObjectSize` は、見積もったサイズを、整列単位の次の倍数へ切り上げます。

## コード

```java:line-numbers=166
  public static long alignObjectSize(long size) {
    size += (long) NUM_BYTES_OBJECT_ALIGNMENT - 1L;
    return size - (size % NUM_BYTES_OBJECT_ALIGNMENT);
  }
```

## 前提知識

- **整列（alignment）**: メモリのアドレスやサイズを、決まった単位の倍数にそろえることです。CPU は、そろった位置から読むほうが速いので、JVM はこの単位でオブジェクトを置きます。
- **切り上げ**: 割り切れない値を、次の倍数まで増やすことです。`13` を `8` の倍数にすると `16` になります。
- **`%`（剰余）**: 割ったときの余りを求めます。`size % 8` は、8 で割った余りです。

## 何をしているか

### 1. 単位の数から 1 を引いて足す

```java:line-numbers=167
    size += (long) NUM_BYTES_OBJECT_ALIGNMENT - 1L;
```

`size` に `NUM_BYTES_OBJECT_ALIGNMENT - 1` を足します。これは、余りが 0 でないときに、次の倍数を超えるようにするための準備です。

### 2. 余りを引いて、倍数にそろえる

```java:line-numbers=168
    return size - (size % NUM_BYTES_OBJECT_ALIGNMENT);
```

`size % NUM_BYTES_OBJECT_ALIGNMENT` は、倍数からはみ出した分です。それを引くと、単位の倍数になります。

## ここがすごい

- **例で確かめられる**: 単位を 8 とすると、`size = 13` は `13 + 7 = 20` になり、余り 4 を引いて `16` になります。`size = 16` は `23` から余り 7 を引いて `16` に戻るので、すでに倍数の値は変わりません。
- **1 行で切り上げ**: 除算の結果を使う書き方より、剰余と減算だけで意味が追いやすくなっています。
- **単位が 2 の累乗でなくても使える**: 式は `%` を使うので、単位が 2 の累乗でなくても正しく切り上げられます。
- **見積もりの精度**: メモリの見積もりは、実際の配置に近い値を目指します。この関数で、その誤差を小さくしています。

## まとめ

- `alignObjectSize` は、サイズを整列単位の次の倍数へ切り上げる。
- 単位から 1 を引いて足し、剰余を引くと、倍数にそろう。
- 余りが 0 のときは値が変わらないので、倍数の値は正しく保たれる。
