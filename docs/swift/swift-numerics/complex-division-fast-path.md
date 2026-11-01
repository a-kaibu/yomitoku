---
title: "複素数の割り算を、溢れない方法で計算する"
description: "複素数の割り算を、分母の大きさの二乗が普通に計算できるときは速い式で、溢れたり消えたりするときは拡大と縮小をして計算する演算子の実装。"
language: swift
project: "Swift Numerics"
repo: https://github.com/apple/swift-numerics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2019-2025 Apple Inc. and the Swift Numerics project authors"
commit: "669f6185187f8e1b5857a25c4bbe6c34a3a02b96"
file: Sources/ComplexModule/Complex+AlgebraicField.swift
lines: [37, 45]
function: "Complex./(_:_:)"
difficulty: 3
tags: [数値計算, 防御的プログラミング, 型システム]
format: 2
---
## ひとことで

複素数 `z` を `w` で割るには、`w` の共役をかけて、分母の大きさの二乗で割ります。式にすると `z / w = z × (conj(w) / |w|²)` です。
ただし、`|w|²` が大きすぎると溢れ、小さすぎると消えてしまいます。この関数は、まず普通の式で計算し、だめなときだけ、慎重な方法に切り替えます。

## コード

::: code-group

```swift:line-numbers=37 [日本語訳]
  public static func /(z: Complex, w: Complex) -> Complex {
    // 割り算は z/w = z * (conj(w) / |w|^2) と書けます。
    // これをオーバーフローやアンダーフローなしで計算できれば、結果は正しいです。
    // できなければ、値を拡大・縮小して、慎重に計算する必要があります。
    // （その計算は、下の rescaledDivide で行います）
    let lenSq = w.lengthSquared
    guard lenSq.isNormal else { return rescaledDivide(z, w) }
    return z * w.conjugate.divided(by: lenSq)
  }
```

```swift:line-numbers=37 [原文]
  public static func /(z: Complex, w: Complex) -> Complex {
    // Try the naive expression z/w = z * (conj(w) / |w|^2); if we can
    // compute this without over/underflow, everything is fine and the
    // result is correct. If not, we have to rescale and do the
    // computation carefully (see below).
    let lenSq = w.lengthSquared
    guard lenSq.isNormal else { return rescaledDivide(z, w) }
    return z * w.conjugate.divided(by: lenSq)
  }
```

:::

## 前提知識

- **複素数**: `a + bi` の形の数で、`a` が実部、`b` が虚部です。
- **共役（conj）**: 虚部の符号を反転させた数です。`conj(a + bi) = a - bi` です。
- **大きさの二乗（`lengthSquared`）**: `a² + b²` で、大きさを二乗した値です。
- **`isNormal`**: 浮動小数点の値が、通常の値として使えるかを表す性質です。0、非常に小さい数、無限大、NaN のときは `false` です。

## 何をしているか

### 1. 分母の大きさの二乗を求め、通常の値か確かめる

`w` の大きさの二乗を `lenSq` とします。これが通常の値でなければ、式は正しく計算できないので、慎重な方法へ回します。

```swift:line-numbers=42
    let lenSq = w.lengthSquared
    guard lenSq.isNormal else { return rescaledDivide(z, w) }
```
### 2. 普通の式で割る

大きさの二乗が通常の値なら、`w` の共役を `lenSq` で割り、`z` にかけます。

```swift:line-numbers=44
    return z * w.conjugate.divided(by: lenSq)
```
例として `z = 1 + i`、`w = 1 + i` とします。`lenSq = 2` です。`conj(w) / 2 = 0.5 - 0.5i` で、これに `z` をかけると `1` になります。

### 3. 溢れるときは、拡大と縮小をして計算する

大きさの二乗が溢れたり消えたりするときは、`rescaledDivide` に任せます。ここでは、`w` の大きさが小さすぎる場合など、場合分けをして、値を適切な大きさに拡大・縮小してから割ります。

```swift:line-numbers=48
  internal static func rescaledDivide(_ z: Complex, _ w: Complex) -> Complex {
    if w.isZero { return .infinity }
    if !w.isFinite { return .zero }
```
## ここがすごい

- **普通の場合は速い**: 普通の式は、掛け算と 1 回の割り算だけです。ほとんどの入力は、この速い道を通ります。
- **溢れてから直すのではなく、先に判定する**: 結果が壊れてから直すのではなく、`isNormal` で先に判定します。壊れる前に、慎重な方法へ切り替えられます。
- **0 と無限大を先に扱う**: 分母が 0 なら無限大、無限大なら 0 を返すなど、特別な値は `rescaledDivide` の先頭で処理します。

## まとめ

- 複素数の割り算は、共役をかけて大きさの二乗で割ると書ける。
- 大きさの二乗が溢れたり消えたりするときだけ、拡大と縮小をする慎重な方法へ切り替える。
- 普通の場合は速い式を使うので、全体として速さと正確さを両立できる。
