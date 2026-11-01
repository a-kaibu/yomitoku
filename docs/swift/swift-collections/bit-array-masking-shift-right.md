---
title: "先頭を捨て、末尾を false で埋める、ビット配列の右シフト"
description: "BitArray を先頭側へずらすシフト。左シフトと対になる実装で、残すビットを範囲コピーで移し、空いた末尾だけを false にする。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2022 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/BitCollections/BitArray/BitArray+Shifts.swift
lines: [155, 163]
function: "BitArray._UnsafeHandle._maskingShiftRight(by:)"
difficulty: 2
tags: [ビット演算, データ構造, 最適化]
format: 2
---
## ひとことで

`maskingShiftRight(by:)` は、ビット配列を末尾側（右）へずらす操作です。先頭から押し出されたビットは捨て、先頭に入ってくるビットは false になります。
前の記事の左シフトと対になっている関数です。ここでは、この実装が左シフトのどこと対応しているかを見ていきます。

## コード

```swift:line-numbers=155
  internal mutating func _maskingShiftRight(by amount: Int) {
    assert(amount > 0)
    let d = Swift.min(amount, self.count)
    if d == amount {
      let range = unsafe Range(uncheckedBounds: (d, self.count))
      unsafe self.copy(from: range, to: 0)
    }
    unsafe self.clear(in: Range(uncheckedBounds: (self.count &- d, self.count)))
  }
```

## 前提知識

- **前の記事の左シフト**: 残すビットを範囲コピーで移し、空いた部分を false にする考え方です。
- **`Range(uncheckedBounds:)`**: 範囲の検査を省いて作る範囲です。
- **`copy(from:to:)`**: 範囲を指定の位置へコピーします。
- **`clear(in:)`**: 範囲のビットを false にします。

## 何をしているか

### 1. ずらす量を要素数で抑える

左シフトと同じく、`d = min(amount, count)` で量を抑えます。

```swift:line-numbers=157
    let d = Swift.min(amount, self.count)
```
### 2. 残すビットを左へ移す

`d == amount` なら、先頭の `d` 個を捨てて、残りの部分（`d` から最後まで）を先頭へコピーします。

```swift:line-numbers=158
    if d == amount {
      let range = unsafe Range(uncheckedBounds: (d, self.count))
      unsafe self.copy(from: range, to: 0)
```
### 3. 末尾を false にする

空いた末尾の `d` 個を false にします。左シフトが先頭を埋めていたのと、ちょうど反対の位置です。

```swift:line-numbers=162
    unsafe self.clear(in: Range(uncheckedBounds: (self.count &- d, self.count)))
```
## ここがすごい

- **左右が鏡になっている**: 左シフトは「先頭を空ける」、右シフトは「末尾を空ける」と、コピーの向きとクリアの範囲が対称です。どちらか 1 つを理解すると、もう一方も自然に読めます。
- **負の量は逆向きのシフトに**: 公開側の `maskingShiftRight(by:)` では、量が負なら逆向きの関数を呼んでいます。内部の関数は正の量だけを扱うので、単純に書けています。
- **共通の抑え方**: 両方とも、最初に量を要素数で抑えています。この 1 行で、範囲外のアクセスを防ぎ、大きな値の扱いも決まります。

## まとめ

- ビット配列の左右シフトは、コピーの向きとクリアの範囲を反対にした対称な形になる。
- 内部の関数は正の量だけ扱うと、公開側で符号を振り分けるだけで済む。
- 量の抑え方を最初に揃えておくと、両方の関数で安全さが同じになる。
