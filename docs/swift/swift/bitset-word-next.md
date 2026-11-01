---
title: "x & (x - 1) で「いちばん下の 1」を消しながら数える"
description: "64 ビットの中で立っているビットの位置を、小さい順に 1 つずつ取り出すイテレータ。trailingZeroBitCount と x & (x-1) の 2 つの定番テクニックの組み合わせ。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Bitset.swift
lines: [316, 352]
function: "_UnsafeBitset.Word.next()"
difficulty: 2
tags: [ビット演算, イテレータ, データ構造, 標準ライブラリ]
---
## ひとことで

`_UnsafeBitset` は、整数の集合を「ビットの並び」で表す標準ライブラリ内部のデータ構造です。`Word` はその 1 単位（64 ビット）で、たとえば値が `0b10110` なら集合 `{1, 2, 4}` を表します。
`next()` は、この `Word` に入っている要素を **小さい順に 1 つずつ取り出し、取り出したビットは消していく** 関数です。`0b10110` に対して呼ぶと、1、2、4、`nil` の順に返ります。

## コード

```swift:line-numbers=316
// Word implements Sequence by using a copy of itself as its Iterator.
// Iteration with `next()` destroys the word's value; however, this won't cause
// problems in normal use, because `next()` is usually called on a separate
// iterator, not the original word.
extension _UnsafeBitset.Word: @unsafe Sequence, @unsafe IteratorProtocol {

  @usableFromInline
  typealias Element = Int

  @inlinable
  internal var count: Int {
    return value.nonzeroBitCount
  }

  @inlinable
  internal var underestimatedCount: Int {
    return count
  }

  @inlinable
  internal var isEmpty: Bool {
    @inline(__always)
    get {
      return value == 0
    }
  }

  /// Return the index of the lowest set bit in this word,
  /// and also destructively clear it.
  @inlinable
  internal mutating func next() -> Int? {
    guard value != 0 else { return nil }
    let bit = value.trailingZeroBitCount
    value &= value &- 1       // Clear lowest nonzero bit.
    return bit
  }
}
```

## 前提知識

- **ビット集合（bitset）**: 「`n` 番目のビットが 1 なら `n` は集合に含まれる」というルールで集合を表す方法です。64 個までの要素の有無を 1 つの整数で表せます。
- **プロトコル `Sequence` と `IteratorProtocol`**: `Sequence` は `for-in` で回せるもの、`IteratorProtocol` は `next()` で次の要素を返すものです。`next()` が `nil` を返すと終わりです。
- **`Int?`（オプショナル）**: 「`Int` の値があるか、`nil`（値なし）」のどちらかを表す型です。
- **`@unsafe`**: この準拠は安全性をコンパイラが保証できないことを示す印です。
- **`typealias Element = Int`**: 要素の型は `Int` だと宣言しています。
- **`nonzeroBitCount`**: 1 になっているビットの数（popcount）です。
- **`trailingZeroBitCount`**: 下位（右側）に続く 0 のビットの数です。`0b10100` なら 2。これは「いちばん下の 1 の位置」と同じです。
- **`&=` と `&-`**: `&=` は AND して代入、`&-` はオーバーフローを許す引き算です。

## 何をしているか

`value = 0b10110` の場合で追います。

### 1 回目の呼び出し（346〜351 行目）

- 347 行目: `value` は 0 でないので続行。
- 348 行目: `trailingZeroBitCount` は 1（右端に 0 が 1 個）。これが返す要素です。
- 349 行目: `value &= value &- 1`。
  - `value - 1` は `0b10101`（いちばん下の 1 が 0 になり、その下の 0 が全部 1 になる）。
  - `0b10110 & 0b10101 = 0b10100`。**いちばん下の 1 だけが消えました。**
- `1` を返します。

### 2 回目以降

`0b10100` → 2 を返して `0b10000` に。次は 4 を返して `0` に。4 回目は 347 行目で `nil` を返して終わりです。

### Word が自分自身のイテレータになる（316〜320 行目）

コメントにある通り、`Word` は `Sequence` でありながら `IteratorProtocol` でもあります。`for x in word` と書くと、`word` のコピーがイテレータとして使われます。`next()` は値を壊していきますが、壊れるのはコピーなので元の `word` は無事です。値型（構造体）ならではの設計です。

## ここがすごい

- **立っているビットの数だけしか回らない**: 64 ビットを 1 つずつ調べると毎回 64 回のループになります。この方法なら、要素が 3 つなら 3 回で終わります。まばらな集合ほど速くなります。
- **`x & (x - 1)` は有名なビット演算の定番**: 1 を引くと「いちばん下の 1 から下」が反転する、という性質を使っています。分岐なしでいちばん下の 1 を消せます。
- **CPU 命令に直結**: `trailingZeroBitCount` は x86 の `tzcnt`、ARM の `rbit` + `clz` などの命令になります。つまり 1 要素あたり数命令で取り出せます。
- **イテレータ用の型を別に作らない**: 値型の「コピーされる」性質を利用して、`Word` 自身をイテレータにしています。型が 1 つ減り、コードも短くなります。

## まとめ

- `x & (x - 1)` でいちばん下の 1 のビットを消せる。
- `trailingZeroBitCount` でいちばん下の 1 の位置がわかる。この 2 つを組み合わせると、立っているビットだけを高速に列挙できる。
- 値型なら、自分のコピーをイテレータとして使う設計ができる。
