---
title: "2 のべき乗への切り上げを、先頭ゼロの数で求める"
description: "swift-collections の内部で使われる、整数を次の 2 のべき乗へ切り上げる関数。最上位ビットの位置を前後 1 を引いて求めるだけで、割り算もループも使わない。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2022 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/InternalCollectionsUtilities/IntegerTricks/FixedWidthInteger+roundUpToPowerOfTwo.swift
lines: [14, 23]
function: "FixedWidthInteger._roundUpToPowerOfTwo()"
difficulty: 1
tags: [ビット演算, 数値計算, データ構造]
format: 2
---
## ひとことで

`_roundUpToPowerOfTwo()` は、整数を「それ以上で最小の 2 のべき乗」に切り上げる関数です。たとえば `5` なら `8`、`8` ならそのまま `8`、`0` 以下なら `0` を返します。
ハッシュテーブルやバッファの容量を 2 のべき乗にそろえたいときに使われる、内部用の小さな部品です。

## コード

::: code-group

```swift:line-numbers=14 [日本語訳]
extension FixedWidthInteger {
  /// `self` を 2 のべき乗へ切り上げる。表せることが前提。
  /// `self` が正でなければ 0 を返す。
  @inlinable
  package func _roundUpToPowerOfTwo() -> Self {
    guard self > 0 else { return 0 }
    let l = Self.bitWidth - (self &- 1).leadingZeroBitCount
    return 1 << l
  }
}
```

```swift:line-numbers=14 [原文]
extension FixedWidthInteger {
  /// Round up `self` to the nearest power of two, assuming it's representable.
  /// Returns 0 if `self` isn't positive.
  @inlinable
  package func _roundUpToPowerOfTwo() -> Self {
    guard self > 0 else { return 0 }
    let l = Self.bitWidth - (self &- 1).leadingZeroBitCount
    return 1 << l
  }
}
```

:::

## 前提知識

- **`extension FixedWidthInteger`**: 固定幅の整数型（`Int`、`UInt32` など）すべてに、この関数を追加しています。
- **`package`**: 同じパッケージの中からだけ使える、アクセス修飾子です。
- **`@inlinable`**: 中身を呼び出し側に展開してよいという属性です。
- **`leadingZeroBitCount`**: 上位に続く 0 の数です。
- **`1 << l`**: 1 を `l` 桁左へずらした値、つまり `2^l` です。

## 何をしているか

### 0 以下の扱い

正の数でないものは 0 を返します。

```swift:line-numbers=19
    guard self > 0 else { return 0 }
```
### 最上位ビットの位置を求める

`self &- 1` を取ると、`5` なら `4`（`100`）、`8` なら `7`（`111`）になります。その上位の 0 の数を `bitWidth` から引くと、「必要なビット数」が出ます。

```swift:line-numbers=20
    let l = Self.bitWidth - (self &- 1).leadingZeroBitCount
    return 1 << l
```
`5`（`101`）の場合、`4`（`100`）の上位の 0 は 61 個（64 ビットの場合）なので、`64 - 61 = 3` ビットが必要です。`1 << 3 = 8` になります。

`8`（`1000`）の場合は `7`（`111`）の上位の 0 が 61 個なので、同じく 3 で、`1 << 3 = 8` になります。ちょうど 2 のべき乗なら、そのまま同じ数が返ります。

## ここがすごい

- **1 行でビット数が求まる**: 「`self - 1` の桁数」は、前後の 1 を引いて `leadingZeroBitCount` を引くだけで出ます。ループでシフトを繰り返す必要はありません。
- **`self - 1` を使う理由**: 元の数をそのまま使うと、ちょうど 2 のべき乗の数が 1 つ上のべき乗へ進んでしまいます。1 を引くことで、「ちょうどのとき」を正しく扱えます。
- **0 以下を先に弾く**: `self - 1` を負の数や 0 に対して計算すると、結果が意味を失います。最初に弾くことで、この計算を安全に保っています。

## まとめ

- 2 のべき乗への切り上げは、`self - 1` の桁数を求めて、1 を左へずらせばよい。
- 境界の値（ちょうど 2 のべき乗）で結果がずれないように、1 を引いてから数える。
- 不正な入力（0 以下）は先に弾いておく。
