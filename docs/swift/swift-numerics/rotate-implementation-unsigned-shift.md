---
title: "符号付きの整数を、符号なしに変換してから回転する"
description: "整数のビットを左右に回転させる関数。符号付きの値には符号なしの右シフトがないので、ビットパターンを符号なしの型に変換し、シフト量の補数は元の型のビット幅で計算する。"
language: swift
project: "Swift Numerics"
repo: https://github.com/apple/swift-numerics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift Numerics project authors"
commit: "669f6185187f8e1b5857a25c4bbe6c34a3a02b96"
file: Sources/IntegerUtilities/Rotate.swift
lines: [14, 25]
function: "FixedWidthInteger.rotateImplementation(right:)"
difficulty: 3
tags: [ビット演算, 数値計算, 防御的プログラミング]
format: 2
---
## ひとことで

ビットの回転（ローテート）は、右へ `count` ビットずらし、はみ出したビットを左端へ戻す操作です。たとえば 8 ビットの `0b0000_0001` を右へ 1 回転すると、`0b1000_0000` になります。
`rotateImplementation(right:)` は、その実際の計算をする内部関数です。符号付きの整数でも正しく動くように、少し工夫がされています。

## コード

::: code-group

```swift:line-numbers=14 [日本語訳]
  internal func rotateImplementation(right count: Int) -> Self {
    // // 符号付きの値に対して符号なしの右シフトはないので、符号なしの型へ変換する。
    // // どの Self の値のビットパターンも表せる符号なしの型は Magnitude だけである。
    // // Magnitude のほうが Self より広くてもよいが、
    // // そのぶん、シフト量の補数は Magnitude.bitWidth や 0 ではなく Self.bitWidth で計算する。
    // // （ここまでで説明は終わり）
    // // （上の説明の続き）
    let bitPattern = Magnitude(truncatingIfNeeded: self)
    let countComplement = Self.bitWidth &- count
    return Self(truncatingIfNeeded:
      bitPattern &>> count | bitPattern &<< countComplement
    )
```

```swift:line-numbers=14 [原文]
  internal func rotateImplementation(right count: Int) -> Self {
    // We don't have an unsigned right shift operation for signed values, so
    // we need to convert to an unsigned type. The only unsigned type that's
    // guaranteed to be able to represent the bit pattern of any Self value
    // is Magnitude. It would be possible to have Magnitude be _wider_ than
    // Self, but that's OK as long as we're careful to complement the shift
    // count using Self.bitWidth and not Magnitude.bitWidth or zero.
    let bitPattern = Magnitude(truncatingIfNeeded: self)
    let countComplement = Self.bitWidth &- count
    return Self(truncatingIfNeeded:
      bitPattern &>> count | bitPattern &<< countComplement
    )
```

:::

## 前提知識

- **`Magnitude`**: その整数型の絶対値を表す型です。符号付きの `Int` なら `UInt` になります。
- **`truncatingIfNeeded:`**: 上位のビットを捨てて、別の型に変換します。ビットのパターンはそのまま残ります。
- **`&>>` / `&<<`**: オーバーフローを検査しないシフトです。
- **`|`**: ビットの OR です。
- **`bitWidth`**: その型のビット数です。

## 何をしているか

### 1. 符号なしに変換する

`bitPattern` は、同じビットを持つ符号なしの値です。符号付きの値を右へずらすと、符号ビットがコピーされてしまいます。それを避けるために、先に符号なしの型に変換します。

```swift:line-numbers=21
    let bitPattern = Magnitude(truncatingIfNeeded: self)
```
### 2. 補数のシフト量を求める

左へずらす量は、元の幅から右へずらす量を引いたものです。ここで `Self.bitWidth` を使うのが大切です。`Magnitude` は `Self` より広い場合があり、そのビット幅で計算するとずれてしまうからです。

```swift:line-numbers=22
    let countComplement = Self.bitWidth &- count
```
### 3. 右へずらしたものと、左へずらしたものを OR する

右へずらすと下のビットが落ちます。左へずらすと、落ちたビットに相当するものが上に出てきます。この 2 つを OR すると、回転になります。

```swift:line-numbers=23
    return Self(truncatingIfNeeded:
      bitPattern &>> count | bitPattern &<< countComplement
    )
```
## ここがすごい

- **符号ビットの混入を防ぐ**: 符号付きの値を直接右シフトすると、負の数では上位が 1 で埋まってしまいます。符号なしの型に変換してからシフトすることで、回転の結果が正しくなります。
- **補数を元の幅で計算する**: `count` が 0 のとき、`Self.bitWidth - 0` はちょうど幅になり、左へずらす量が幅いっぱいになります。`bitWidth` を元の型で使うことで、`Magnitude` のほうが広くても正しく計算できます。
- **1 行で回転が完成する**: 右シフトと左シフトを OR するだけなので、分岐がありません。`@_transparent` を付けて、呼び出し側で展開させています。

## まとめ

- 符号付きの値をビット単位で扱うときは、符号なしに変換してからシフトする。
- シフト量の補数は、扱う型の幅で計算する。
- 回転は、右シフトと左シフトの OR で書ける。
