---
title: "32 ビット整数 1 つを「最大 4 バイトの配列」にする"
description: "UTF-8 の 1 文字（最大 4 バイト）を UInt32 1 つに詰めて持つ内部型。各バイトに 1 を足して保存することで、0 を「空」の印にし、添字まで整数 1 つで表している。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/ValidUTF8Buffer.swift
lines: [64, 113]
function: "_ValidUTF8Buffer（Collection 準拠）"
difficulty: 3
tags: [データ構造, ビット演算, Unicode, 最適化, 標準ライブラリ]
format: 2
---
## ひとことで

UTF-8 では 1 文字が 1〜4 バイトになります。`_ValidUTF8Buffer` は、その 1 文字ぶんのバイト列を **`UInt32` 1 つ** に詰めて持つ型です。配列を使わないので、メモリの確保が一切ありません。
しかもこの型は `Collection`（`for-in` や添字アクセスができるコレクション）として振る舞います。その **添字（Index）まで `UInt32` 1 つ** で表しているのが、このコードのおもしろいところです。

## コード

```swift:line-numbers=64
extension _ValidUTF8Buffer: Collection {
  @frozen
  public struct Index: Comparable {
    @usableFromInline
    internal var _biasedBits: UInt32

    @inlinable
    internal init(_biasedBits: UInt32) { self._biasedBits = _biasedBits }

    @inlinable
    public static func == (lhs: Index, rhs: Index) -> Bool {
      return lhs._biasedBits == rhs._biasedBits
    }
    @inlinable
    public static func < (lhs: Index, rhs: Index) -> Bool {
      return lhs._biasedBits > rhs._biasedBits
    }
  }

  @inlinable
  public var startIndex: Index {
    return Index(_biasedBits: _biasedBits)
  }

  @inlinable
  public var endIndex: Index {
    return Index(_biasedBits: 0)
  }

  @inlinable
  public var count: Int {
    return UInt32.bitWidth &>> 3 &- _biasedBits.leadingZeroBitCount &>> 3
  }

  @inlinable
  public var isEmpty: Bool {
    return _biasedBits == 0
  }

  @inlinable
  public func index(after i: Index) -> Index {
    _debugPrecondition(i._biasedBits != 0)
    return Index(_biasedBits: i._biasedBits >> 8)
  }

  @inlinable
  public subscript(i: Index) -> Element {
    return Element(truncatingIfNeeded: i._biasedBits) &- 1
  }
}
```

## 前提知識

- **`Collection` プロトコル**: `startIndex`・`endIndex`・`index(after:)`・添字 `subscript` を用意すると、Swift のコレクションとして `for-in`、`count`、`map` などが使えるようになります。
- **`Comparable`**: `<` と `==` を定義すると、大小比較できる型になります。添字は比較できなければいけません。
- **`static func ==` / `static func <`**: 演算子を型のメソッドとして定義しています。
- **`truncatingIfNeeded`**: 上位ビットを切り捨てて小さい型に変換します。`UInt32` から `UInt8` へ変換すると、最下位の 8 ビットだけが残ります。
- **`&-` / `&>>`**: オーバーフロー検査なしの引き算・シフトです。
- **UTF-8 のバイト値**: UTF-8 では `0xFF` というバイトは決して現れません（同じファイルコメント）。

## 何をしているか

### バイアス（1 を足す）付きの保存

文字「é」は UTF-8 で `0xC3 0xA9` の 2 バイトです。この型は、それぞれに 1 を足して `0xC4`、`0xAA` にし、1 バイト目を最下位に置いて `_biasedBits = 0x0000_AAC4` として持ちます。

1 を足すので、どのバイトも 0 になりません。だから **「0 のバイト = そこにはデータがない」** と判断できます。`0xFF` は現れないので、1 を足してもあふれません。

### 添字は「残りのビット」（84〜91、この部分）

- `startIndex` は `_biasedBits` そのもの（`0xAAC4`）。
- `index(after:)` は 8 ビット右へずらす（`0xAA`、もう一度で `0x00`）。
- `endIndex` は `0`。

つまり添字は「まだ読んでいない残りのバイト」です。

### 添字アクセス

```swift:line-numbers=110
  public subscript(i: Index) -> Element {
    return Element(truncatingIfNeeded: i._biasedBits) &- 1
  }
```
添字の最下位 8 ビットを取り出して 1 を引けば、その位置のバイトです。`0xAAC4` なら `0xC4 - 1 = 0xC3`。

### 比較が逆向き

```swift:line-numbers=78
    public static func < (lhs: Index, rhs: Index) -> Bool {
      return lhs._biasedBits > rhs._biasedBits
    }
```
先に進むほど添字の値は小さくなるので、`<` は「ビットが大きいほうが前」と逆に定義されています。

### 要素数

```swift:line-numbers=94
  public var count: Int {
    return UInt32.bitWidth &>> 3 &- _biasedBits.leadingZeroBitCount &>> 3
  }
```
上位の 0 のバイト数を `leadingZeroBitCount / 8` で求め、4 から引きます。`0x0000_AAC4` なら、上位の 0 は 16 ビットで 2 バイト。4 − 2 = 2 バイトです。

## ここがすごい

- **配列もポインタも使わない**: 4 バイト以内とわかっているデータを、レジスタ 1 つで扱えます。関数の引数や戻り値にしてもコピーは一瞬です。
- **「空」を表す特別な値を作る**: データに `0x00` が含まれうるなら、「0 = 空」とは決められません。全体を 1 ずらすことで、0 を印として使えるようにしています。UTF-8 で `0xFF` が使われないという性質をうまく利用しています。
- **添字に余計な情報を持たない**: ふつう添字は「何番目か」の数値ですが、ここでは「残りのデータそのもの」を添字にしています。こうすると、添字から直接バイトを取り出せるので、元のバッファを参照する必要がありません。

## まとめ

- 小さく上限が決まったデータは、整数 1 つに詰めると高速に扱える。
- 値に 1 を足して保存すると、0 を「空」の印として使える。
- 添字の表し方は自由に設計できる。「残りのデータ」を添字にするという発想もある。
