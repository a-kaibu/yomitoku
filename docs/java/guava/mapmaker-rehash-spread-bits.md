---
title: "ハッシュ値の下位ビットに偏りがあっても、シフトと加算で散らす"
description: "Guava の MapMakerInternalMap.rehash。ハッシュ値を、シフト、XOR、加算を交互に使って混ぜ、表の添字に使うビットを全体へ行き渡らせる。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2009 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/collect/MapMakerInternalMap.java
lines: [1084, 1094]
function: "MapMakerInternalMap.rehash"
difficulty: 2
format: 2
tags: [ハッシュ, ビット演算, データ構造]
---

## ひとことで

Guava の `MapMakerInternalMap` は、`ConcurrentMap` を作る内部の表です。キーのハッシュ値から、どのセグメント（区画）と、どの添字に入れるかを決めます。

ハッシュ値の下位のビットだけで添字を決める場合、元の `hashCode` の偏りがそのまま表の偏りになります。`rehash` は、添字に使うビットへ、他のすべてのビットの影響を届かせるために、ハッシュ値を混ぜ直します。

## コード

::: code-group

```java:line-numbers=1084 [日本語訳]
  static int rehash(int h) {
    // セグメントと添字の両方の位置を散らすために、ビットを広げる
    // 1 語で済む、Wang／Jenkins のハッシュの変形を使う
    // TODO（kevinb）: Hashing に移すか、検討する
    h += (h << 15) ^ 0xffffcd7d;
    h ^= h >>> 10;
    h += h << 3;
    h ^= h >>> 6;
    h += (h << 2) + (h << 14);
    return h ^ (h >>> 16);
  }
```

```java:line-numbers=1084 [原文]
  static int rehash(int h) {
    // Spread bits to regularize both segment and index locations,
    // using variant of single-word Wang/Jenkins hash.
    // TODO(kevinb): use Hashing/move this to Hashing?
    h += (h << 15) ^ 0xffffcd7d;
    h ^= h >>> 10;
    h += h << 3;
    h ^= h >>> 6;
    h += (h << 2) + (h << 14);
    return h ^ (h >>> 16);
  }
```

:::

## 前提知識

- **`hashCode`**: オブジェクトから作られる整数の値です。キーの作り方によっては、下位のビットに偏りが出ます。
- **XOR（`^`）と右シフト（`>>>`）**: XOR は、ビットの違いを残す演算です。右シフトで上のビットを下へ移し、XOR で下のビットに混ぜ込みます。
- **加算とシフト**: `h += h << 3` は、`h` を 9 倍することと同じです。シフトと加算で、掛け算に近い効果を作ります。
- **Wang／Jenkins のハッシュ**: 整数を、シフト、XOR、加算で混ぜる関数の一族です。コメントには、この変形を使うと書かれています。

## 何をしているか

### 1. 上のビットを、XOR とシフトで下へ混ぜる

```java:line-numbers=1088
    h += (h << 15) ^ 0xffffcd7d;
    h ^= h >>> 10;
    h += h << 3;
    h ^= h >>> 6;
```

まず `h += (h << 15) ^ 0xffffcd7d` で、上の方のビットを、定数と混ぜながら加えます。次の `h ^= h >>> 10` で、上の 10 ビットを下へ移して XOR します。`h += h << 3` と `h ^= h >>> 6` も、同じ方法で上と下のビットを交互に混ぜます。

### 2. 加算で、ビットを上へ広げる

```java:line-numbers=1092
    h += (h << 2) + (h << 14);
    return h ^ (h >>> 16);
```

`h += (h << 2) + (h << 14)` は、`h` を 16389 倍することと同じです。下のビットの変化を、上のビットへ大きく広げます。最後の `h ^ (h >>> 16)` で、上の 16 ビットを下へ戻して、32 ビット全体に影響を届かせます。

## ここがすごい

- **偏った入力を散らす**: 入力の下位ビットがほとんど同じでも、この 6 回の混ぜ方で、出力の下位ビットがばらけます。
- **乗算命令を使わない**: 掛け算は、シフトと加算、XOR だけで書かれています。古い JVM でも、単純な命令の組み合わせで速く動きます。
- **1 回の計算で済む**: 追加の表やループがなく、関数の中だけで完結します。この関数の結果は、セグメントと添字の位置を決めるのに使われます（コメントの説明）。
- **定数の意味は書かれていない**: `0xffffcd7d` の選び方は、コードには説明がありません。混ぜ方の性質を確かめるには、別途テストが必要です。

## まとめ

- `rehash` は、シフト、XOR、加算を交互に使って、ハッシュ値の全体を混ぜる。
- 下位のビットに偏りがあっても、添字に使うビットがばらけるようにする。
- 掛け算を使わず、単純な命令の組み合わせだけで書かれている。
