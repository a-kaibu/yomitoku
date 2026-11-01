---
title: "割り算の余りだけで最大公約数を求める、ユークリッドの互除法"
description: "2 つの整数の最大公約数を求める関数。大きいほうを小さいほうで割った余りを使い回すユークリッドの互除法で、最小値のオーバーフローも事前に防いでいる。"
language: swift
project: "Swift Numerics"
repo: https://github.com/apple/swift-numerics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021-2024 Apple Inc. and the Swift Numerics project authors"
commit: "669f6185187f8e1b5857a25c4bbe6c34a3a02b96"
file: Sources/IntegerUtilities/GCD.swift
lines: [26, 39]
function: "gcd(_:_:)"
difficulty: 2
tags: [数値計算, アルゴリズム, 防御的プログラミング]
format: 2
---
## ひとことで

`gcd(12, 18)` は 6 です。最大公約数（GCD）は、2 つの整数を両方とも割り切れる最大の数です。
この関数は、昔からある **ユークリッドの互除法** を使っています。大きいほうを小さいほうで割った余りを使って、余りが 0 になるまで繰り返すだけのとても単純な方法です。

## コード

::: code-group

```swift:line-numbers=26 [日本語訳]
public func gcd<T: BinaryInteger>(_ a: T, _ b: T) -> T {
  var x = a
  var y = b
  if x.magnitude < y.magnitude { swap(&x, &y) }
  // // x が符号付きの最小値、y が -1 のときにオーバーフローしないようにする。
  if y.magnitude == 1 { return 1 }
  // // 最大公約数のユークリッドの互除法。大きい整数型では Lehmer 法のほうがよい。
  // // ただし今の実装は単純で、もう一つの候補であるバイナリ法より速い。
  // // （上の理由の続き）
  while y != 0 { (x, y) = (y, x%y) }
  // // 結果を T に変換してみる。
  if let result = T(exactly: x.magnitude) { return result }
  // // 変換できなければ診断メッセージを出す。
  fatalError("GCD (\(x)) is not representable as \(T.self).")
```

```swift:line-numbers=26 [原文]
public func gcd<T: BinaryInteger>(_ a: T, _ b: T) -> T {
  var x = a
  var y = b
  if x.magnitude < y.magnitude { swap(&x, &y) }
  // Avoid overflow when x = signed min, y = -1.
  if y.magnitude == 1 { return 1 }
  // Euclidean algorithm for GCD. It's worth using Lehmer instead for larger
  // integer types, but for now this is good and dead-simple and faster than
  // the other obvious choice, the binary algorithm.
  while y != 0 { (x, y) = (y, x%y) }
  // Try to convert result to T.
  if let result = T(exactly: x.magnitude) { return result }
  // If that fails, produce a diagnostic.
  fatalError("GCD (\(x)) is not representable as \(T.self).")
```

:::

## 前提知識

- **最大公約数**: 両方を割り切れる最大の正の数です。
- **`magnitude`**: 絶対値です。符号付きの整数でも、符号なしの型で返ります。
- **`swap(&x, &y)`**: 2 つの変数の値を入れ替えます。
- **`(x, y) = (y, x%y)`**: タプルを使って、同時に代入する書き方です。
- **`T(exactly:)`**: 値をその型でちょうど表せるときだけ変換し、表せなければ `nil` を返します。

## 何をしているか

### 1. 大きいほうを x にする

`x.magnitude < y.magnitude` なら入れ替えて、`x` が絶対値の大きいほうになるようにします。

```swift:line-numbers=27
  var x = a
  var y = b
  if x.magnitude < y.magnitude { swap(&x, &y) }
```
### 2. 最小値の特別扱い

符号付きの整数で `y` が -1 のとき、絶対値の計算などでオーバーフローが起きることがあります。`y` の絶対値が 1 なら、答えは 1 だと決めて先に返します。

```swift:line-numbers=30
  // // x が符号付きの最小値、y が -1 のときにオーバーフローしないようにする。
  if y.magnitude == 1 { return 1 }
```
### 3. 余りを使って繰り返す

`y` が 0 になるまで、`x` を `y` で割った余りを新しい `y` とし、`x` と `y` を入れ替えて続けます。たとえば `(18, 12)` なら、次は `(12, 6)`、そして `(6, 0)` で終わり、答えは 6 です。

```swift:line-numbers=35
  while y != 0 { (x, y) = (y, x%y) }
```
### 4. 結果を T に戻す

計算は絶対値で行っているので、結果を元の型に戻します。戻せないときは、プログラムを止めて理由を伝えます。

```swift:line-numbers=36
  // // 結果を T に変換してみる。
  if let result = T(exactly: x.magnitude) { return result }
  // // 変換できなければ診断メッセージを出す。
  fatalError("GCD (\(x)) is not representable as \(T.self).")
```
## ここがすごい

- **アルゴリズムは余りの繰り返しだけ**: 割り算の余りは必ず元の数より小さくなるので、ループは有限回で終わります。とても単純で、数学的な証明もしやすい方法です。
- **絶対値で計算する**: 符号を気にせず計算できるように、絶対値で処理しています。ただし、符号付きの最小値の絶対値は同じ型に入らないので、その場合は結果の変換で検出します。
- **コメントで選択理由を残す**: 関数の中のコメントは、バイナリ法や Lehmer 法と比べて、なぜこの方法を選んだかを説明しています。実装の判断が、コードのそばで読めます。

## まとめ

- 最大公約数は、余りの繰り返し（ユークリッドの互除法）で求まる。
- 符号付きの整数では、絶対値の計算に特別な注意が要る。
- 結果が型に収まるかは、最後に確かめる。
