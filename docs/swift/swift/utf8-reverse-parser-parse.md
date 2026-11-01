---
title: "後ろから読んだ UTF-8 の 1 文字が正しいかを判定する"
description: "文字列を末尾から読む UTF8.ReverseParser の _parseMultipleCodeUnits。読んだ最大 4 バイトが正しい 2〜4 バイトの文字かを、ビットマスクの比較で判定する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/UTF8.swift
lines: [191, 220]
function: "UTF8.ReverseParser._parseMultipleCodeUnits()"
difficulty: 3
tags: [Unicode, 文字列処理, ビット演算]
format: 2
---
## ひとことで

文字列を後ろから 1 文字ずつ読みたいことがあります。`reversed()` や `last` などがそうです。`UTF8.ReverseParser` は、末尾から UTF-8 を読み取るパーサーです。`_parseMultipleCodeUnits()` は、読み込んだ最大 4 バイトが正しい UTF-8 の 2 から 4 バイト文字かを判定します。正しければ、何ビットぶんの文字かを返します。正しくなければ、不正な長さを返します。

## コード

::: code-group

```swift:line-numbers=191 [日本語訳]
  public func _parseMultipleCodeUnits() -> (isValid: Bool, bitCount: UInt8) {
    _internalInvariant(_buffer._storage & 0x80 != 0) // この場合は、別の場所で処理されます。
    if _buffer._storage                & 0b0__1110_0000__1100_0000
                                      == 0b0__1100_0000__1000_0000 {
      // 2 バイトの並びです。デコードした結果の上位 4 ビットは 0 であってはなりません。
      let top4Bits =  _buffer._storage & 0b0__0001_1110__0000_0000
      if _fastPath(top4Bits != 0) { return (true, 2*8) }
    }
    else if _buffer._storage     & 0b0__1111_0000__1100_0000__1100_0000
                                == 0b0__1110_0000__1000_0000__1000_0000 {
      // 3 バイトの並びです。デコードした結果の上位 5 ビットは 0 ではなく、サロゲートでもないことが必要です。
      // サロゲートでないことも確かめます。
      let top5Bits = _buffer._storage & 0b0__1111__0010_0000__0000_0000
      if _fastPath(
        top5Bits != 0 &&    top5Bits != 0b0__1101__0010_0000__0000_0000) {
        return (true, 3*8)
      }
    }
    else if _buffer._storage & 0b0__1111_1000__1100_0000__1100_0000__1100_0000
                            == 0b0__1111_0000__1000_0000__1000_0000__1000_0000 {
      // デコードした結果の上位 5 ビットが、範囲内に収まることを確かめます。
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

```swift:line-numbers=191 [原文]
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

:::

## 前提知識

- **UTF-8 の形**: 2 バイトは `110xxxxx 10xxxxxx`、3 バイトは `1110xxxx 10xxxxxx 10xxxxxx`、4 バイトは `11110xxx 10xxxxxx` が 3 つ続く形です。
- **後ろから読むバッファ**: このパーサーは末尾から読むので、前のバイトほど上位のビットに入っています。
- **マスク比較 `x & mask == pattern`**: マスクで決まっているべきビットだけを取り出し、期待する並びと比べます。
- **冗長な表現（overlong）**: 同じ文字を必要以上に長いバイト数で書くことは、UTF-8 では禁止されています。
- **サロゲート**: `U+D800` から `U+DFFF` は UTF-16 の特殊な番号で、UTF-8 には入れてはいけません。

## 何をしているか

### 1. 2 バイトの文字かを確かめる

先頭バイトが `110`、継続バイトが `10` の形なら、2 バイトの候補です。さらに、デコードした結果の上位 4 ビットが 0 でないことを確かめます。0 なら、1 バイトで書けるはずの文字なので、冗長な表現として不正です。

```swift:line-numbers=193
    if _buffer._storage                & 0b0__1110_0000__1100_0000
                                      == 0b0__1100_0000__1000_0000 {
      // 2 バイトの並びです。デコードした結果の上位 4 ビットは 0 であってはなりません。
      let top4Bits =  _buffer._storage & 0b0__0001_1110__0000_0000
      if _fastPath(top4Bits != 0) { return (true, 2*8) }
```
### 2. 3 バイトの文字かを確かめる

3 バイトの形を確かめたあと、デコードした結果の上位 5 ビットを見ます。0 なら、`0x800` より小さい冗長な表現です。`0xED` で 2 バイト目が `0xA0` 以上なら、サロゲートです。どちらでもなければ、正しい 3 バイトの文字です。

```swift:line-numbers=199
    else if _buffer._storage     & 0b0__1111_0000__1100_0000__1100_0000
                                == 0b0__1110_0000__1000_0000__1000_0000 {
      // 3 バイトの並びです。デコードした結果の上位 5 ビットは 0 ではなく、サロゲートでもないことが必要です。
      // サロゲートでないことも確かめます。
      let top5Bits = _buffer._storage & 0b0__1111__0010_0000__0000_0000
      if _fastPath(
        top5Bits != 0 &&    top5Bits != 0b0__1101__0010_0000__0000_0000) {
        return (true, 3*8)
      }
```
### 3. 4 バイトの文字かを確かめる

4 バイトの形を確かめて、上位 5 ビットが範囲内にあるかを見ます。0 なら `0x10000` より小さい冗長な表現です。範囲を超えれば、Unicode の最大値 `U+10FFFF` を超えてしまいます。どちらでもなければ、正しい 4 バイトの文字です。

```swift:line-numbers=209
    else if _buffer._storage & 0b0__1111_1000__1100_0000__1100_0000__1100_0000
                            == 0b0__1111_0000__1000_0000__1000_0000__1000_0000 {
      // デコードした結果の上位 5 ビットが、範囲内に収まることを確かめます。
      let top5bits = _buffer._storage
                                  & 0b0__0111__0011_0000__0000_0000__0000_0000
      if _fastPath(
        top5bits != 0
        && top5bits <=              0b0__0100__0000_0000__0000_0000__0000_0000
      ) { return (true, 4*8) }
```
### 4. どれにも当てはまらなければ不正

どの形にも当てはまらなければ、不正な長さを返します。`_invalidLength()` は、置き換え文字として扱う長さを教えてくれます。

```swift:line-numbers=219
    return (false, _invalidLength() &* 8)
```
## ここがすごい

- **比較をビットマスクで一気に行う**: 3 つのバイトの形を、マスクと比較 1 回で確かめられます。文字を 1 つずつ数値にしてから範囲を調べるより、ずっと速く済みます。
- **サロゲートと冗長表現を弾く**: 形が正しいだけでは UTF-8 として不正なものがあります。この関数は、冗長な表現とサロゲートを明示的に除いています。
- **後ろからでも同じ判定**: 末尾から読むバッファでも、ビットの並びを工夫して、前から読むときと同じ判定を使えます。

## まとめ

- 後ろから読んだ UTF-8 の 1 文字が正しいかを、ビットマスクで判定する。
- 形だけでなく、冗長な表現とサロゲートも弾く。
- 不正なときは、置き換えに使う長さを返す。
