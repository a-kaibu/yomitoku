---
title: "同じハッシュの衝突を、線形探索と上位ビットの一致で絞る"
description: "Apache Lucene の BytesRefHash.findHash。ハッシュの位置が埋まっていたら 1 つずつ次の枠へ進む線形探索を行う。枠の番号に、ハッシュの上位ビットを入れておき、文字列の比較を減らす。"
language: java
project: Apache Lucene
repo: https://github.com/apache/lucene
license: Apache-2.0
copyright: "Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements."
commit: "f815e679bf6c3dbb1b27c587ed65010d7e1d8a39"
file: lucene/core/src/java/org/apache/lucene/util/BytesRefHash.java
lines: [359, 379]
function: "BytesRefHash.findHash"
difficulty: 3
format: 2
tags: [ハッシュ, データ構造, 探索]
---

## ひとことで

Lucene の `BytesRefHash` は、バイト列を重複なしに保存し、それぞれに番号（ID）を付けるハッシュ表です。同じ文字列が来たときに、既存の ID を返せるように、まず表の中を探します。

`findHash` は、そのバイト列が入るべき枠を探すメソッドです。ハッシュの位置が埋まっていたら、隣の枠へ 1 つずつ進みます。

## コード

::: code-group

```java:line-numbers=359 [日本語訳]
  private int findHash(BytesRef bytes, int hashcode) {
    assert bytesStart != null : "bytesStart is null - not initialized";
    assert hashcode == doHash(bytes.bytes, bytes.offset, bytes.length);

    int code = hashcode;
    //     // 最終的な位置
    int hashPos = code & hashMask;
    int e = ids[hashPos];
    final int highBits = hashcode & highMask;

    //     // 衝突した。線形探索で、空いている枠を探す
    //     // （LUCENE-5604 を参照）:
    while (e != -1
        && ((e & highMask) != highBits || pool.equals(bytesStart[e & hashMask], bytes) == false)) {
      code++;
      hashPos = code & hashMask;
      e = ids[hashPos];
    }

    return hashPos;
  }
```

```java:line-numbers=359 [原文]
  private int findHash(BytesRef bytes, int hashcode) {
    assert bytesStart != null : "bytesStart is null - not initialized";
    assert hashcode == doHash(bytes.bytes, bytes.offset, bytes.length);

    int code = hashcode;
    // final position
    int hashPos = code & hashMask;
    int e = ids[hashPos];
    final int highBits = hashcode & highMask;

    // Conflict; use linear probe to find an open slot
    // (see LUCENE-5604):
    while (e != -1
        && ((e & highMask) != highBits || pool.equals(bytesStart[e & hashMask], bytes) == false)) {
      code++;
      hashPos = code & hashMask;
      e = ids[hashPos];
    }

    return hashPos;
  }
```

:::

## 前提知識

- **ハッシュ表**: ハッシュ値から、表の枠の位置を決めて保存する仕組みです。同じ位置を取り合うことを衝突（collision）と呼びます。
- **線形探索（linear probing）**: 衝突したら、隣の枠へ 1 つずつ進む方法です。表の終わりに達したら、先頭へ戻ります（`& hashMask` で循環させます）。
- **`hashMask` と `highMask`**: `hashMask` は表の大きさ − 1 で、位置を取り出すのに使います。`highMask` はその反転で、ハッシュ値の上位ビットを表すのに使います。
- **ID の格納**: 枠には ID が入っています。その上位のビットには、ハッシュ値の上位ビットを入れてあります。

## 何をしているか

### 1. 最初の位置と、上位ビットを求める

```java:line-numbers=363
    int code = hashcode;
    //     // 最終的な位置
    int hashPos = code & hashMask;
    int e = ids[hashPos];
    final int highBits = hashcode & highMask;
```

`hashPos = code & hashMask` で、ハッシュの下位のビットから、最初の枠の位置を決めます。`highBits = hashcode & highMask` は、ハッシュ値の上位のビットです。

### 2. 衝突したら、次の枠へ進む

```java:line-numbers=371
    while (e != -1
        && ((e & highMask) != highBits || pool.equals(bytesStart[e & hashMask], bytes) == false)) {
      code++;
      hashPos = code & hashMask;
      e = ids[hashPos];
    }

```

`e` は枠の中の値です。`e == -1` は枠が空いていることを表します。値があっても、上位のビットが違うなら、そのバイト列は別物です。上位のビットが同じときだけ、`pool.equals` で中身を比べます。

違えば `code++` で 1 つ先の枠へ進み、同じ確認を繰り返します。見つかった枠、または空いている枠の位置を返します。

## ここがすごい

- **比較を減らす**: 枠にハッシュの上位ビットを入れておくので、中身を読んで比べる前に、大半の不一致を取り除けます。文字列の比較は、高い費用がかかるので、この工夫が効きます。
- **線形探索は局所的**: 隣の枠を順に見るので、メモリの同じ場所を読み続けられます。飛び飛びに探すより、キャッシュに乗りやすいです。
- **循環する**: `code & hashMask` で、表の終わりの後は先頭へ戻ります。表の大きさを超えても、位置が範囲の外に出ません。
- **空きか一致かで止まる**: 空いている枠（`-1`）と、同じバイト列の枠のどちらかで止まります。どちらも、呼び出し側が次に何をすべきか分かる位置です。

## まとめ

- `findHash` は、ハッシュの下位のビットで位置を決め、衝突したら隣の枠へ進む。
- 枠の値の上位ビットを先に比べ、一致したときだけバイト列の中身を比べる。
- 循環する線形探索で、空いている枠か、同じバイト列の枠を見つける。
