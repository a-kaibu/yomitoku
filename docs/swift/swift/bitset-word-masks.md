---
title: "マスク 1 つで「ある位置より上」「下」を切り出す"
description: "ビット集合の 1 ワードから、最小・最大の要素や「n より小さい要素」「n より大きい要素」をビット演算 1〜2 回で求める関数群。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Bitset.swift
lines: [246, 296]
function: "_UnsafeBitset.Word.minimum / maximum / intersecting(elementsBelow:)"
difficulty: 2
tags: [ビット演算, データ構造, 標準ライブラリ]
---
## ひとことで

ビットで表した集合（たとえば `0b1011_0100` は `{2, 4, 5, 7}`）に対して、次の操作をする小さな関数の集まりです。

- `minimum` / `maximum`: いちばん小さい要素・大きい要素（`2` と `7`）。
- `complement`: 補集合（入っていない要素の集合）。
- `subtracting(elementsBelow: n)`: `n` より小さい要素を取り除く。
- `intersecting(elementsBelow: n)`: `n` より小さい要素だけを残す。
- `intersecting(elementsAbove: n)`: `n` より大きい要素だけを残す。

どれも **ループなし**、ビット演算 1〜2 回で求めます。

## コード

```swift:line-numbers=246
extension _UnsafeBitset.Word {
  @inlinable
  var minimum: Int? {
    @inline(__always)
    get {
      guard value != 0 else { return nil }
      return value.trailingZeroBitCount
    }
  }

  @inlinable
  var maximum: Int? {
    @inline(__always)
    get {
      guard value != 0 else { return nil }
      return _UnsafeBitset.Word.capacity &- 1 &- value.leadingZeroBitCount
    }
  }

  @inlinable
  var complement: _UnsafeBitset.Word {
    @inline(__always)
    get {
      return _UnsafeBitset.Word(~value)
    }
  }

  @inlinable
  @inline(__always)
  internal func subtracting(elementsBelow bit: Int) -> _UnsafeBitset.Word {
    _internalInvariant(bit >= 0 && bit < _UnsafeBitset.Word.capacity)
    let mask = UInt.max &<< bit
    return _UnsafeBitset.Word(value & mask)
  }

  @inlinable
  @inline(__always)
  internal func intersecting(elementsBelow bit: Int) -> _UnsafeBitset.Word {
    _internalInvariant(bit >= 0 && bit < _UnsafeBitset.Word.capacity)
    let mask: UInt = (1 as UInt &<< bit) &- 1
    return _UnsafeBitset.Word(value & mask)
  }

  @inlinable
  @inline(__always)
  internal func intersecting(elementsAbove bit: Int) -> _UnsafeBitset.Word {
    _internalInvariant(bit >= 0 && bit < _UnsafeBitset.Word.capacity)
    let mask = (UInt.max &<< bit) &<< 1
    return _UnsafeBitset.Word(value & mask)
  }
}
```

## 前提知識

- **計算プロパティ `var minimum: Int? { get { ... } }`**: 値を保存せず、読むたびに計算する「プロパティ」です。呼び出し側は `word.minimum` と、関数呼び出しの `()` なしで書けます。
- **`guard value != 0 else { return nil }`**: 空集合なら最小値も最大値もないので `nil` を返します。
- **`trailingZeroBitCount` / `leadingZeroBitCount`**: 右端・左端から続く 0 の数です。
- **`UInt.max`**: 全ビットが 1 の値（`0xFFFF_FFFF_FFFF_FFFF`）です。
- **`1 as UInt`**: リテラル `1` を `UInt` 型として扱う書き方です。
- **`~value`**: すべてのビットを反転します。

## 何をしているか

`value = 0b1011_0100`（`{2, 4, 5, 7}`）、64 ビットとして追います。

### minimum（248〜254 行目）

右端の 0 は 2 個なので `trailingZeroBitCount = 2`。最小の要素は **2** です。

### maximum（257〜263 行目）

左端の 0 は 64 − 8 = 56 個。`64 - 1 - 56 = 7` で最大の要素は **7** です。

### subtracting(elementsBelow: 4)（275〜279 行目）

`UInt.max &<< 4` は `…1111_0000`（下位 4 ビットだけ 0）。AND すると `0b1011_0000`、つまり `{4, 5, 7}`。4 より小さい 2 が消えました。

### intersecting(elementsBelow: 5)（283〜287 行目）

`(1 << 5) - 1 = 0b1_1111`（下位 5 ビットが 1）。AND すると `0b0001_0100`、つまり `{2, 4}`。

### intersecting(elementsAbove: 4)（291〜295 行目）

`(UInt.max << 4) << 1` は `…1110_0000`（下位 5 ビットが 0）。AND すると `0b1010_0000`、つまり `{5, 7}`。4 自身は含みません。

## ここがすごい

- **2 回に分けたシフトの理由**: `elementsAbove` は「`bit` より上」なので、本来は `UInt.max << (bit + 1)` です。しかし `bit = 63` のとき `bit + 1 = 64` になり、64 ビット幅いっぱいのシフトになります。多くの CPU ではシフト量を 64 で割った余りを使うため、`x << 64` が `x << 0` と同じになってしまいます（`&<<` もシフト量をマスクします）。2 回に分けて `<< bit` してから `<< 1` すれば、`bit = 63` でも正しく 0 になります。
- **「より小さい」は「1 を引く」で作る**: `(1 << n) - 1` は下位 `n` ビットがすべて 1 のマスクです。繰り下がりを使った定番テクニックです。
- **集合演算がそのまま CPU 命令に**: 補集合は NOT、共通部分は AND、和集合は OR。ビット集合はこうした集合演算が 1 命令で済むのが最大の利点です。

## まとめ

- 最小・最大の要素は `trailingZeroBitCount` / `leadingZeroBitCount` で求まる。
- 「下位 n ビットだけ 1」のマスクは `(1 << n) - 1`、「下位 n ビットだけ 0」は `UInt.max << n`。
- ビット幅いっぱいのシフトは CPU によって結果が変わる。シフトを分割して避ける。
