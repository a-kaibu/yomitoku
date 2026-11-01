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
---
## ひとことで

Swift の `Dictionary` や `Set` は、オープンアドレス法のハッシュテーブルです。新しい要素を入れるとき、ハッシュ値で決まる「理想の枠」がすでに埋まっていたら、その先で最初に見つかる空き（穴、hole）に入れます。
`nextHole(atOrAfter:)` は、その **最初の空き枠を探す** 関数です。各枠が埋まっているかどうかをビット集合（1 ビット = 1 枠）で持っているので、64 枠ぶんをまとめて調べられます。

## コード

```swift:line-numbers=396
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

## 前提知識

- **`Bucket`**: 枠の位置を表す型です。`bucket.word` は「何番目の 64 ビット単位（ワード）か」、`bucket.bit` は「そのワードの何ビット目か」です。
- **`words[word]`**: 占有状況のビット集合の、`word` 番目のワードです。埋まっている枠のビットが 1 です。
- **`.complement`**: ビットを反転します。空き枠が 1 になります。
- **`.subtracting(elementsBelow: bit)`**: `bit` より下位のビットを 0 にします。
- **`.minimum`**: いちばん下位の 1 の位置（なければ `nil`）。内部では `trailingZeroBitCount` を使います。
- **`if let bit = ... { }`**: オプショナルが `nil` でなければ中身を取り出して実行します。
- **メソッドチェーン**: `a.b.c.d` のように、メソッドやプロパティを続けて呼んでいます。

## 何をしているか

`bucket.word = 0`、`bucket.bit = 3`、ワード 0 が `…1111_1111_1011_1000` だとします（3〜5 番、7 番以降が埋まっている）。

### 1. 同じワードの中を探す（この部分）

1. `complement` で反転: `…0000_0000_0100_0111`（空きが 1）。
2. `subtracting(elementsBelow: 3)` で 3 ビット目より下を消す: `…0000_0000_0100_0000`。
3. `minimum` は 6。6 番の枠が、3 番以降で最初の空きです。

### 2. 見つからなければ次のワードへ（この部分）

同じワードに空きがなければ、次のワードを反転して `minimum` を探します。最後のワードまで行ったら 0 番に戻ります（テーブルの終わりと始まりはつながっています）。

一周しても見つからなければ、この部分 `_precondition` で止まります。ただし、ハッシュテーブルは必ず空きを 1 つ以上残すように作られているので、ふつうは起きません。

### 枠数が 64 未満のとき（この部分）

コメントにある通り、枠が 64 個未満のときは、ワードの範囲外のビットがすべて 1（埋まっている扱い）になっています。だから、範囲外を「空き」と誤解することがありません。

## ここがすごい

- **64 枠を 1 回で調べる**: 素直に書くと「次の枠を見る、埋まっていれば次」と 1 枠ずつ調べます。ビット集合なら、反転と `trailingZeroBitCount` の数命令で 64 枠ぶんを調べられます。要素が詰まって長い列になっている場所でも、高速に空きにたどり着けます。
- **占有状況を別に持つ**: キーや値の配列とは別に、占有状況だけを小さなビット集合にまとめています。探索のときはこの小さな領域だけを読めばよいので、CPU キャッシュにもよく収まります。
- **範囲外のビットを 1 で埋めておく**: 枠が 64 未満のときの特別扱いを、`if` で書かずに、データの側（範囲外のビットを最初から 1 にしておく）で解決しています（この部分 `clear`）。探索のコードは場合分けなしで書けます。

## まとめ

- 占有状況をビット集合で持つと、「反転して最下位の 1 を探す」で空き枠が一瞬で見つかる。
- テーブルの終わりと始まりをつなげて（ラップアラウンド）、円のように探す。
- 範囲外のビットをあらかじめ「埋まっている」にしておくと、特別扱いのコードが要らなくなる。
