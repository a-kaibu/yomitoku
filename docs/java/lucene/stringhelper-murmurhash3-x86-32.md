---
title: "4 バイトずつ回転と掛け算で混ぜる MurmurHash3"
description: "Lucene が文字列やバイト列のハッシュに使う MurmurHash3（32 ビット版）。4 バイトのかたまりを回転・掛け算・XOR で混ぜ、端数と最後の仕上げ（fmix）で全ビットを行き渡らせる。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/StringHelper.java
lines: [158, 208]
function: "StringHelper.murmurhash3_x86_32"
difficulty: 3
format: 2
tags: [ハッシュ, ビット演算, 文字列処理]
---

## ひとことで

`StringHelper.murmurhash3_x86_32(data, offset, len, seed)` は、バイト列から 32 ビットのハッシュ値を作ります。Lucene は、検索インデックスの中で文字列を扱うときに、この関数を使います。名前のとおり、作者 Austin Appleby の MurmurHash3 という方式で、速さと散らばりのよさが両立していることで知られています。

`seed` は、ハッシュの初期値です。同じ `seed` と同じバイト列からは、いつも同じ値が出ます。

## コード

::: code-group

```java:line-numbers=158 [日本語訳]
  @SuppressWarnings("fallthrough")
  public static int murmurhash3_x86_32(byte[] data, int offset, int len, int seed) {

    final int c1 = 0xcc9e2d51;
    final int c2 = 0x1b873593;

    int h1 = seed;
    int roundedEnd = offset + (len & 0xfffffffc); // 4 バイトの区切りに切り捨てる

    for (int i = offset; i < roundedEnd; i += 4) {
      // リトルエンディアンの読み込み順
      int k1 = (int) BitUtil.VH_LE_INT.get(data, i);
      k1 *= c1;
      k1 = Integer.rotateLeft(k1, 15);
      k1 *= c2;

      h1 ^= k1;
      h1 = Integer.rotateLeft(h1, 13);
      h1 = h1 * 5 + 0xe6546b64;
    }

    // 末尾の端数
    int k1 = 0;

    switch (len & 0x03) {
      case 3:
        k1 = (data[roundedEnd + 2] & 0xff) << 16;
      // 次の case へ続けて処理する
      case 2:
        k1 |= (data[roundedEnd + 1] & 0xff) << 8;
      // 次の case へ続けて処理する
      case 1:
        k1 |= (data[roundedEnd] & 0xff);
        k1 *= c1;
        k1 = Integer.rotateLeft(k1, 15);
        k1 *= c2;
        h1 ^= k1;
    }

    // 最終化
    h1 ^= len;

    // fmix(h1) を展開した形（ここに直接書いてある）
    h1 ^= h1 >>> 16;
    h1 *= 0x85ebca6b;
    h1 ^= h1 >>> 13;
    h1 *= 0xc2b2ae35;
    h1 ^= h1 >>> 16;

    return h1;
  }
```

```java:line-numbers=158 [原文]
  @SuppressWarnings("fallthrough")
  public static int murmurhash3_x86_32(byte[] data, int offset, int len, int seed) {

    final int c1 = 0xcc9e2d51;
    final int c2 = 0x1b873593;

    int h1 = seed;
    int roundedEnd = offset + (len & 0xfffffffc); // round down to 4 byte block

    for (int i = offset; i < roundedEnd; i += 4) {
      // little endian load order
      int k1 = (int) BitUtil.VH_LE_INT.get(data, i);
      k1 *= c1;
      k1 = Integer.rotateLeft(k1, 15);
      k1 *= c2;

      h1 ^= k1;
      h1 = Integer.rotateLeft(h1, 13);
      h1 = h1 * 5 + 0xe6546b64;
    }

    // tail
    int k1 = 0;

    switch (len & 0x03) {
      case 3:
        k1 = (data[roundedEnd + 2] & 0xff) << 16;
      // fallthrough
      case 2:
        k1 |= (data[roundedEnd + 1] & 0xff) << 8;
      // fallthrough
      case 1:
        k1 |= (data[roundedEnd] & 0xff);
        k1 *= c1;
        k1 = Integer.rotateLeft(k1, 15);
        k1 *= c2;
        h1 ^= k1;
    }

    // finalization
    h1 ^= len;

    // fmix(h1);
    h1 ^= h1 >>> 16;
    h1 *= 0x85ebca6b;
    h1 ^= h1 >>> 13;
    h1 *= 0xc2b2ae35;
    h1 ^= h1 >>> 16;

    return h1;
  }
```

:::

## 前提知識

