---
title: "8 バイトに足りない末尾を 0 で埋めて、long に詰める"
description: "Guava の LittleEndianByteArray.load64Safely。配列の残りが 8 バイト未満でも読めるように、残りのバイトだけを左へずらして OR で詰め、足りない上位は 0 のままにする。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2015 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/hash/LittleEndianByteArray.java
lines: [71, 83]
function: "LittleEndianByteArray.load64Safely"
difficulty: 2
format: 2
tags: [ビット演算, 文字列処理, 最適化]
---

## ひとことで

Guava のハッシュ関数は、バイト列を 8 バイトずつ `long` として読みながら混ぜます。普通は `getLongLittleEndian` で、8 バイトまとめて読みます。ところが、配列の末尾が 8 バイトに足りないと、その読み方では範囲外になってしまいます。

`load64Safely` は、足りない分を 0 で埋めた `long` を作ります。読めるバイトだけを 1 つずつ、正しい位置へずらして詰めます。

## コード

::: code-group

```java:line-numbers=71 [日本語訳]
  static long load64Safely(byte[] input, int offset, int length) {
    long result = 0;
    // シフトの仕方から、データが尽きたら繰り返しを止められる。
    // 残りの結果は、もともと 0 で埋まっている

    // この繰り返しは性能に重要なので、変えるときは HashBenchmark で確認すること
    int limit = min(length, 8);
    for (int i = 0; i < limit; i++) {
      // 配列を論理的に順に読みながら、値を左へずらす
      result |= (input[offset + i] & 0xFFL) << (i * 8);
    }
    return result;
  }
```

```java:line-numbers=71 [原文]
  static long load64Safely(byte[] input, int offset, int length) {
    long result = 0;
    // Due to the way we shift, we can stop iterating once we've run out of data, the rest
    // of the result already being filled with zeros.

    // This loop is critical to performance, so please check HashBenchmark if altering it.
    int limit = min(length, 8);
    for (int i = 0; i < limit; i++) {
      // Shift value left while iterating logically through the array.
      result |= (input[offset + i] & 0xFFL) << (i * 8);
    }
    return result;
  }
```

:::

## 前提知識

- **リトルエンディアン**: 数の下位のバイトを、配列の先頭に置く並びです。配列の先頭のバイトは、`long` の最も下の 8 ビットになります。
- **`& 0xFFL`**: `byte` は符号つきなので、負の値が `long` に広がることがあります。`0xFFL` で下位 8 ビットだけを取り出して、その広がりを防ぎます。
- **`<<` と `|`**: 左へずらして、OR で他のビットと組み合わせます。すでに詰めた値を壊さずに、次のバイトを置けます。
- **`min`**: 2 つの値のうち小さい方を返します。ここでは、残りの長さと 8 のうち小さい方を使います。

## 何をしているか

### 1. 読めるバイトの数を決める

```java:line-numbers=77
    int limit = min(length, 8);
```

`length` は、読んでよい残りのバイト数です。8 を超えて読むと配列の外に出るので、`min(length, 8)` で上限を決めます。

### 2. 1 バイトずつ、位置に合わせて詰める

```java:line-numbers=78
    for (int i = 0; i < limit; i++) {
      // 配列を論理的に順に読みながら、値を左へずらす
      result |= (input[offset + i] & 0xFFL) << (i * 8);
    }
```

`i` 番目のバイトを、`i * 8` ビット左へずらして `result` に OR で入れます。先頭のバイトは最も下の 8 ビット、次のバイトはその上の 8 ビットに入ります。読めないバイトは、ループの外なので、`result` の上位は 0 のまま残ります。

## ここがすごい

- **末尾を 0 で埋める仕組み**: 足りないバイトの分だけ、ループが短くなります。埋めるための配列の複製や、特別な分岐は要りません。
- **符号を気にしない**: `& 0xFFL` を付けるので、負の `byte` が上位ビットを壊しません。
- **速い読み方と並べて使う**: 配列に 8 バイト以上の余裕があるときは、速い `load64` を使います。この関数は、末尾だけを安全に読むための版です。
- **性能に敏感な箇所**: コメントにあるとおり、この繰り返しはハッシュ計算の中で重要です。変更するときは、ベンチマークで速度を確かめる前提で書かれています。

## まとめ

- `load64Safely` は、残りのバイト数と 8 の小さい方まで、1 バイトずつ `long` に詰める。
- 各バイトは、配列の先頭からの位置に応じて `i * 8` ビット左へずらす。
- 残りの上位ビットは 0 のままなので、8 バイトに満たない末尾も安全に読める。
