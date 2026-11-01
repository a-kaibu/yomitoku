---
title: "ビット集合で空き枠を 64 個ずつ一気に探す"
description: "オープンアドレス法のハッシュテーブルで、ある位置以降の最初の空き枠を探す関数。占有状況をビット集合で持ち、反転して最下位の 1 を探すことで、64 枠を 1 回で調べる。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/HashTable.swift
lines: [396, 422]
function: "_HashTable.nextHole(atOrAfter:)"
difficulty: 3
tags: [ハッシュ, ビット演算, データ構造, 最適化, 標準ライブラリ]
format: 2
---
## ひとことで

Swift の `Dictionary` や `Set` は、オープンアドレス法のハッシュテーブルです。新しい要素を入れるとき、ハッシュ値で決まる理想の枠がすでに埋まっていたら、その先で最初に見つかる空き（穴、hole）に入れます。`nextHole(atOrAfter:)` は、その最初の空き枠を探す関数です。各枠が埋まっているかどうかをビット集合（1 ビットが 1 枠）で持っているので、64 枠ぶんをまとめて調べられます。

## コード

::: code-group

```swift:line-numbers=396 [日本語訳]
  @inlinable
  internal func nextHole(atOrAfter bucket: Bucket) -> Bucket {
    _internalInvariant(isValid(bucket))
    // 1 つだけの部分的なワードのときは、範囲外のビットがすべて 1 になっていることが保証されています。
    // だから、次の式は正しい結果を返します。
    var word = bucket.word
    if let bit =
      unsafe words[word]
        .complement
        .subtracting(elementsBelow: bucket.bit)
        .minimum {
      return Bucket(word: word, bit: bit)
    }
    var wrap = false
    while true {
      word &+= 1
      if unsafe word == wordCount {
        _precondition(!wrap, "Hash table has no holes")
        wrap = true
        word = 0
      }
      if let bit = unsafe words[word].complement.minimum {
        return Bucket(word: word, bit: bit)
      }
    }
    fatalError()
  }
```

```swift:line-numbers=396 [原文]
  @inlinable
  internal func nextHole(atOrAfter bucket: Bucket) -> Bucket {
    _internalInvariant(isValid(bucket))
    // Note that if we have only a single partial word, its out-of-bounds bits
    // are guaranteed to be all set, so the formula below gives correct results.
    var word = bucket.word
    if let bit =
      unsafe words[word]
        .complement
        .subtracting(elementsBelow: bucket.bit)
        .minimum {
      return Bucket(word: word, bit: bit)
    }
    var wrap = false
    while true {
      word &+= 1
      if unsafe word == wordCount {
        _precondition(!wrap, "Hash table has no holes")
        wrap = true
        word = 0
      }
      if let bit = unsafe words[word].complement.minimum {
        return Bucket(word: word, bit: bit)
      }
    }
    fatalError()
  }
```

:::

## 前提知識

- **`Bucket`**: 枠の位置を表す型です。`bucket.word` は何番目の 64 ビット単位（ワード）か、`bucket.bit` はそのワードの何ビット目かを表します。
- **`words[word]`**: 占有状況のビット集合の、指定したワードです。埋まっている枠のビットが 1 です。
- **`.complement`**: ビットを反転します。空き枠が 1 になります。
- **`.subtracting(elementsBelow:)`**: 指定したビットより下位のビットを 0 にします。
- **`.minimum`**: いちばん下位の 1 の位置を返します。1 がなければ `nil` です。内部では `trailingZeroBitCount` を使います。
- **`if let`**: オプショナルが `nil` でなければ、中身を取り出して実行します。

## 何をしているか

たとえば、開始位置が「ワード 0 の 3 ビット目」で、ワード 0 のビットが `…1111_1111_1011_1000` だとします。3 から 5 番目と 7 番目以降は埋まっています。

### 1. 同じワードの中を探す

まず、同じワードの中で探します。ビットを反転すると、空き枠だけが 1 になります。そこから 3 ビット目より下を消して、最下位の 1 を探します。ここでは 6 番目が、3 番目以降で最初の空きになります。

```swift:line-numbers=401
    var word = bucket.word
    if let bit =
      unsafe words[word]
        .complement
        .subtracting(elementsBelow: bucket.bit)
        .minimum {
      return Bucket(word: word, bit: bit)
    }
```
### 2. 見つからなければ次のワードへ進む

同じワードに空きがなければ、次のワードを反転して、最初の空きを探します。最後のワードまで行ったら 0 番に戻ります。テーブルの終わりと始まりはつながっているので、円のように探せます。

一周しても空きが見つからなければ、`_precondition` で止まります。ただし、ハッシュテーブルは必ず空きを 1 つ以上残すように作られているので、ふつうは起きません。

```swift:line-numbers=409
    var wrap = false
    while true {
      word &+= 1
      if unsafe word == wordCount {
        _precondition(!wrap, "Hash table has no holes")
        wrap = true
        word = 0
      }
      if let bit = unsafe words[word].complement.minimum {
        return Bucket(word: word, bit: bit)
      }
    }
```
## ここがすごい

- **64 枠を 1 回で調べる**: 素直に書くと、次の枠を見て埋まっていれば次、と 1 枠ずつ調べます。ビット集合なら、反転と `trailingZeroBitCount` の数命令で 64 枠ぶんを調べられます。要素が詰まって長い列になっている場所でも、高速に空きへたどり着けます。
- **占有状況を別に持つ**: キーや値の配列とは別に、占有状況だけを小さなビット集合にまとめています。探索のときは、この小さな領域だけを読めばよいので、CPU のキャッシュにもよく収まります。
- **範囲外のビットを最初から埋めておく**: 枠の数が 64 未満のときは、ワードの範囲外のビットが余ります。その部分を「埋まっている」として最初から 1 にしておくことで、範囲外を空きと誤解せずに済みます。探索のコードは、場合分けなしで書けます。

## まとめ

- 占有状況をビット集合で持つと、反転して最下位の 1 を探すだけで、空き枠が一瞬で見つかる。
- テーブルの終わりと始まりをつなげて、円のように探す。
- 範囲外のビットをあらかじめ埋まっていることにすると、特別扱いのコードが要らなくなる。
