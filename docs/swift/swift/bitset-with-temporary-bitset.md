---
title: "ヒープを使わずにスタック上で一時的なビット集合を作る"
description: "Set の共通部分などの計算で使う「使い捨てのビット集合」をスタックに確保する関数。クロージャの中でだけ有効なメモリにすることで、確保と解放の手間をなくしている。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Bitset.swift
lines: [354, 389]
function: "_UnsafeBitset.withTemporaryBitset(capacity:body:)"
difficulty: 3
tags: [メモリ管理, 最適化, クロージャ, 標準ライブラリ]
format: 2
---
## ひとことで

`Set` の `intersection`（共通部分）などを計算するとき、標準ライブラリは「どの位置の要素を残すか」を記録するために、一時的なビット集合を使います。
`withTemporaryBitset(capacity:body:)` は、`capacity` 個の要素ぶんのビット集合を **スタック上に確保し、0 で初期化してから** クロージャ `body` に渡します。`body` が終わるとメモリは自動で捨てられます。

## コード

::: code-group

```swift:line-numbers=354 [日本語訳]
extension _UnsafeBitset {
  @export(implementation)
#if os(Windows)
  // 誤コンパイルの回避策: https://github.com/swiftlang/swift/issues/92465 を参照
  @inline(never)
#else
  @inline(__always)
#endif
  internal static func _withTemporaryUninitializedBitset<R, E: Error>(
    wordCount: Int,
    body: (_UnsafeBitset) throws(E) -> R
  ) throws(E) -> R {
    try withUnsafeTemporaryAllocation(
      of: _UnsafeBitset.Word.self, capacity: wordCount
    ) { (buffer: UnsafeMutableBufferPointer<_UnsafeBitset.Word>) throws(E) -> R in
      let bitset = unsafe _UnsafeBitset(
        words: buffer.baseAddress!, wordCount: buffer.count)
      return try unsafe body(bitset)
    }
  }

  @export(implementation)
  @inline(__always)
  internal static func withTemporaryBitset<R, E: Error>(
    capacity: Int,
    body: (_UnsafeBitset) throws(E) -> R
  ) throws(E) -> R {
    let wordCount = Swift.max(1, Self.wordCount(forCapacity: capacity))
    return try unsafe _withTemporaryUninitializedBitset(
      wordCount: wordCount
    ) { (bitset: _UnsafeBitset) throws(E) -> R in
      unsafe bitset.clear()
      return try unsafe body(bitset)
    }
  }
}
```

```swift:line-numbers=354 [原文]
extension _UnsafeBitset {
  @export(implementation)
#if os(Windows)
  // Workaround for a mis-compile: https://github.com/swiftlang/swift/issues/92465
  @inline(never)
#else
  @inline(__always)
#endif
  internal static func _withTemporaryUninitializedBitset<R, E: Error>(
    wordCount: Int,
    body: (_UnsafeBitset) throws(E) -> R
  ) throws(E) -> R {
    try withUnsafeTemporaryAllocation(
      of: _UnsafeBitset.Word.self, capacity: wordCount
    ) { (buffer: UnsafeMutableBufferPointer<_UnsafeBitset.Word>) throws(E) -> R in
      let bitset = unsafe _UnsafeBitset(
        words: buffer.baseAddress!, wordCount: buffer.count)
      return try unsafe body(bitset)
    }
  }

  @export(implementation)
  @inline(__always)
  internal static func withTemporaryBitset<R, E: Error>(
    capacity: Int,
    body: (_UnsafeBitset) throws(E) -> R
  ) throws(E) -> R {
    let wordCount = Swift.max(1, Self.wordCount(forCapacity: capacity))
    return try unsafe _withTemporaryUninitializedBitset(
      wordCount: wordCount
    ) { (bitset: _UnsafeBitset) throws(E) -> R in
      unsafe bitset.clear()
      return try unsafe body(bitset)
    }
  }
}
```

:::

## 前提知識

