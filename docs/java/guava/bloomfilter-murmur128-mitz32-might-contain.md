---
title: "2 つのハッシュ値から、必要な数の位置を作る"
description: "Guava のブルームフィルタの mightContain。1 回の MurmurHash3 の結果を上下 2 つの int に分け、hash1 + i × hash2 で k 個のビット位置を作る二重ハッシュ（Kirsch–Mitzenmacher）の方法。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2011 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/hash/BloomFilterStrategies.java
lines: [74, 95]
function: "BloomFilterStrategies.MURMUR128_MITZ_32.mightContain"
difficulty: 3
format: 2
tags: [ハッシュ, データ構造, 最適化]
---

## ひとことで

`mightContain` は、ブルームフィルタに値が入っている「かもしれない」かを調べます。ブルームフィルタは、大きなビット配列に、値の印を複数のビットで記録する確率的なデータ構造です。

記録もこの確認も、複数のビットの位置を求める必要があります。この関数は、1 回のハッシュ計算から、必要な数の位置を安く作る方法を使っています。

## コード

::: code-group

```java:line-numbers=74 [日本語訳]
    public <T extends @Nullable Object> boolean mightContain(
        @ParametricNullness T object,
        Funnel<? super T> funnel,
        int numHashFunctions,
        LockFreeBitArray bits) {
      long bitSize = bits.bitSize();
      long hash64 = murmur3_128().hashObject(object, funnel).asLong();
      int hash1 = (int) hash64;
      int hash2 = (int) (hash64 >>> 32);

      for (int i = 1; i <= numHashFunctions; i++) {
        int combinedHash = hash1 + (i * hash2);
        // 負の値なら全ビットを反転させる（結果は必ず 0 以上になる）
        if (combinedHash < 0) {
          combinedHash = ~combinedHash;
        }
        if (!bits.get(combinedHash % bitSize)) {
          return false;
        }
      }
      return true;
    }
```

```java:line-numbers=74 [原文]
    public <T extends @Nullable Object> boolean mightContain(
        @ParametricNullness T object,
        Funnel<? super T> funnel,
        int numHashFunctions,
        LockFreeBitArray bits) {
      long bitSize = bits.bitSize();
      long hash64 = murmur3_128().hashObject(object, funnel).asLong();
      int hash1 = (int) hash64;
      int hash2 = (int) (hash64 >>> 32);

      for (int i = 1; i <= numHashFunctions; i++) {
        int combinedHash = hash1 + (i * hash2);
        // Flip all the bits if it's negative (guaranteed positive number)
        if (combinedHash < 0) {
          combinedHash = ~combinedHash;
        }
        if (!bits.get(combinedHash % bitSize)) {
          return false;
        }
      }
      return true;
    }
```

:::

## 前提知識

- **ブルームフィルタ**: 値が「入っていない」ことは確実に分かり、「入っている」は誤りがあるかもしれない、という性質を持つ集合です。省メモリで高速に使えます。
- **ハッシュ関数 k 個**: 値ごとに、ビット配列の中の k 個の位置を決めます。位置が全部 1 なら「入っているかもしれない」、1 つでも 0 なら「入っていない」と分かります。
- **MurmurHash3（128 ビット）**: 1 回の計算で 128 ビットのハッシュ値を作ります。ここでは、その下位 64 ビットを使っています。
- **二重ハッシュ**: 2 つのハッシュ値 `hash1` と `hash2` から、`hash1 + i * hash2` の形で k 個の値を作る方法です。個別に k 回ハッシュを計算するより速く済みます。
- **`~`（ビット反転）**: すべてのビットを反転させます。負の数に使うと、0 以上の数になります。

## 何をしているか

### 1. 64 ビットのハッシュを 2 つに分ける

```java:line-numbers=79
      long bitSize = bits.bitSize();
      long hash64 = murmur3_128().hashObject(object, funnel).asLong();
      int hash1 = (int) hash64;
      int hash2 = (int) (hash64 >>> 32);
```

まず、ビット配列の大きさを取り、128 ビットのハッシュ値の下位 64 ビットを作ります。その上位 32 ビットと下位 32 ビットを、それぞれ `hash2` と `hash1` にします。

### 2. 組み合わせた値を作る

```java:line-numbers=84
      for (int i = 1; i <= numHashFunctions; i++) {
        int combinedHash = hash1 + (i * hash2);
```

`i` 番目のビット位置を、`hash1 + i * hash2` で作ります。`i` を 1 から増やすだけで、別の位置が得られます。掛け算と足し算だけなので、とても軽い計算です。

### 3. 負の値を正にして割る

```java:line-numbers=86
        // 負の値なら全ビットを反転させる（結果は必ず 0 以上になる）
        if (combinedHash < 0) {
          combinedHash = ~combinedHash;
        }
        if (!bits.get(combinedHash % bitSize)) {
```

整数の計算は溢れて負になることがあります。負のときは `~` で反転させて、0 以上の値にします。そのうえで、ビット配列の大きさで割った余りを位置として使い、その位置のビットが 0 なら、すぐに `false` を返します。

### 4. 全部 1 なら「かもしれない」

すべての位置のビットが 1 なら、`true` を返します。偽陽性（入っていないのに入っていると答える誤り）が起きることは、ブルームフィルタの性質として受け入れています。

## ここがすごい

- **1 回のハッシュで k 個の位置**: ハッシュ計算は重いので、1 回だけ行い、その 2 つの値の組み合わせで残りの位置を作ります。速さの大部分は、この工夫にあります。
- **不確かさを偽陽性だけに限る**: 0 のビットが 1 つでもあれば、確実に「入っていない」と分かります。誤るのは「入っている」と答えるときだけです。
- **負の値を捨てない**: 単に絶対値を取ると、`Integer.MIN_VALUE` の扱いが難しくなります。`~` を使えば、どの負の値も 0 以上に変えられます。
- **早く抜ける**: 0 のビットが見つかった時点で終わるので、入っていない値の確認は、少ないビットの参照で済みます。

## まとめ

- 1 回の 128 ビットハッシュを上下に分け、`hash1 + i * hash2` で k 個の位置を作る。
- 負の値は `~` で 0 以上にしてから、ビット配列の大きさで割った余りを位置にする。
- 0 のビットが 1 つでもあれば入っていないと確実に分かり、全部 1 なら入っているかもしれない。
