---
title: "溢れたビットを捨て、空いた下位を 0 で埋めるビット配列の左シフト"
description: "BitArray の要素数を変えずに、ビットを左へずらす関数。はみ出したビットは捨て、入ってくる下位のビットはすべて false にする。コピーとクリアを 1 回ずつ使う。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2022 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/BitCollections/BitArray/BitArray+Shifts.swift
lines: [145, 153]
function: "BitArray._UnsafeHandle._maskingShiftLeft(by:)"
difficulty: 3
tags: [ビット演算, データ構造, 最適化]
format: 2
---
## ひとことで

`BitArray` は、true か false の並びを、ビットを詰めて持つ配列です。`maskingShiftLeft(by:)` は、要素数を変えずに、ビットを先頭側（左）へずらします。はみ出した分は捨て、末尾に入ってくる分は全部 false にします。
この記事で取り上げるのは、その実装の中で、実際に配列の中身を動かす `_maskingShiftLeft(by:)` です。

## コード

```swift:line-numbers=145
  internal mutating func _maskingShiftLeft(by amount: Int) {
    assert(amount > 0)
    let d = Swift.min(amount, self.count)
    if d == amount {
      let range = unsafe Range(uncheckedBounds: (0, self.count &- d))
      unsafe self.copy(from: range, to: d)
    }
    unsafe self.clear(in: Range(uncheckedBounds: (0, d)))
  }
```

## 前提知識

- **`BitArray._UnsafeHandle`**: ビットの配列を、安全でない形で直接操作するための内部の型です。`self.count` で要素数を取れます。
- **`Swift.min`**: 2 つの値の小さいほうを返す標準の関数です。モジュール名を付けて、同名のメソッドと区別しています。
- **`Range(uncheckedBounds:)`**: 範囲の検査を省いて、範囲を作ります。
- **`copy(from:to:)`**: 指定の範囲を、指定の位置へコピーします。
- **`clear(in:)`**: 指定の範囲のビットを全部 false にします。

## 何をしているか

### 1. ずらす量を要素数の範囲に収める

`d = min(amount, count)` で、ずらす量が要素数を超えないようにします。要素数より大きくずらしても、結果は全部 false なので、これで十分です。

### 2. 残るビットを右へ移す

`d == amount`、つまりずらす量が要素数の範囲内なら、残すべきビットを先頭から `count - d` 個だけコピーし、`d` 位置だけ右へ移します。

```swift:line-numbers=148
    if d == amount {
      let range = unsafe Range(uncheckedBounds: (0, self.count &- d))
      unsafe self.copy(from: range, to: d)
    }
```
### 3. 空いた下位を 0 にする

先頭の `d` 個（今ずらして空いた部分）を false にします。

```swift:line-numbers=152
    unsafe self.clear(in: Range(uncheckedBounds: (0, d)))
```
## ここがすごい

- **コピーは 1 回、クリアは 1 回**: 1 ビットずつ動かす方法は、要素数に比例したループが必要です。この関数は範囲単位のコピーとクリアだけで済むので、ビットがたくさんあっても素早く終わります。
- **大きくずらしすぎた場合の扱い**: `d < amount` のとき（ずらす量が要素数より大きい）は、コピーをしません。全部 false になるだけなので、わざわざ計算しないで済ませています。
- **同じ形を右シフトでも使う**: 右シフトの版（同じファイルの次の関数）は、コピーの向きとクリアの場所が逆になるだけです。対称な形で書かれているので、読み比べると理解しやすくなります。

## まとめ

- ビットの配列のシフトは、範囲のコピーとクリアに置き換えると速い。
- ずらす量を要素数で抑えると、大きな値でも安全に終わる。
- 左右のシフトは、コピーの向きとクリアの場所を変えるだけの対称な形になる。
