---
title: "後ろから読む UTF-8 検証を、マスク比較だけで書く"
description: "文字列を末尾から 1 文字ずつ読むための UTF-8 パーサー。2〜4 バイトの並びが正しいかを、マスクして比べるだけで判定し、短すぎる表現やサロゲートも弾く。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/UTF8.swift
lines: [187, 220]
function: "UTF8.ReverseParser._parseMultipleCodeUnits()"
difficulty: 3
tags: [Unicode, パース, ビット演算, 文字列処理, 標準ライブラリ]
---
## ひとことで

文字列を後ろから 1 文字ずつ読みたいことがあります（`reversed()` や `last` など）。`UTF8.ReverseParser` は、末尾から UTF-8 を読み取るパーサーです。
`_parseMultipleCodeUnits()` は、読み込んだ最大 4 バイトが **正しい UTF-8 の 2〜4 バイト文字か** を判定し、正しければ何ビットぶんの文字かを返します。正しくなければ、不正な部分の長さを返します。

## コード

```swift:line-numbers=187
extension UTF8.ReverseParser: Unicode.Parser, _UTFParser {
  public typealias Encoding = Unicode.UTF8
  @inline(__always)
  @inlinable
  public func _parseMultipleCodeUnits() -> (isValid: Bool, bitCount: UInt8) {
    _internalInvariant(_buffer._storage & 0x80 != 0) // this case handled elsewhere
    if _buffer._storage                & 0b0__1110_0000__1100_0000
                                      == 0b0__1100_0000__1000_0000 {
      // 2-byte sequence.  Top 4 bits of decoded result must be nonzero
      let top4Bits =  _buffer._storage & 0b0__0001_1110__0000_0000
      if _fastPath(top4Bits != 0) { return (true, 2*8) }
    }
    else if _buffer._storage     & 0b0__1111_0000__1100_0000__1100_0000
                                == 0b0__1110_0000__1000_0000__1000_0000 {
      // 3-byte sequence. The top 5 bits of the decoded result must be nonzero
      // and not a surrogate
      let top5Bits = _buffer._storage & 0b0__1111__0010_0000__0000_0000
      if _fastPath(
        top5Bits != 0 &&    top5Bits != 0b0__1101__0010_0000__0000_0000) {
        return (true, 3*8)
      }
    }
    else if _buffer._storage & 0b0__1111_1000__1100_0000__1100_0000__1100_0000
                            == 0b0__1111_0000__1000_0000__1000_0000__1000_0000 {
      // Make sure the top 5 bits of the decoded result would be in range
      let top5bits = _buffer._storage
                                  & 0b0__0111__0011_0000__0000_0000__0000_0000
      if _fastPath(
        top5bits != 0
        && top5bits <=              0b0__0100__0000_0000__0000_0000__0000_0000
      ) { return (true, 4*8) }
    }
    return (false, _invalidLength() &* 8)
  }
```

## 前提知識

- **UTF-8 の形**: 2 バイト `110xxxxx 10xxxxxx`、3 バイト `1110xxxx 10xxxxxx 10xxxxxx`、4 バイト `11110xxx 10xxxxxx ×3`。
- **後ろから読むバッファ**: このパーサーは末尾から読むので、**前のバイトほど上位ビット** に入っています。2 バイト文字なら、上位 8 ビットが先頭バイト、下位 8 ビットが継続バイトです。
- **マスク比較 `x & mask == pattern`**: マスクで「決まっているべきビット」だけを取り出し、期待するパターンと比べます。たとえば `x & 0b1110_0000 == 0b1100_0000` は「上位 3 ビットが `110`」の判定です。
- **戻り値 `(isValid: Bool, bitCount: UInt8)`**: 正しいか、何ビット（バイト数 × 8）消費するか、の組です。
- **冗長な表現（overlong）**: UTF-8 では、同じ文字を必要以上に長いバイト数で書くことが禁止されています。たとえば「A」（`0x41`）を 2 バイト `0xC1 0x81` で書くのは不正です。
- **サロゲート**: `U+D800`〜`U+DFFF` は UTF-16 の特殊用途の番号で、UTF-8 に入れてはいけません。

## 何をしているか

### 2 バイトの場合（この部分）

`0b1110_0000__1100_0000` でマスクして `0b1100_0000__1000_0000` と比べ、「先頭バイトが `110`、継続バイトが `10`」かを確かめます。

さらにこの部分、先頭バイトの `xxxxx` のうち上位 4 ビットを取り出します。これが 0 だと、番号が 127 以下になり、1 バイトで書けるはずの文字（冗長な表現）です。0 でなければ正しい 2 バイト文字です。

### 3 バイトの場合（この部分）

形を確かめたあと、`top5Bits`（先頭バイトの下位 4 ビット + 2 バイト目の 1 ビット）を見ます。

- 0 なら番号が `0x800` 未満で、冗長な表現。
- `0b1101__0010_0000…` なら先頭が `0xED` で 2 バイト目が `0xA0` 以上、つまり **サロゲート**（`U+D800` 以上）。

どちらでもなければ正しい 3 バイト文字です。

### 4 バイトの場合（この部分）

`top5bits` が 0 なら `0x10000` 未満で冗長。`0b100_00` より大きいと `U+10FFFF`（Unicode の最大値）を超えます。どちらでもなければ正しい 4 バイト文字です。

### 不正な場合（この部分）

`_invalidLength()`（同じファイルのこの部分）で、不正な並びが何バイトかを調べて返します。

## ここがすごい

- **1 回の AND と比較で形を確かめる**: 「1 バイト目が `110` で始まり、かつ 2 バイト目が `10` で始まる」を、マスクを工夫して 1 回の比較で判定しています。バイトごとに `if` を書くより速く、分岐も少なくなります。
- **形の判定と値の範囲チェックを組み合わせる**: UTF-8 の検証で難しいのは、形が正しいのに意味的に不正なもの（冗長な表現、サロゲート、範囲外）です。それをすべて「特定のビットを取り出して、0 か、ある値以下か」という単純な整数の比較に落とし込んでいます。
- **めったに通らない処理を分ける**: 不正な場合の長さ計算は別関数 `_invalidLength` に分けられ、`@inline(never)` が付いています。正しいデータを処理するときのコードが小さく保たれ、速くなります。

## まとめ

- UTF-8 の検証は「形（先頭ビットのパターン）」と「値の範囲（冗長・サロゲート・最大値）」の 2 段階。
- マスクして比べると、複数のバイトの形を一度に確かめられる。
- 失敗時の処理は別関数に追い出すと、成功時のコードが速くなる。
