---
title: "ハッシュ値を 5 ビットずつ使って、木を下へたどる"
description: "ハッシュ木で、ハッシュ値の 5 ビットずつを使い、木の段ごとに進む子を決める仕組み。段の深さの上限と、ハッシュのビットを使い切ったあとの扱いも含む。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2022 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/HashTreeCollections/HashNode/_Hash.swift
lines: [59, 70]
function: "_Hash.subscript(_:)"
difficulty: 3
tags: [ハッシュ, データ構造, ビット演算]
format: 2
---
## ひとことで

ハッシュ木で要素を探すには、ハッシュ値をもとに、木の根から葉へ向かって進みます。各段で、どの子へ進むかを決める必要があります。
この実装では、ハッシュ値を **5 ビットずつ** に切って使います。5 ビットは 0〜31 の値で、ビットマップの 32 個の子のどれかに対応します。段が進むごとに、次の 5 ビットを使います。

## コード

```swift:line-numbers=59
  @inlinable
  internal subscript(_ level: _HashLevel) -> _Bucket {
    get {
      assert(!level.isAtBottom)
      return _Bucket((value &>> level.shift) & _Bucket.bitMask)
    }
    set {
      let mask = _Bucket.bitMask &<< level.shift
      self.value &= ~mask
      self.value |= newValue.value &<< level.shift
    }
  }
```

## 前提知識

- **ハッシュ値**: 要素から計算した整数です。同じ要素からは、いつも同じ値が出ます。
- **`_Bucket`**: 子の位置（0〜31）を表す型です。
- **シフト（`>>`）とマスク（`&`）**: 右にずらして、下の必要なビットだけを残す操作です。`(value >> shift) & 31` は、`shift` の位置から 5 ビットを取り出します。
- **`_HashLevel`**: 木の段を表す型です。段ごとに、ハッシュのどこから使うかを `shift` で持ちます。

## 何をしているか

### 1. 段の幅は 5 ビット

1 段で使うビット数は、ビットマップの幅で決まります。`_Bitmap.bitWidth` は、32 個の位置を表すのに必要な 5 です。段が進むたびに、`shift` をこの値だけ増やします。

<!-- source: Sources/HashTreeCollections/HashNode/_HashLevel.swift -->
```swift:line-numbers=52
  internal static var _step: UInt8 {
    UInt8(truncatingIfNeeded: _Bitmap.bitWidth)
```
### 2. 次の段へ進むと、shift を 5 増やす

子をたどるとき、`descend` で次の段の `shift` を作ります。ビットを使い切ったかどうかは、ここではまだ確認していません。


### 3. 木の深さには上限がある

ハッシュ値は 64 ビットなので、5 ビットずつ使うと、最大で 13 段です。その先は、ハッシュのビットがなくなり、衝突ノードという形で同じハッシュの要素を並べます。

<!-- source: Sources/HashTreeCollections/HashNode/_HashLevel.swift -->
```swift:line-numbers=47
  internal static var limit: Int {
    (_Hash.bitWidth + _Bitmap.bitWidth - 1) / _Bitmap.bitWidth
```
## ここがすごい

- **1 段で 32 分岐**: 1 段で 5 ビット使うので、木の分岐は 32 です。深さは `log32 n` ほどになり、浅い木になります。
- **ハッシュ値の一部を、添字として使う**: 比べるたびに、ハッシュ全体を調べ直す必要はありません。`shift` を見れば、今の段で使うビットが分かります。
- **どの段でも同じ式**: 取り出しは、`(value >> shift) & 31` という 1 つの式です。段の数が変わっても、式は変わりません。

## まとめ

- ハッシュ値の 5 ビットずつで、木の各段の子を選ぶ。
- 段の上限は、64 ビット ÷ 5 ビットで 13 段になる。
- 取り出しの式は段に関係なく同じで、マスクとシフトだけで済む。
