---
title: "割り算の商を、丸める方向を指定して求める"
description: "整数の割り算を、切り捨て（負の無限大の方向）などの指定した方向へ丸めて求める関数。通常の割り算の商と余りを作ってから、余りの符号を見て商を 1 つ調整する。"
language: swift
project: "Swift Numerics"
repo: https://github.com/apple/swift-numerics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift Numerics project authors"
commit: "669f6185187f8e1b5857a25c4bbe6c34a3a02b96"
file: Sources/IntegerUtilities/DivideWithRounding.swift
lines: [39, 69]
function: "BinaryInteger.divided(by:rounding:)"
difficulty: 4
tags: [数値計算, 型システム, 防御的プログラミング]
format: 2
---
## ひとことで

整数の割り算は、普通は 0 の方向へ丸めます。たとえば `-7 / 2` は `-3` です。でも、負の方向へ丸めたいときや、正の方向へ丸めたいときがあります。この関数は、丸める方向を `rounding:` で指定できる割り算です。`-7` を `2` で割って `.down` を指定すると、`-4` になります。

## コード

::: code-group

```swift:line-numbers=39 [日本語訳]
  public func divided(
    by other: Self,
    rounding rule: RoundingRule = .down
  ) -> Self {
    // 「通常の割り算」は 0 の方向へ丸めるので、self = q × other + r が成り立ちます。
    // 余り r は |r| < |other| で、符号は self と同じです。
    let q = self / other
    let r = self - q*other
    // どの丸め方でも、割り切れる場合の結果は同じです。
    // つまり r が 0 の場合です。
    if r == 0 { return q }
    // ここからは r が 0 でないとします。
    //
    // rule で指定された丸め方どおりの商と余りを得るために、
    // q と r を調整します。商は、q が負なら q-1 か q、
    // q が正なら q か q+1 のどちらかです。
    // q は 0 の方向へ丸められているためです。
    //
    // q から 1 引くなら、その分 r に other を足して補います。理由は次の式です。
    // 
    // self = q × other + r（商と余りの関係）
    // = (q-1) × other + (r + other)（r に other を足す）
    //
    // 同じように、q に 1 を足すなら、その分 r から other を引きます。
    switch rule {
    case .down:
      // 切り捨て（.down）では、r の符号を self ではなく other に合わせたいです。
      // つまり、r と other の符号が違うなら、
      // q を下へ調整し、r も合わせる必要があります。
      if other.signum() != r.signum() { return q-1 }
      return q
```

```swift:line-numbers=39 [原文]
  public func divided(
    by other: Self,
    rounding rule: RoundingRule = .down
  ) -> Self {
    // "Normal divsion" rounds toward zero, so we get self = q*other + r
    // with |r| < |other| and r matching the sign of self.
    let q = self / other
    let r = self - q*other
    // In every rounding mode, the result is the same when the result is
    // exact.
    if r == 0 { return q }
    // From this point forward, we can assume r != 0.
    //
    // To get the quotient and remainder rounded as directed by rule, we
    // will adjust q and r. Note that the quotient is either q-1 or q (if
    // q is negative) or q or q+1 (if q is positive), because q has been
    // rounded toward zero.
    //
    // If we subtract 1 from q, we add other to r to compensate, because:
    // 
    //   self = q*other + r
    //        = (q-1)*other + (r+other)
    //
    // Similarly, if we add 1 to q, we subtract other from r to compensate.
    switch rule {
    case .down:
      // For rounding down, we want to have r match the sign of other
      // rather than self; this means that if the signs of r and other
      // disagree, we have to adjust q downward and r to match.
      if other.signum() != r.signum() { return q-1 }
      return q
```

:::

## 前提知識

- **商と余り**: `self = q × other + r` という関係があります。`q` が商、`r` が余りです。
- **`signum()`**: 数の符号を返す関数です。正なら `1`、負なら `-1`、0 なら `0` です。
- **`RoundingRule`**: 丸め方を表す型です。`.down`（負の無限大へ）、`.up`（正の無限大へ）、`.towardZero`（0 へ）などがあります。

## 何をしているか

### 1. 通常の割り算で、商と余りを求める

まず Swift の `/` で、0 の方向へ丸めた商 `q` を求めます。そして `self - q × other` で余り `r` を求めます。`-7 / 2` では、`q = -3`、`r = -1` です。

```swift:line-numbers=45
    let q = self / other
    let r = self - q*other
```
### 2. 割り切れたら、そのまま返す

余りが 0 なら、どの丸め方でも結果は同じです。そのまま `q` を返します。

```swift:line-numbers=49
    if r == 0 { return q }
```
### 3. 切り捨てなら、余りと除数の符号を比べる

`.down` では、余りの符号を `self` ではなく `other`（割る数）に合わせたいです。符号が違うなら、商を 1 つ下げて `q - 1` にします。`-7 / 2` は `r = -1` で、`other = 2` とは符号が違うので、`q - 1 = -4` を返します。

```swift:line-numbers=63
    switch rule {
    case .down:
      // 切り捨て（.down）では、r の符号を self ではなく other に合わせたいです。
      // つまり、r と other の符号が違うなら、
      // q を下へ調整し、r も合わせる必要があります。
      if other.signum() != r.signum() { return q-1 }
      return q
```
なぜ 1 つ下げると余りが合うかは、次の式で確かめられます。

```swift:line-numbers=57
    // q から 1 引くなら、その分 r に other を足して補います。理由は次の式です。
    // 
    // self = q × other + r（商と余りの関係）
    // = (q-1) × other + (r + other)（r に other を足す）
```
## ここがすごい

- **普通の割り算を先に使う**: 丸め方をいきなり計算するのではなく、まず 0 へ丸めた商と余りを作ります。そこから 1 だけ調整するので、丸め方の処理は小さくて済みます。
- **割り切れる場合の早道**: 余りが 0 なら、丸め方を一切見ずに返します。割り切れる場合は、この分岐だけで処理が終わります。
- **式で正しさを確かめられる**: `self = q × other + r` という式を保ったまま、`q` を 1 減らして `r` に `other` を足す。この変形が、正しさの根拠になっています。

## まとめ

- 整数の割り算は、0 へ丸めた商と余りを作ってから、符号を見て商を 1 つ調整できる。
- 切り捨ては、余りの符号を除数に合わせる。違うなら商を 1 つ下げる。
- 割り切れるときは、丸め方に関係なく同じ結果になる。