- **ハッシュ値**: データから作る短い数です。違うデータが同じ値になることもあるので、比較の最終確認は別に行います。
- **`Integer.rotateLeft(x, n)`**: `x` のビットを左に `n` 回回転させます。左から出たビットは右から戻ってきます。ビットを捨てないので、情報が失われません。
- **リトルエンディアン**: 4 バイトを、下位のバイトから読む並び方です。`BitUtil.VH_LE_INT` は、この順序で 4 バイトを `int` として読みます。
- **`switch` の fallthrough**: `case` に `break` がないので、次の `case` の処理も続けて実行されます。端数の処理で使われています。
- **`seed`**: 初期値を変えるための値です。同じデータでも、`seed` が違えば別のハッシュになります。

## 何をしているか

### 1. 4 バイトずつ混ぜる

```java:line-numbers=164
    int h1 = seed;
    int roundedEnd = offset + (len & 0xfffffffc); // 4 バイトの区切りに切り捨てる

    for (int i = offset; i < roundedEnd; i += 4) {
      // リトルエンディアンの読み込み順
      int k1 = (int) BitUtil.VH_LE_INT.get(data, i);
      k1 *= c1;
      k1 = Integer.rotateLeft(k1, 15);
      k1 *= c2;

      h1 ^= k1;
      h1 = Integer.rotateLeft(h1, 13);
      h1 = h1 * 5 + 0xe6546b64;
    }
```

4 バイトのかたまりごとに、`k1` を掛け算と回転で混ぜてから、`h1` に XOR で混ぜ込みます。そのあと `h1` も回転させ、`h1 * 5 + ...` で仕上げます。この繰り返しで、入力のどのバイトも、結果に影響するようになります。

### 2. 端数のバイトを処理する

```java:line-numbers=178

    // 末尾の端数
    int k1 = 0;

    switch (len & 0x03) {
      case 3:
        k1 = (data[roundedEnd + 2] & 0xff) << 16;
      // 次の case へ続けて処理する
      case 2:
        k1 |= (data[roundedEnd + 1] & 0xff) << 8;
      // 次の case へ続けて処理する
      case 1:
        k1 |= (data[roundedEnd] & 0xff);
        k1 *= c1;
        k1 = Integer.rotateLeft(k1, 15);
```

4 で割り切れない残りは、1 から 3 バイトです。`switch` が、残りの個数に応じて必要なバイトだけを `k1` に入れ、そのあと 1 回だけ混ぜ込みます。`case 3` から `case 1` へ落ちていくので、残りのバイトすべてが入ります。

### 3. 仕上げの混ぜ（fmix）

```java:line-numbers=196

    // 最終化
    h1 ^= len;

    // fmix(h1) を展開した形（ここに直接書いてある）
    h1 ^= h1 >>> 16;
    h1 *= 0x85ebca6b;
    h1 ^= h1 >>> 13;
    h1 *= 0xc2b2ae35;
    h1 ^= h1 >>> 16;

```

長さを XOR で混ぜ、最後に上位ビットと下位ビットを何度も混ぜ合わせます。このステップがあるので、入力のわずかな違いが、出力の全ビットに行き渡ります。

### 具体的な値で追う

`len = 5` のバイト列なら、`len & 0xfffffffc = 4` なので、4 バイトのかたまりが 1 つ、端数が 1 バイトです。

- 最初の 4 バイトを `k1` として混ぜ、`h1` に入れる。
- 残りの 1 バイトを `k1` に入れ、混ぜて `h1` に XOR。
- `h1 ^= 5`（長さ）で最終化し、`fmix` で仕上げる。

## ここがすごい

- **回転で情報を捨てない**: 掛け算や XOR だけだと、上位のビットが失われやすくなります。回転は、ビットを押し出さずに循環させるので、混ぜ方の質が保たれます。
- **端数の扱いを 1 か所に**: 端数の 1〜3 バイトは、`switch` の fallthrough で 1 つのかたまりにまとめて、同じ混ぜ処理を 1 回だけ通します。
- **最後の `fmix` が要**: 最終的な仕上げで、ほとんど同じ入力でも、結果のビットが大きく変わるようになります。ハッシュ表の位置を決めるとき、偏りを減らす役割を果たします。
- **エンディアンを明示**: 読み込みの順序を、リトルエンディアンに固定しています。どの CPU で動かしても、同じデータから同じハッシュ値が得られるように、設計されています。

## まとめ

- ハッシュは、4 バイトずつ回転と掛け算で混ぜ、端数を 1 回で混ぜ、最後に仕上げると、偏りのない値になる。
- 回転は情報を失わずにビットを混ぜられる。
- 読み込みの順序を固定すると、環境が違っても同じ結果になる。
