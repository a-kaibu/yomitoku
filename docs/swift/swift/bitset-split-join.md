---
title: "要素番号を「何番目のワードの何ビット目」に分解する"
description: "ビット集合で、要素 n がどの 64 ビット単位のどのビットにあるかを求める関数群。わざと符号なし整数に変換して、割り算と余りを速いシフトとマスクにさせている。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Bitset.swift
lines: [41, 74]
function: "_UnsafeBitset.split(_:) / join(word:bit:)"
difficulty: 2
tags: [ビット演算, 最適化, データ構造, 標準ライブラリ]
---
## ひとことで

ビット集合では、たくさんの 64 ビット整数（ワード）を並べて大きな集合を表します。要素 `n` がどこにあるかは、`n / 64` 番目のワードの `n % 64` ビット目です。たとえば 130 なら、2 番目（0 から数える）のワードの 2 ビット目です。
`word(for:)` と `bit(for:)` はこの計算を、`split` は両方をまとめて、`join` は逆に `(ワード番号, ビット番号)` から要素番号を組み立てます。

## コード

```swift:line-numbers=41
extension _UnsafeBitset {
  @inlinable
  @inline(__always)
  internal static func word(for element: Int) -> Int {
    _internalInvariant(element >= 0)
    // Note: We perform on UInts to get faster unsigned math (shifts).
    let element = UInt(bitPattern: element)
    let capacity = UInt(bitPattern: Word.capacity)
    return Int(bitPattern: element / capacity)
  }

  @inlinable
  @inline(__always)
  internal static func bit(for element: Int) -> Int {
    _internalInvariant(element >= 0)
    // Note: We perform on UInts to get faster unsigned math (masking).
    let element = UInt(bitPattern: element)
    let capacity = UInt(bitPattern: Word.capacity)
    return Int(bitPattern: element % capacity)
  }

  @inlinable
  @inline(__always)
  internal static func split(_ element: Int) -> (word: Int, bit: Int) {
    return (word(for: element), bit(for: element))
  }

  @inlinable
  @inline(__always)
  internal static func join(word: Int, bit: Int) -> Int {
    _internalInvariant(bit >= 0 && bit < Word.capacity)
    return word &* Word.capacity &+ bit
  }
}
```

## 前提知識

- **`static func`**: インスタンスではなく型そのものに属する関数です。`_UnsafeBitset.split(130)` のように呼びます。
- **`_internalInvariant(...)`**: 標準ライブラリ内部用のチェックです。条件が偽なら、デバッグビルドでプログラムを止めます。リリースビルドでは消えます。
- **`UInt(bitPattern:)` / `Int(bitPattern:)`**: ビットの並びはそのままに、符号付き（`Int`）と符号なし（`UInt`）の解釈を切り替える変換です。値の範囲チェックはしません。
- **`Word.capacity`**: 1 ワードに入るビット数です。64 ビット環境では 64 です。
- **`/` と `%`**: 割り算の商と余りです。
- **戻り値 `(word: Int, bit: Int)`**: ラベル付きのタプルです。`let (w, b) = split(130)` のように受け取れます。
- **`&*` / `&+`**: オーバーフロー検査をしない掛け算・足し算です。

## 何をしているか

### word(for:) と bit(for:)（44〜60 行目）

`element = 130` のとき、`word(for:)` は `130 / 64 = 2`、`bit(for:)` は `130 % 64 = 2` を返します。

どちらも計算の前に、`element` と `capacity` を `UInt` に変換しています（47〜48 行目、57〜58 行目）。コメントには「符号なしの計算のほうが速い（シフト、マスク）」とあります。

### split（64〜66 行目）

2 つを呼んでタプルにまとめるだけです。呼び出し側は `let (word, bit) = split(element)` と 1 行で書けます。

### join（70〜73 行目）

逆変換で、`2 * 64 + 2 = 130` を計算します。`bit` は 0〜63 の範囲でなければいけないので、71 行目でそれを確かめています。

## ここがすごい

- **符号なしにするだけで速くなる理由**: 64 は 2 のべき乗なので、`n / 64` は「右に 6 ビットシフト」、`n % 64` は「下位 6 ビットを取り出す（`& 63`）」で計算できます。ところが `Int`（符号付き）だと、負の数で結果が変わるため、コンパイラは単純なシフトに置き換えられません。たとえば `-1 / 64` は 0 ですが、`-1 >> 6` は -1 です。ここでは `element >= 0` が保証されている（45 行目）ので、`UInt` に変換しても値は変わりません。こうして「負になりえない」という知識をコンパイラに伝え、最速の命令を引き出しています。
- **小さな関数に分けて組み立てる**: `word`、`bit`、`split`、`join` と細かく分けておくと、挿入・削除・検索などの各メソッドが `let (word, bit) = split(element)` の 1 行で書けます。すべて `@inline(__always)` なので、分けたことによる呼び出しコストはありません。
- **前提条件をコードで表す**: `_internalInvariant` で「0 以上」「ビット番号は範囲内」を明示しています。デバッグ時にはバグを早く見つけ、本番では速度を落としません。

## まとめ

- 2 のべき乗での割り算・余りはシフトとマスクにできるが、符号付き整数ではそのまま置き換えられない。
- 負にならないとわかっている値は `UInt(bitPattern:)` で符号なしにすると、コンパイラがより速いコードを出せる。
- 小さな部品関数とインライン化を組み合わせると、読みやすさと速さを両立できる。
