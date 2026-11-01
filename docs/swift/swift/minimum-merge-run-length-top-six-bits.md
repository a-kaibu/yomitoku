---
title: "並べ替えの連なりの長さを、先頭 6 ビットを使って決める"
description: "TimSort の最小の連なり長を、要素数の上位 6 ビットに丸めて求める標準ライブラリの関数。要素数に応じて、32 から 64 の間の長さを返す。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Sort.swift
lines: [464, 474]
function: "_minimumMergeRunLength(_:)"
difficulty: 3
tags: [ソート, アルゴリズム, ビット演算]
format: 2
---
## ひとことで

Swift の並べ替え（TimSort）は、列を小さな区間に分けて並べてから、それらを併合します。この関数は、要素数に応じて、区間の最小の長さを決めます。その長さは、32 から 64 の範囲に収まります。

## コード

::: code-group

```swift:line-numbers=464 [日本語訳]
internal func _minimumMergeRunLength(_ c: Int) -> Int {
  // 要素数は最大で 2 の 6 乗、つまり 64 までにします。
  let bitsToUse = 6
  
  if c < 1 << bitsToUse {
    return c
  }
  let offset = (Int.bitWidth - bitsToUse) - c.leadingZeroBitCount
  let mask = (1 << offset) - 1
  return c >> offset + (c & mask == 0 ? 0 : 1)
}
```

```swift:line-numbers=464 [原文]
internal func _minimumMergeRunLength(_ c: Int) -> Int {
  // Max out at `2^6 == 64` elements
  let bitsToUse = 6
  
  if c < 1 << bitsToUse {
    return c
  }
  let offset = (Int.bitWidth - bitsToUse) - c.leadingZeroBitCount
  let mask = (1 << offset) - 1
  return c >> offset + (c & mask == 0 ? 0 : 1)
}
```

:::

## 前提知識

- **TimSort**: 既に並んでいる部分を生かしながら、区間をマージしていく並べ替えです。区間の長さがそろうほど、マージが効率的になります。
- **`leadingZeroBitCount`**: 整数の、先頭（最上位）から続く 0 の数です。値の大きさを、ビットの位置で表せます。
- **ビットの桁数**: 64 ビットの整数で、値が `2^k` 未満なら、先頭の 0 は `64 - k` 個以上あります。
- **`>>` と `+` の優先順位**: Swift では、シフトは足し算より先に計算されます。そのため `c >> offset + ...` は、`(c >> offset) + ...` と読めます。

## 何をしているか

### 1. 小さい数は、そのまま返す

64 より小さい数なら、区間の長さは要素数と同じです。

```swift:line-numbers=465
  // 要素数は最大で 2 の 6 乗、つまり 64 までにします。
  let bitsToUse = 6
  
  if c < 1 << bitsToUse {
    return c
  }
```
### 2. 上位 6 ビットを残すための、ずらす量を求める

先頭の 0 の数から、残すべき 6 ビット以外の桁数を求めます。これが、右へずらす量です。

```swift:line-numbers=471
  let offset = (Int.bitWidth - bitsToUse) - c.leadingZeroBitCount
  let mask = (1 << offset) - 1
```
### 3. ずらした結果を、切り上げて返す

右へずらすと、上位 6 ビットだけが残り、32 から 63 の値になります。下の桁に 1 でも残っていれば、1 を足して切り上げます。

```swift:line-numbers=473
  return c >> offset + (c & mask == 0 ? 0 : 1)
```
## ここがすごい

- **桁数の比較で、割り算を避けている**: 要素数の大きさを、先頭の 0 の数だけで知ります。割り算や対数を使わずに、区間の長さを決められます。
- **切り上げを 1 行で書く**: 余りがあるかどうかを、マスクとの AND で判定しています。`if` を使わずに、切り上げを表せます。
- **区間の長さの範囲が決まっている**: どんなに大きな要素数でも、長さは 32 から 64 の間になります。区間の数も、極端に増えません。

## まとめ

- 要素数が 64 未満なら、その数をそのまま使う。
- 先頭の 0 の数から、上位 6 ビットを残す量を決める。
- 右へずらした値を、余りがあれば切り上げて返す。
