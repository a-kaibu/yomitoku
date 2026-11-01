---
title: "ビットの 1 の数を数えて、子の配列の位置を求める"
description: "ハッシュ木の 1 つのノードで、子の有無を 32 ビットのビットマップで管理し、ある子の配列上の位置を、その手前にある 1 の数で求める関数。配列を詰めて持てる。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2022 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/HashTreeCollections/HashNode/_Bitmap.swift
lines: [145, 152]
function: "_Bitmap.slot(of:) and _Bitmap.bucket(at:)"
difficulty: 3
tags: [ビット演算, データ構造, ハッシュ]
format: 2
---
## ひとことで

`TreeDictionary` や `TreeSet` のようなハッシュ木では、1 つのノードが、最大 32 個の子を持てます。すべての子を配列に並べると、空いている場所が無駄になります。
そこで、子が **ある** ところに 1 ビットを立てたビットマップを持ちます。子の配列は、詰めて持ち、ビットの位置から配列上の場所を求めます。この関数は、その変換をしています。

## コード

```swift:line-numbers=145
  internal func slot(of bucket: _Bucket) -> _HashSlot {
    _HashSlot(_value._rank(ofBit: bucket.value))
  }

  @inlinable @inline(__always)
  internal func bucket(at slot: _HashSlot) -> _Bucket {
    _Bucket(_value._bit(ranked: slot.value)!)
  }
```

## 前提知識

- **ビットマップ**: 1 ビットずつに、ある位置の有無を記録した整数です。ここでは `UInt32` で、32 個の位置を表せます。
- **`_HashSlot`**: 子の配列の中の場所（0 から数えた添字）を表す型です。
- **`_Bucket`**: ビットマップの中の位置（0〜31）を表す型です。
- **`nonzeroBitCount`**: 整数の中で 1 のビットの数を返す関数です。CPU の命令で速く計算されます。

## 何をしているか

### 1. 子がある位置に、ビットを立てる

子を追加するとき、その位置（バケット）のビットを 1 にします。`1 << bucket.value` で、その位置だけが 1 のマスクを作り、OR で立てます。

```swift:line-numbers=121
  internal mutating func insert(_ bucket: _Bucket) {
    assert(bucket.value < capacity)
    _value |= (1 &<< bucket.value)
  }
```
### 2. 手前にある 1 の数が、配列上の位置になる

ある子のバケットの下位にある 1 の数を数えると、その子が配列の何番目にあるかが分かります。この数を `_rank(ofBit:)` で求めます。
たとえばビットマップが `0b1011`（位置 0、1、3 に子がある）で、位置 3 の子を探すとします。位置 3 より下のビットは `0b011` で、1 の数は 2 です。よって配列の 2 番目（0 から数えて）に入ります。

```swift:line-numbers=145
  internal func slot(of bucket: _Bucket) -> _HashSlot {
    _HashSlot(_value._rank(ofBit: bucket.value))
  }
```
### 3. 逆に、配列上の位置からバケットを求める

配列の `slot` から、ビットマップの中で同じ数の 1 が並んでいる位置を探します。その位置がバケットです。

```swift:line-numbers=150
  internal func bucket(at slot: _HashSlot) -> _Bucket {
    _Bucket(_value._bit(ranked: slot.value)!)
  }
```
## ここがすごい

- **空の場所を持たない**: 子がない位置は、配列に場所を取りません。子の配列は詰めて持つので、メモリが少なくて済みます。
- **位置の計算がマスクと数えるだけ**: 配列上の位置は「手前の 1 の数」です。ループで探さず、マスクと `nonzeroBitCount` の 2 つの操作で求まります。
- **子の追加や削除も 1 ビットの操作**: `1 << bucket` の OR や AND-NOT だけで、子の有無を変えられます。

## まとめ

- 子の有無はビットマップで持ち、子の配列は詰めて持つ。
- 配列上の位置は、バケットより下にある 1 の数で求まる。
- 逆方向の変換も、同じ 1 の数の性質を使って求められる。
