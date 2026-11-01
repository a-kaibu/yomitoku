---
title: "「入れる」「消す」と同時に「変化したか」を返すビット操作"
description: "1 つのワードにビットを立てる・下ろす関数。操作と同時に、それによって集合が変化したかどうかを Bool で返し、Set の insert と同じ使い心地を実現している。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Bitset.swift
lines: [216, 244]
function: "_UnsafeBitset.Word.uncheckedInsert(_:) / uncheckedRemove(_:)"
difficulty: 1
tags: [ビット演算, データ構造, API設計, 標準ライブラリ]
format: 2
---
## ひとことで

ビット集合の 1 ワード（64 ビット）に対する 3 つの基本操作です。`uncheckedContains` は「`bit` 番目が立っているか」、`uncheckedInsert` は「`bit` 番目を立てる」、`uncheckedRemove` は「`bit` 番目を下ろす」。
挿入と削除は、**操作の前後で値が変わったかどうか** を `Bool` で返します。すでに入っている要素を挿入しようとしたら `false` が返ります。

## コード

```swift:line-numbers=216
  @inlinable
  @inline(__always)
  internal func uncheckedContains(_ bit: Int) -> Bool {
    _internalInvariant(bit >= 0 && bit < UInt.bitWidth)
    return value & (1 &<< bit) != 0
  }

  @inlinable
  @inline(__always)
  @discardableResult
  internal mutating func uncheckedInsert(_ bit: Int) -> Bool {
    _internalInvariant(bit >= 0 && bit < UInt.bitWidth)
    let mask: UInt = 1 &<< bit
    let inserted = value & mask == 0
    value |= mask
    return inserted
  }

  @inlinable
  @inline(__always)
  @discardableResult
  internal mutating func uncheckedRemove(_ bit: Int) -> Bool {
    _internalInvariant(bit >= 0 && bit < UInt.bitWidth)
    let mask: UInt = 1 &<< bit
    let removed = value & mask != 0
    value &= ~mask
    return removed
  }
}
```

## 前提知識

- **`1 &<< bit`**: 1 を `bit` 回左にシフトした値です。`bit = 3` なら `0b1000`。このように 1 ビットだけ立った値を「マスク」と呼びます。
- **`&`, `|=`, `&=`, `~`**: ビットごとの AND、OR して代入、AND して代入、ビット反転です。`~0b1000` は `…11110111`（3 ビット目だけが 0）になります。
- **`mutating`**: 構造体の値（ここでは `value`）を書き換えるメソッドに付けます。
- **`@discardableResult`**: 「戻り値を使わなくても警告を出さない」という属性です。挿入の成否を気にしない呼び出し側もあるので付いています。
- **`unchecked`**: 名前に付いているのは「範囲チェックを呼び出し側の責任にした」という意味です。チェックは `_internalInvariant`（デバッグ時のみ有効）だけです。
- **`let mask: UInt = ...`**: `: UInt` は型注釈です。型を明示して、`1` が `UInt` として扱われるようにしています。

## 何をしているか

`value = 0b0101`（集合 `{0, 2}`）とします。

### uncheckedContains(2)

```swift:line-numbers=218
  internal func uncheckedContains(_ bit: Int) -> Bool {
    _internalInvariant(bit >= 0 && bit < UInt.bitWidth)
    return value & (1 &<< bit) != 0
  }
```
`0b0101 & 0b0100 = 0b0100` で 0 ではないので `true`。

### uncheckedInsert(1)

```swift:line-numbers=226
  internal mutating func uncheckedInsert(_ bit: Int) -> Bool {
    _internalInvariant(bit >= 0 && bit < UInt.bitWidth)
    let mask: UInt = 1 &<< bit
    let inserted = value & mask == 0
    value |= mask
    return inserted
  }
```
- `mask = 0b0010`。
- `value & mask == 0` は `true`。つまり **まだ入っていなかった**。
- `value |= mask` で `0b0111` に。
- `true`（新しく入った）を返します。

もう一度 `uncheckedInsert(1)` を呼ぶと、この部分 `false` になり、この部分値は変わらず、`false` を返します。

### uncheckedRemove(2)

```swift:line-numbers=237
  internal mutating func uncheckedRemove(_ bit: Int) -> Bool {
    _internalInvariant(bit >= 0 && bit < UInt.bitWidth)
    let mask: UInt = 1 &<< bit
    let removed = value & mask != 0
    value &= ~mask
    return removed
  }
```
- `mask = 0b0100`。
- `value & mask != 0` は `true`。入っていた。
- `value &= ~mask` で 2 ビット目だけを 0 にします。`0b0111 & 0b1011 = 0b0011`。
- `true`（実際に消えた）を返します。

## ここがすごい

- **「変化したか」を一緒に返す**: Swift の `Set.insert` は「新しく入ったか」を返します。このビット集合も同じ発想です。呼び出し側は「新しく入ったときだけカウントを増やす」といった処理を、`contains` を別に呼ばずに書けます。チェックと更新を 2 回に分けると、ワードを 2 回読むことになりますが、この書き方なら 1 回の読み込みで済みます。
- **分岐のない更新**:この部分とこの部分は、入っていてもいなくても同じ命令を実行します。「入っていなければ立てる」と `if` を書く必要はありません。`|=` は立っているビットを立て直しても結果が同じ、`&= ~mask` は 0 のビットを 0 にしても同じ、という性質（冪等性）を利用しています。
- **安全と速さの切り分け**: チェックは呼び出し側の責任とし、関数自体は最小限の命令にしています。名前に `unchecked` と付けることで、その約束が名前からわかります。

## まとめ

- 1 ビットだけ立てたマスクと `|`、`& ~` で、特定のビットを立てたり下ろしたりできる。
- 更新前の状態をついでに調べて返すと、API が使いやすく、無駄な読み込みも減る。
- OR や AND は何度やっても結果が同じ（冪等）なので、条件分岐なしで更新できる。
