---
title: "n 番目に立っているビットを、二分探索で見つける"
description: "整数の中で「下から n 番目の 1 のビット」の位置を求める関数。下位ビットから数えた 1 の個数を、半分ずつ区切って足し引きしながら絞り込む。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2022 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/InternalCollectionsUtilities/IntegerTricks/Integer rank.swift
lines: [28, 77]
function: "UInt._bit(ranked:)"
difficulty: 3
tags: [ビット演算, アルゴリズム, データ構造]
format: 2
---
## ひとことで

`_bit(ranked:)` は、整数の中で「下から数えて n 番目（0 から数える）に立っている 1 のビット」の位置を返します。たとえば `0b1011_0100` で `n = 2` なら、下から 3 番目の 1 ビットの位置 5 を返します。
ビットが立っている位置を、ランク（順位）から逆に求める関数です。立っているビットを数える処理は、ループなしで 6 段階の絞り込みで済みます。

## コード

::: code-group

```swift:line-numbers=28 [日本語訳]
extension UInt {
  @_effects(releasenone)
  @usableFromInline
  package func _bit(ranked n: Int) -> UInt? {
    // FIXME: 命令（Intel の PDEP など）が使えるようになったら置き換える。
    assert(UInt.bitWidth == 64 || UInt.bitWidth == 32,
           "Unsupported UInt bitWidth")

    var shift: Self = 0
    var n = Self(truncatingIfNeeded: n)

    if MemoryLayout<UInt>.size == 8 {
      let c32 = (self & 0xFFFFFFFF)._nonzeroBitCount
      if n >= c32 {
        shift &+= 32
        n &-= c32
      }
    } else {
      assert(MemoryLayout<Self>.size == 4, "Unknown platform")
    }

    let c16 = ((self &>> shift) & 0xFFFF)._nonzeroBitCount
    if n >= c16 {
      shift &+= 16
      n &-= c16
    }
    let c8 = ((self &>> shift) & 0xFF)._nonzeroBitCount
    if n >= c8 {
      shift &+= 8
      n &-= c8
    }
    let c4 = ((self &>> shift) & 0xF)._nonzeroBitCount
    if n >= c4 {
      shift &+= 4
      n &-= c4
    }
    let c2 = ((self &>> shift) & 0x3)._nonzeroBitCount
    if n >= c2 {
      shift &+= 2
      n &-= c2
    }
    let c1 = (self &>> shift) & 0x1
    if n >= c1 {
      shift &+= 1
      n &-= c1
    }
    guard n == 0 && (self &>> shift) & 0x1 == 1 else { return nil }
    return shift
  }
}
```

```swift:line-numbers=28 [原文]
extension UInt {
  @_effects(releasenone)
  @usableFromInline
  package func _bit(ranked n: Int) -> UInt? {
    // FIXME: Use bit deposit instruction when available (PDEP on Intel).
    assert(UInt.bitWidth == 64 || UInt.bitWidth == 32,
           "Unsupported UInt bitWidth")

    var shift: Self = 0
    var n = Self(truncatingIfNeeded: n)

    if MemoryLayout<UInt>.size == 8 {
      let c32 = (self & 0xFFFFFFFF)._nonzeroBitCount
      if n >= c32 {
        shift &+= 32
        n &-= c32
      }
    } else {
      assert(MemoryLayout<Self>.size == 4, "Unknown platform")
    }

    let c16 = ((self &>> shift) & 0xFFFF)._nonzeroBitCount
    if n >= c16 {
      shift &+= 16
      n &-= c16
    }
    let c8 = ((self &>> shift) & 0xFF)._nonzeroBitCount
    if n >= c8 {
      shift &+= 8
      n &-= c8
    }
    let c4 = ((self &>> shift) & 0xF)._nonzeroBitCount
    if n >= c4 {
      shift &+= 4
      n &-= c4
    }
    let c2 = ((self &>> shift) & 0x3)._nonzeroBitCount
    if n >= c2 {
      shift &+= 2
      n &-= c2
    }
    let c1 = (self &>> shift) & 0x1
    if n >= c1 {
      shift &+= 1
      n &-= c1
    }
    guard n == 0 && (self &>> shift) & 0x1 == 1 else { return nil }
    return shift
  }
}
```

:::

## 前提知識

- **ランク（rank）**: 「下から何番目の 1 か」という順位です。`_rank(ofBit:)` は、ある位置より下にある 1 の数を返します。この関数はその逆です。
- **`nonzeroBitCount`**: 1 のビットの数です。
- **`&>>`**: オーバーフローを検査しない右シフトです。
- **`guard ... else { return nil }`**: 条件を満たさないときは `nil` を返します（n 番目の 1 がないとき）。

## 何をしているか

### 大きく半分に分ける

```swift:line-numbers=40
      let c32 = (self & 0xFFFFFFFF)._nonzeroBitCount
      if n >= c32 {
        shift &+= 32
        n &-= c32
      }
```
64 ビットなら、まず下位 32 ビットに立っている 1 の数 `c32` を数えます。`n` がそれより大きければ、答えは上位 32 ビットにあるので、`shift` を 32 にして `n` から `c32` を引きます。

この考え方を、16、8、4、2、1 ビットの区画に順に適用します。

### 最後に位置を確かめる

```swift:line-numbers=74
    guard n == 0 && (self &>> shift) & 0x1 == 1 else { return nil }
    return shift
```
6 段階の絞り込みのあと、`shift` は候補の位置を指しています。`n == 0` かつ、その位置のビットが 1 のときだけ、その位置を返します。そうでなければ、n 番目の 1 は存在しないので `nil` です。

例として `0b1011_0100`（1 が 4 つ）で `n = 2` を考えます。下位 8 ビットに 1 は 3 つ（`c8 = 3`）です。`n = 2 < 3` なので、答えは下位 8 ビットの中にあります。

@@L 54-58@@以降も同じように絞り込み、最後は位置 5 にたどり着きます。

## ここがすごい

- **ループなしで位置を特定**: 立っているビットを 1 つずつ数えるのではなく、区画の 1 の数で半分ずつ絞り込みます。`nonzeroBitCount` は CPU の命令 1 つで済むので、全体が速くなります。
- **型ごとに書き分けている**: 同じ処理を、`UInt`、`UInt32`、`UInt16` のそれぞれで書いています。対象の幅に合わせて段数を変えるためです。
- **FIXME で将来の改善を残す**: 「PDEP 命令が使えるようになったら置き換える」というコメントがあります。

@@L 32@@今は使えないので、ビット演算で代用しています。

## まとめ

- 立っているビットの位置は、区画ごとの 1 の数を使って二分探索で絞れる。
- 型の幅に合わせて段数を変えると、無駄なく書ける。
- 命令が使える環境では、将来もっと速い方法に置き換えられるように FIXME を残しておく。
