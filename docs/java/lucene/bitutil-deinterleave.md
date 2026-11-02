---
title: "交互に並んだビットから、偶数の位置だけを詰めて取り出す"
description: "Lucene の BitUtil.deinterleave。奇数と偶数の位置が混ざった 64 ビットから、偶数の位置のビットだけを集め、マスクとシフトを 5 段階に分けて下位 32 ビットへ詰める。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/BitUtil.java
lines: [265, 273]
function: "BitUtil.deinterleave"
difficulty: 3
format: 2
tags: [ビット演算, データ構造, 低レイヤ]
---

## ひとことで

2 つの 32 ビットの数を、ビットごとに交互に並べると、1 つの 64 ビットの数になります。この並べ方を Z 順序（Morton 符号）と呼ぶことがあります。空間の座標を 1 つの数にまとめるときなどに使われます。

`deinterleave` は、その逆をします。64 ビットの数から、偶数の位置にあるビットだけを取り出し、続けて詰めて、下位 32 ビットの数にします。

## コード

```java:line-numbers=265
  public static long deinterleave(long b) {
    b &= MAGIC0;
    b = (b ^ (b >>> SHIFT0)) & MAGIC1;
    b = (b ^ (b >>> SHIFT1)) & MAGIC2;
    b = (b ^ (b >>> SHIFT2)) & MAGIC3;
    b = (b ^ (b >>> SHIFT3)) & MAGIC4;
    b = (b ^ (b >>> SHIFT4)) & MAGIC5;
    return b;
  }
```

## 前提知識

- **偶数の位置**: 最も下のビットを 0 番目と数えたとき、0、2、4、... 番目のビットです。`0x5555...` は、偶数の位置のビットが 1 のマスクです。
- **マスク**: 必要なビットだけを残す数です。この関数では、段階ごとに異なるマスクを使います。
- **`MAGIC0` から `MAGIC5`**: 段階ごとのマスクです。`0x3333...`、`0x0F0F...`、`0x00FF...`、`0x0000FFFF...`、`0xFFFFFFFF` の順に、まとまりの幅を倍にしていきます。
- **`SHIFT0` から `SHIFT4`**: 段階ごとのシフト量です。1、2、4、8、16 の順になっています。

## 何をしているか

### 1. 偶数の位置だけを残す

```java:line-numbers=266
    b &= MAGIC0;
```

最初に、奇数の位置のビットを 0 にします。残るのは、偶数の位置のビットだけです。

### 2. 隣へ寄せながら、まとまりを倍にしていく

```java:line-numbers=267
    b = (b ^ (b >>> SHIFT0)) & MAGIC1;
    b = (b ^ (b >>> SHIFT1)) & MAGIC2;
    b = (b ^ (b >>> SHIFT2)) & MAGIC3;
    b = (b ^ (b >>> SHIFT3)) & MAGIC4;
    b = (b ^ (b >>> SHIFT4)) & MAGIC5;
```

5 段階の処理は、同じ形をしています。まず `b >>> SHIFT` で、ビットを右へずらして、隣の位置へ寄せます。`b ^ (b >>> SHIFT)` は、寄せたビットと元のビットを重ねます。その段階で使うマスクで、必要なビットだけを残します。

段階を追うごとに、残るまとまりの幅は 2 倍になります。偶数の位置のビットが、2 ビット、4 ビット、8 ビット、16 ビット、32 ビットのまとまりで、順に下へ寄せられます。最後の段階の後には、偶数の位置のビットが、下位 32 ビットに詰まっています。

## ここがすごい

- **分岐がない**: 5 段階の処理はすべて、同じ形のシフト、XOR、マスクです。ループも分岐もなく、一定の回数で終わります。
- **XOR を使える理由**: 最初の段階では、奇数の位置を 0 にしてあるので、シフトしたビットと元のビットは重ならず、XOR と OR は同じ結果になります。
- **`interleave` の逆**: この関数は、Lucene の `interleave` の逆の処理です。偶数側の数を取り出します。奇数側の数が欲しいときは、先に `b >>> 1` でずらしてから、同じ関数を使えます。
- **段階の式がそろっている**: シフトとマスクの組が同じ形の式として並んでいるので、どの段階が何をしているかが読み取りやすくなっています。

## まとめ

- `deinterleave` は、偶数の位置のビットだけを残し、5 段階のシフトと XOR、マスクで下位 32 ビットに詰める。
- 段階ごとに、まとまりの幅が 2、4、8、16、32 ビットと倍になり、最後に 1 つの数になる。
- 分岐がないので、ビットを並べ替える処理として、一定の時間で動く。
