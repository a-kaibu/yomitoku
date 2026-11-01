---
title: "2 つの整数の差を、オーバーフローさせずに Int で返す"
description: "x から y までの距離を求める distance(to:)。符号なし・符号付き、同じ符号・違う符号の 4 パターンに分けて、途中の計算があふれない順番で引き算する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2024 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Integers.swift
lines: [1841, 1867]
function: "BinaryInteger.distance(to:)"
difficulty: 2
tags: [数値計算, 防御的プログラミング, ジェネリクス, 標準ライブラリ]
---
## ひとことで

`3.distance(to: 10)` は 7、`10.distance(to: 3)` は -7。2 つの整数の差（`other - self`）を `Int` で返すメソッドです。`stride(from:to:by:)` のような汎用コードで使われます。
ただの引き算に見えますが、`UInt8` の 3 から 10 を引くと負になって表せない、`Int8` の -100 から 100 までは 200 で `Int8` に入らない、といった問題があります。この関数は場合分けをして、**途中の計算が決してあふれないように** しています。

## コード

```swift:line-numbers=1841
  @inlinable
  @inline(__always)
  public func distance(to other: Self) -> Int {
    if !Self.isSigned {
      if self > other {
        if let result = Int(exactly: self - other) {
          return -result
        }
      } else {
        if let result = Int(exactly: other - self) {
          return result
        }
      }
    } else {
      let isNegative = self < (0 as Self)
      if isNegative == (other < (0 as Self)) {
        if let result = Int(exactly: other - self) {
          return result
        }
      } else {
        if let result = Int(exactly: self.magnitude + other.magnitude) {
          return isNegative ? result : -result
        }
      }
    }
    _preconditionFailure("Distance is not representable in Int")
  }
```

## 前提知識

- **`Self.isSigned`**: その型が符号付き（負の数を表せる）かどうか。`Int8` なら true、`UInt8` なら false。
- **`Int(exactly:)`**: 値をちょうど表せるときだけ `Int` に変換し、表せなければ `nil` を返します。
- **`if let result = ... { }`**: オプショナルが `nil` でなければ中身を `result` に入れてブロックを実行します（オプショナルバインディング）。
- **`magnitude`**: 絶対値です。符号なしの型で返ります。
- **`(0 as Self)`**: 0 をこの型の値として書く方法です。ジェネリックな文脈では型を明示する必要があります。
- **`_preconditionFailure`**: 条件を満たせないときにプログラムを止めます。

## 何をしているか

### 符号なしの場合（1844〜1853 行目）

`UInt8` の `10.distance(to: 3)` を考えます。`3 - 10` は `UInt8` では計算できません（負になる）。そこで、大きいほうから小さいほうを引きます。

- `self > other` なので `self - other = 7` を計算し、`Int` にして符号を反転、`-7` を返します。

### 符号付きで、同じ符号の場合（1855〜1859 行目）

両方とも正か両方とも負なら、`other - self` はあふれません。たとえば `Int8` の `-100` と `-20` の差は 80 で、範囲内です。

### 符号付きで、符号が違う場合（1860〜1864 行目）

`Int8` の `-100.distance(to: 100)` を考えます。`100 - (-100) = 200` は `Int8`（最大 127）に入りません。

そこで絶対値を足します。`magnitude` は `UInt8` なので、`100 + 100 = 200` は収まります（最大 255）。`self` が負なので、結果は正の `200` です。

### 表せない場合（1866 行目）

`Int` 自身より大きい型（`UInt64` の巨大な差など）で、結果が `Int` に入らないときは停止します。

## ここがすごい

- **4 つの場合に分けて、どれもあふれない**: 引き算があふれるのは「符号なしで結果が負」「符号付きで符号が違う」のときだけです。それぞれ「大小を入れ替えて引く」「絶対値を足す」という、あふれない計算に置き換えています。
- **`Int(exactly:)` で安全に変換**: 結果が `Int` に入るかどうかを `nil` で判定しています。入らない場合だけ、最後の停止に落ちてきます。
- **`isSigned` の分岐はコンパイル時に消える**: `Self.isSigned` は型ごとに決まった定数です。`@inline(__always)` で展開されると、`Int` なら符号付きの分岐だけが残り、コンパイラが不要な枝を消します。
- **ジェネリックなコードの土台**: `stride` や `Range` の要素数の計算は、この関数に頼っています。ここが正しく書かれているから、`UInt8` でも `Int64` でも同じように使えます。

## まとめ

- 整数の引き算は、符号なしでは「負になる」、符号付きでは「符号が違うと大きすぎる」ときにあふれる。
- 場合分けをして「大きいほうから引く」「絶対値を足す」に変えると、あふれずに計算できる。
- `Int(exactly:)` を使うと、型の変換で情報が失われるかどうかを安全に判定できる。
