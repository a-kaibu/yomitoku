---
title: "割り当てサイズの番号から、ビットだけでサイズを計算する"
description: "Netty の SizeClasses.sizeIdx2sizeCompute。メモリ割り当てのサイズ区分の番号から、グループ・位置・間隔をシフトとマスクで求め、表を使わずにバイト数を計算する。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2020 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: buffer/src/main/java/io/netty/buffer/SizeClasses.java
lines: [281, 293]
function: "SizeClasses.sizeIdx2sizeCompute"
difficulty: 3
format: 2
tags: [メモリ管理, 数値計算, ビット演算]
---

## ひとことで

`sizeIdx2sizeCompute(sizeIdx)` は、メモリ割り当てのサイズ区分（サイズクラス）の番号から、そのサイズ（バイト数）を計算で求めます。Netty のバッファ管理は、要求されたサイズをいくつかの区分に丸めて、同じ大きさのメモリをまとめて管理します。

区分を表にして持つ代わりに、番号の上位と下位のビットから、サイズを計算します。この関数はその計算版で、表の値と同じ結果になるように作られています。

## コード

```java:line-numbers=281
    public int sizeIdx2sizeCompute(int sizeIdx) {
        int group = sizeIdx >> LOG2_SIZE_CLASS_GROUP;
        int mod = sizeIdx & (1 << LOG2_SIZE_CLASS_GROUP) - 1;

        int groupSize = group == 0? 0 :
                1 << LOG2_QUANTUM + LOG2_SIZE_CLASS_GROUP - 1 << group;

        int shift = group == 0? 1 : group;
        int lgDelta = shift + LOG2_QUANTUM - 1;
        int modSize = mod + 1 << lgDelta;

        return groupSize + modSize;
    }
```

## 前提知識

- **サイズクラス**: 要求されたサイズを、いくつかの決まった大きさに丸めた区分です。区分ごとに、同じ大きさのメモリをまとめて管理できます。
- **量子（quantum）**: 最小の割り当て単位です。`LOG2_QUANTUM` は、その 2 の対数です。
- **グループ**: 区分をまとめた単位です。グループが進むと、大きさの間隔が 2 倍になっていきます。
- **`LOG2_SIZE_CLASS_GROUP`**: 1 グループに含まれる区分の数の 2 の対数です。
- **`>>` と `&`**: 番号を上位（グループ）と下位（グループ内の位置）に分けるのに使います。

## 何をしているか

### 1. 番号をグループと位置に分ける

```java:line-numbers=282
        int group = sizeIdx >> LOG2_SIZE_CLASS_GROUP;
        int mod = sizeIdx & (1 << LOG2_SIZE_CLASS_GROUP) - 1;
```

`group` は番号を `LOG2_SIZE_CLASS_GROUP` ビット右へずらした値、つまりグループの番号です。`mod` は下位のビットで、グループの中の位置を表します。`(1 << LOG2_SIZE_CLASS_GROUP) - 1` のマスクで、その位置を取り出しています。

### 2. グループの基準の大きさを求める

```java:line-numbers=285
        int groupSize = group == 0? 0 :
                1 << LOG2_QUANTUM + LOG2_SIZE_CLASS_GROUP - 1 << group;
```

グループ 0 の基準は 0 です。それ以外は、`group` 回だけ 2 倍にした値になります。量子と 1 グループの個数から決まる、グループの先頭の大きさです。

### 3. 間隔を求める

```java:line-numbers=288
        int shift = group == 0? 1 : group;
        int lgDelta = shift + LOG2_QUANTUM - 1;
```

グループの番号が大きいほど、区分どうしの間隔（`lgDelta` の 2 の累乗）が大きくなります。グループ 0 は、量子と同じ間隔で並びます。

### 4. 基準と位置を足す

```java:line-numbers=290
        int modSize = mod + 1 << lgDelta;

        return groupSize + modSize;
```

位置 `mod` に 1 を足して間隔を掛けると、グループの中で何番目の大きさかが分かります。それを基準に足すと、区分のサイズが得られます。

## ここがすごい

- **表を持たずに計算できる**: 番号からサイズを計算すれば、区分ごとの値を並べた表を持つ必要がありません。
- **グループごとに間隔が 2 倍**: 大きいサイズほど、区分の間隔が広くなります。小さいサイズは細かく、大きいサイズは粗く区切るので、無駄な余りが少なくなります。
- **シフトとマスクで完結**: 番号の分解も、間隔の計算も、シフトと掛け算、マスクだけです。割り算がないので、速く計算できます。
- **表を引く版と並べて読める**: 同じクラスには表を引く版（`sizeIdx2size`）もあり、どちらも同じ区分の体系を表しています。

## まとめ

- サイズ区分の番号は、グループと位置のビットに分けて扱う。
- グループの基準に、位置と間隔を掛けた値を足して、サイズを求める。
- 表を持たずに、速くて無駄の少ないサイズ区分を計算できる。
