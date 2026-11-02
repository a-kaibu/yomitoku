---
title: "同じ区間にまとめる値の幅を、2 の累乗で求める"
description: "HdrHistogram の sizeOfEquivalentValueRange。値のバケット番号から、同じ数として数える値の幅を 1 ビットのシフトで求める。ヒストグラムの精度を決める仕組みの核心。"
language: java
project: HdrHistogram
repo: https://github.com/HdrHistogram/HdrHistogram
license: CC0-1.0
copyright: "Written by Gil Tene of Azul Systems, and released to the public domain, as explained at http://creativecommons.org/publicdomain/zero/1.0/"
commit: "de84b0a7de2378abfc405da503bf4898e84ea98e"
file: src/main/java/org/HdrHistogram/AbstractHistogram.java
lines: [1174, 1178]
function: "AbstractHistogram.sizeOfEquivalentValueRange"
difficulty: 2
format: 2
tags: [数値計算, データ構造, ビット演算]
---

## ひとことで

HdrHistogram は、遅延などの値を、精度を保ちながら少ない箱に数えるヒストグラムです。小さい値はそのまま数え、大きい値ほど「この範囲の値は同じとみなす」という区間を広げます。

`sizeOfEquivalentValueRange(value)` は、ある値が属する区間の幅を返すメソッドです。その幅は必ず 2 の累乗になるので、シフトだけで計算できます。

## コード

```java:line-numbers=1174
    public long sizeOfEquivalentValueRange(final long value) {
        final int bucketIndex = getBucketIndex(value);
        long distanceToNextValue = 1L << (unitMagnitude + bucketIndex);
        return distanceToNextValue;
    }
```

## 前提知識

- **バケット（bucket）**: 値の大きさに応じた区間の番号です。`getBucketIndex` で求めます。バケットが 1 つ上がると、区間の幅がおよそ 2 倍になります。
- **`unitMagnitude`**: 最も細かい単位を、2 の何乗で表すかを示す値です。たとえば 1 なら、最小の単位は 2 の 1 乗、つまり 2 です。
- **`1L << n`**: 1 を `n` ビット左へずらした値で、2 の `n` 乗を意味します。
- **同値（equivalent）**: 記録のときに同じ箱に入る値の集まりです。HdrHistogram では、同じ区間の値は同じ数として数えられます。

## 何をしているか

### 1. 値からバケット番号を求める

```java:line-numbers=1175
        final int bucketIndex = getBucketIndex(value);
```

`getBucketIndex(value)` は、その値がどのバケットに入るかを返します。値が大きいほど、バケット番号も大きくなります。この番号は、区間の幅の指数部分を決めます。

### 2. 区間の幅を 2 の累乗で求める

```java:line-numbers=1176
        long distanceToNextValue = 1L << (unitMagnitude + bucketIndex);
```

`unitMagnitude + bucketIndex` が、区間の幅の指数です。`1L << (...)` で、その 2 の累乗を作ります。`unitMagnitude` は最小の単位を表すので、それを足すことで、どの単位から数え始めるかも反映されます。

### 3. この幅で最小の値を求める

```java:line-numbers=1188
    public long lowestEquivalentValue(final long value) {
        final int bucketIndex = getBucketIndex(value);
        final int subBucketIndex = getSubBucketIndex(value, bucketIndex);
        long thisValueBaseLevel = valueFromIndex(bucketIndex, subBucketIndex);
        return thisValueBaseLevel;
```

`lowestEquivalentValue` は、同じ区間の最も小さい値を返します。ここで求めた値に、区間の幅を足すと、次の区間の始まりになります。

```java:line-numbers=1227
    public long nextNonEquivalentValue(final long value) {
        return lowestEquivalentValue(value) + sizeOfEquivalentValueRange(value);
    }
```

`nextNonEquivalentValue` は、その次の区間の始まりを返します。幅がシフトで求まっているので、この計算も足し算 1 回で済みます。

## ここがすごい

- **幅が 2 の累乗なので、シフトで済む**: 区間の幅を割り算や表の検索で求める必要がありません。ビット数だけで決まります。
- **精度の設定が、そのまま区間の幅になる**: 有効桁数に応じて、バケットの中の細かさが決まり、その結果、区間の幅も決まります。
- **値の大きさに対して誤差の割合が一定**: 大きい値ほど幅が広がるので、誤差の割合が、値の大きさによらずおおよそ一定に保たれます。
- **メソッドの組み合わせで単純になる**: 区間の幅を 1 か所で求め、他のメソッドはそれを使うだけです。

## まとめ

- `sizeOfEquivalentValueRange` は、バケット番号と `unitMagnitude` を足した指数で、2 の累乗の幅を返す。
- 最小の値や次の区間の始まりは、この幅を使った足し算で求まる。
- 幅が 2 の累乗なので、計算はシフトと足し算だけで済む。
