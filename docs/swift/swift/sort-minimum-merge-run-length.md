---
title: "ビット 6 個で決める Timsort の「最小ラン長」"
description: "Swift 標準の sort が内部で使う Timsort の下準備。要素数の先頭 6 ビットだけを見て、マージが均等になるラン長を一瞬で計算する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Sort.swift
lines: [451, 474]
function: "_minimumMergeRunLength"
difficulty: 2
tags: [ソート, ビット演算, アルゴリズム, 標準ライブラリ]
---
## ひとことで

Swift の `sort()` は Timsort（ティムソート）系のアルゴリズムで動いています。Timsort は配列を「ラン」と呼ぶ小さな整列済みの区間に分け、それらを順にマージ（併合）していく方式です。
`_minimumMergeRunLength` は、**ラン 1 本の最低の長さ（minrun）をいくつにするか** を決める関数です。要素数 `c` が 64 未満ならそのまま `c` を返し、それ以上なら 32〜64 の範囲から「マージが均等になる」値を選びます。

## コード

```swift:line-numbers=451
/// Calculates an optimal minimum run length for sorting a collection.
///
/// "... pick a minrun in range(32, 65) such that N/minrun is exactly a power
/// of 2, or if that isn't possible, is close to, but strictly less than, a
/// power of 2. This is easier to do than it may sound: take the first 6 bits
/// of N, and add 1 if any of the remaining bits are set."
/// - From the Timsort introduction, at
///   https://svn.python.org/projects/python/trunk/Objects/listsort.txt
///
/// - Parameter c: The number of elements in a collection.
/// - Returns: If `c <= 64`, returns `c`. Otherwise, returns a value in
///   `32...64`.
@inlinable
internal func _minimumMergeRunLength(_ c: Int) -> Int {
  // Max out at `2^6 == 64` elements
  let bitsToUse = 6
  
  if c < 1 << bitsToUse {
    return c
  }
  let offset = (Int.bitWidth - bitsToUse) - c.leadingZeroBitCount
  let mask = (1 << offset) - 1
  return c >> offset + (c & mask == 0 ? 0 : 1)
}
```

## 前提知識

- **`///` コメント**: Swift のドキュメンテーションコメントです。Xcode などで関数の説明として表示されます。
- **`@inlinable`**: 「この関数の中身をモジュールの外にも公開し、呼び出し側で展開（インライン化）してよい」という属性です。標準ライブラリでは性能のために多用されます。
- **`internal`**: 同じモジュール（ここでは標準ライブラリ）の中からだけ使える、というアクセス修飾子です。
- **`let` と `var`**: `let` は再代入できない定数、`var` は変数です。
- **`1 << bitsToUse`**: 左シフトです。`1 << 6` は 2 進数の `1000000`、つまり 64 です。
- **`Int.bitWidth`**: `Int` のビット数です。64 ビット環境なら 64 です。
- **`leadingZeroBitCount`**: 整数の上位（左側）に並んでいる 0 のビットの数です。たとえば 64 ビットの `1000`（10 進数）は 2 進数で 10 桁なので、上位に 0 が 54 個あります。
- **三項演算子 `条件 ? A : B`**: 条件が真なら A、偽なら B になります。

## 何をしているか

### 1. 小さい配列はそのまま（468〜470 行目）

`c < 64` なら `c` をそのまま返します。64 要素未満なら配列全体を 1 本のランとして挿入ソートで並べるほうが速いからです。

### 2. 先頭 6 ビットを取り出す（471〜473 行目）

64 以上のときは、`c` を 2 進数で書いたときの **上から 6 ビット** だけを残します。

具体例として `c = 1000` を考えます。1000 は 2 進数で `1111101000`（10 桁）です。

- `c.leadingZeroBitCount` は 64 − 10 = 54。
- `offset = (64 - 6) - 54 = 4`。つまり「下の 4 ビットを捨てれば先頭 6 ビットが残る」という意味です。
- `mask = (1 << 4) - 1 = 0b1111`。捨てる 4 ビットぶんのマスクです。
- `c >> 4` は `111110`（= 62）。
- `c & mask` は `1000`（= 8）で 0 ではないので、1 を足して **63** を返します。

1000 個の要素を長さ 63 のランに分けると、約 16 本（1000 / 63 ≒ 15.9）になります。16 は 2 のべき乗なので、マージを 2 本ずつ繰り返すとき、どの段でも長さがほぼ同じもの同士を併合できます。

### 3. 「切り上げ」の意味

捨てたビットが 1 つでも立っていれば 1 を足す、というのは **割り算の切り上げ** と同じです。こうすると `c / minrun` が 2 のべき乗「以下」になり、最後に半端な短いランが 1 本だけ余る、という事態を避けられます。

## ここがすごい

- **割り算もループもない**: 「`c / minrun` が 2 のべき乗に近くなる minrun を 32〜64 から探す」と言われると、候補を 1 つずつ試したくなります。しかし先頭 6 ビットを取り出すだけで答えが出ます。`leadingZeroBitCount` は多くの CPU で 1 命令（`lzcnt` や `clz`）になるので、計算はほぼ一瞬です。
- **出典をコメントに残している**: 451〜458 行目に、Python の Timsort の解説文書（listsort.txt）からの引用があります。アルゴリズムの意図がコードの外の資料に頼らずにわかります。
- **マージのバランスを最初に整える**: マージソートは「長さが近いもの同士」をマージすると効率がよくなります。長さ 1000 と 10 をマージすると、短いほうを入れるために長いほうを何度も動かすことになるからです。最初のラン長を工夫するだけで、後段のマージ全体がきれいな二分木の形になります。

素直に書くなら `return max(32, c / 16)` のような近似でも動きますが、それでは `c / minrun` が 2 のべき乗から外れやすく、末尾に短いランが残ります。この関数は Timsort の作者 Tim Peters の考えた方法をビット演算で忠実に再現しています。

## まとめ

- Timsort は「短い整列済みラン」を作ってからマージする。最初のラン長がマージ全体の効率を左右する。
- 「上位 6 ビットを残し、残りが 0 でなければ +1」で、ラン数をちょうど 2 のべき乗以下にそろえられる。
- `leadingZeroBitCount` を使えば、整数の桁数をループなしで求められる。