- **スタックとヒープ**: プログラムが使うメモリには、関数呼び出しごとに積み上がって自動で片付く「スタック」と、明示的に確保・解放する「ヒープ」があります。スタックの確保はほぼタダですが、関数を抜けると消えます。
- **クロージャ `body: (_UnsafeBitset) throws(E) -> R`**: 関数を引数として受け取っています。`R` は戻り値の型、`E` は投げるエラーの型で、どちらもジェネリクスです。
- **型付き throws `throws(E)`**: Swift 6 で入った機能で、投げるエラーの型を限定できます。
- **`withUnsafeTemporaryAllocation(of:capacity:)`**: 標準ライブラリの関数で、指定した型・個数の一時バッファを（可能ならスタックに）確保し、クロージャに渡します。
- **`UnsafeMutableBufferPointer`**: 連続したメモリ領域（先頭アドレスと個数）を表す型です。`baseAddress!` で先頭のポインタを取り出します。`!` は「`nil` ではないと断言する」という意味です。
- **`#if os(Windows)`**: コンパイル時の条件分岐です。Windows のときだけ別の属性を付けています。
- **`Swift.max`**: 標準ライブラリの `max` 関数を、モジュール名付きで明示的に呼んでいます。同名のメソッドと区別するためです。

## 何をしているか

### _withTemporaryUninitializedBitset

```swift:line-numbers=362
  internal static func _withTemporaryUninitializedBitset<R, E: Error>(
    wordCount: Int,
    body: (_UnsafeBitset) throws(E) -> R
  ) throws(E) -> R {
    try withUnsafeTemporaryAllocation(
      of: _UnsafeBitset.Word.self, capacity: wordCount
    ) { (buffer: UnsafeMutableBufferPointer<_UnsafeBitset.Word>) throws(E) -> R in
      let bitset = unsafe _UnsafeBitset(
        words: buffer.baseAddress!, wordCount: buffer.count)
      return try unsafe body(bitset)
    }
  }
```
1. `withUnsafeTemporaryAllocation` で `wordCount` 個の `Word` を確保します。
2. その先頭アドレスと個数から `_UnsafeBitset` を作ります。
3. それを `body` に渡し、`body` の戻り値をそのまま返します。

中身は初期化されていない（ゴミが入っている）ので、名前に `Uninitialized` と付いています。

### withTemporaryBitset

```swift:line-numbers=377
  internal static func withTemporaryBitset<R, E: Error>(
    capacity: Int,
    body: (_UnsafeBitset) throws(E) -> R
  ) throws(E) -> R {
    let wordCount = Swift.max(1, Self.wordCount(forCapacity: capacity))
    return try unsafe _withTemporaryUninitializedBitset(
      wordCount: wordCount
    ) { (bitset: _UnsafeBitset) throws(E) -> R in
      unsafe bitset.clear()
      return try unsafe body(bitset)
    }
  }
```
1. 必要なワード数を計算します。`capacity = 100` なら 2 ワード。`max(1, ...)` で、`capacity = 0` のときも最低 1 ワード確保します。
2. 上の関数を呼び、受け取ったビット集合を `clear()` で 0 にしてから `body` に渡します。

### Windows だけの回避策

```swift:line-numbers=356
#if os(Windows)
  // 誤コンパイルの回避策: https://github.com/swiftlang/swift/issues/92465 を参照
  @inline(never)
#else
  @inline(__always)
#endif
```
コメントにある通り、Windows ではインライン化するとコンパイラが誤ったコードを出す問題があり、そのときだけ `@inline(never)` にしています。

## ここがすごい

- **「借りて返す」をクロージャで強制する**: ポインタを返す関数にすると、呼び出し側がスタックのメモリを関数の外へ持ち出して壊れたメモリに触る危険があります。クロージャに渡す形にすれば、メモリが有効なのはクロージャの中だけ、という約束が構造で守られます。Swift の `withUnsafe...` 系 API に共通する設計です。
- **ヒープ確保をゼロに**: `Set` の演算のたびにヒープを確保・解放すると、それだけで時間がかかります。数百要素ぶんのビット集合なら数十バイト〜数キロバイトなので、スタックで十分です（大きすぎる場合は `withUnsafeTemporaryAllocation` が自動でヒープに切り替えます）。
- **初期化の有無で関数を分ける**: コピー用の `withTemporaryCopy`（同じファイル）はどうせ全部上書きするので 0 クリアは無駄です。初期化しない版を土台にして、0 で埋める版とコピーする版をその上に作っています。

## まとめ

- 一時的なバッファは、クロージャの中でだけ使える形にすると安全にスタックへ置ける。
- 初期化しない版を共通の土台にすると、無駄な 0 クリアを避けられる。
- コンパイラのバグを回避するコードには、課題番号付きのコメントを残しておく。
