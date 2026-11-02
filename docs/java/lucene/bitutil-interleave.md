---
title: "2 つの 32 ビットを 1 本の 64 ビットに縫い合わせる"
description: "Lucene の BitUtil.interleave。偶数位置と奇数位置に 2 つの数のビットを交互に並べる Morton 符号（Z 順序）を、シフトと AND のマスクを 5 段重ねて作る。2 次元の座標を 1 つの数にまとめる仕組み。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/BitUtil.java
lines: [247, 262]
function: "BitUtil.interleave"
difficulty: 3
format: 2
tags: [ビット演算, データ構造, アルゴリズム]
---

## ひとことで

`BitUtil.interleave(even, odd)` は、2 つの 32 ビットの整数のビットを **1 つおきに並べて** 1 つの 64 ビットの数にします。`even` のビットを偶数の位置、`odd` のビットを奇数の位置に置きます。

たとえば `even = 0b11`、`odd = 0b00` なら、結果は `0b0101` です。2 次元の座標 `(x, y)` を 1 つの数にまとめると、近い座標どうしが近い数になりやすい、という性質があります（Morton 符号や Z 順序と呼ばれます）。Lucene では、地理情報などの位置を並べ替えて保存するときに使われます。

## コード

```java:line-numbers=247
  public static long interleave(int even, int odd) {
    long v1 = 0x00000000FFFFFFFFL & even;
    long v2 = 0x00000000FFFFFFFFL & odd;
    v1 = (v1 | (v1 << SHIFT4)) & MAGIC4;
    v1 = (v1 | (v1 << SHIFT3)) & MAGIC3;
    v1 = (v1 | (v1 << SHIFT2)) & MAGIC2;
    v1 = (v1 | (v1 << SHIFT1)) & MAGIC1;
    v1 = (v1 | (v1 << SHIFT0)) & MAGIC0;
    v2 = (v2 | (v2 << SHIFT4)) & MAGIC4;
    v2 = (v2 | (v2 << SHIFT3)) & MAGIC3;
    v2 = (v2 | (v2 << SHIFT2)) & MAGIC2;
    v2 = (v2 | (v2 << SHIFT1)) & MAGIC1;
    v2 = (v2 | (v2 << SHIFT0)) & MAGIC0;

    return (v2 << 1) | v1;
  }
```

このコードが使うマスクとシフト量は、同じファイルで次のように定義されています。

```java:line-numbers=227
  private static final long MAGIC0 = 0x5555555555555555L;
  private static final long MAGIC1 = 0x3333333333333333L;
  private static final long MAGIC2 = 0x0F0F0F0F0F0F0F0FL;
  private static final long MAGIC3 = 0x00FF00FF00FF00FFL;
  private static final long MAGIC4 = 0x0000FFFF0000FFFFL;
```

```java:line-numbers=236
  private static final long SHIFT0 = 1;
  private static final long SHIFT1 = 2;
  private static final long SHIFT2 = 4;
  private static final long SHIFT3 = 8;
  private static final long SHIFT4 = 16;
```

## 前提知識

- **ビットの位置**: 2 進数の桁を、右から 0, 1, 2… と数えます。偶数位置は 0, 2, 4…、奇数位置は 1, 3, 5… です。
- **マスク**: `0x5555…` は `0101…`、つまり偶数位置だけが 1 の値です。AND で、偶数位置だけを残せます。
- **`<<`（左シフト）**: ビットを左にずらし、値を 2 のべき乗倍します。
- **`|`（OR）**: どちらかが 1 なら 1 にします。ずらして重ねた値を 1 つにまとめます。
- **`& 0x00000000FFFFFFFFL`**: 下位 32 ビットだけを残します。`int` を符号付きで `long` に広げたとき、上位の 1 が混ざるのを防ぎます。

## 何をしているか

### 1. 下位 32 ビットを取り出す

```java:line-numbers=248
    long v1 = 0x00000000FFFFFFFFL & even;
    long v2 = 0x00000000FFFFFFFFL & odd;
```

`int` の値を `long` にしたとき、負の数だと上位に 1 が並んでしまいます。マスクで下位 32 ビットだけを残して、符号の影響を消します。

### 2. ビットを段階的に離す

```java:line-numbers=250
    v1 = (v1 | (v1 << SHIFT4)) & MAGIC4;
    v1 = (v1 | (v1 << SHIFT3)) & MAGIC3;
    v1 = (v1 | (v1 << SHIFT2)) & MAGIC2;
    v1 = (v1 | (v1 << SHIFT1)) & MAGIC1;
    v1 = (v1 | (v1 << SHIFT0)) & MAGIC0;
```

ここが中心です。32 ビットを、まず上下 16 ビットずつに分けて間隔を空け、次は 8 ビット、4 ビット、2 ビット、1 ビットと、細かく分けていきます。各段では、「ずらして OR を取り、マスクで必要な場所だけ残す」を行います。

最後には、もとのビットが 1 つおきの位置に散らばります。

### 3. 具体的な値で追う

`even = 0b11`（2 ビット）を考えます。

- もとのビットは位置 0 と位置 1 にあります。
- 段階的に分けていくと、位置 0 は位置 0 のまま、位置 1 は位置 2 に移ります。
- 結果は `0b0101` で、`even` のビットが偶数位置に並んでいます。

`odd` は同じ処理をしたあと、1 ビット左にずらします。そうすると、奇数位置にビットが入ります。

### 4. 2 つを合わせる

```java:line-numbers=261
    return (v2 << 1) | v1;
```

`(v2 << 1) | v1` で、`odd` を 1 ビットずらした値と `even` を OR で合わせます。偶数位置と奇数位置がぶつからないので、単純な OR で 1 つの数になります。

## ここがすごい

- **分岐もループもない**: 32 ビットの各ビットを 1 つずつ動かすと、32 回の繰り返しが必要です。この方法は、5 段のシフトとマスクだけで、全ビットを同時に動かします。
- **マスクの設計が要**: `0x5555…`、`0x3333…`、`0x0F0F…` などの定数は、各段でどのビットを残すかを決めています。段ごとに間隔が半分になるように、規則正しく作られています。
- **2 次元の近さを 1 次元で保つ**: 座標 `(x, y)` を Morton 符号にすると、近い座標の符号も近くなりやすくなります。1 つの数で並べ替えても、空間の近さが多少残るので、検索の効率が上がります。
- **正しい順序の注意**: `int` の符号の影響をマスクで消す一行は、見落としやすい部分です。この関数では、その点が最初に処理されています。

## まとめ

- 2 つの数のビットを 1 つおきに並べると、2 次元の座標を 1 つの数にまとめられる（Morton 符号）。
- ビットを段階的に離す方法は、シフトと AND のマスクだけで全ビットを同時に動かせる。
- 符号付きの値を広げるときは、上位ビットの影響をマスクで消す。
