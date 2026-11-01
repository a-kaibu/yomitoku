---
title: "0 から上限未満の乱数を、偏りなく掛け算で作る"
description: "乱数生成器から、0 以上 upperBound 未満の一様な乱数を作る next(upperBound:)。Lemire の方法で、掛け算の上位を使い、割り算と偏りを最小限にする。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Random.swift
lines: [103, 119]
function: "RandomNumberGenerator.next(upperBound:)"
difficulty: 3
tags: [乱数, 数値計算, 最適化]
format: 2
---
## ひとことで

`Int.random(in: 0..<6)` のように、0 から 5 のどれかを等しい確率で選ぶ乱数は、内部でこの関数を使って作られます。乱数生成器が出すのは、0 から 2^64 - 1 までの大きな乱数です。これを 0 から 5 の範囲に縮めるとき、素直に剰余（`% 6`）をとると、わずかに偏りが出ます。この関数は、Daniel Lemire が考えた方法で、偏りをなくしながら割り算もほとんど使いません。

## コード

::: code-group

```swift:line-numbers=103 [日本語訳]
  public mutating func next<T: FixedWidthInteger & UnsignedInteger>(
    upperBound: T
  ) -> T {
    _precondition(upperBound != 0, "upperBound cannot be zero.")
    // 区間の中の整数を生成するために、Lemire の「ほぼ割り算なし」の方法を使います。
    // 詳しい説明は、次の論文にあります。
    // 論文の参照先は、arXiv の 1805.10941 です。
    var random: T = next()
    var m = random.multipliedFullWidth(by: upperBound)
    if m.low < upperBound {
      let t = (0 &- upperBound) % upperBound
      while m.low < t {
        random = next()
        m = random.multipliedFullWidth(by: upperBound)
      }
    }
    return m.high
```

```swift:line-numbers=103 [原文]
  public mutating func next<T: FixedWidthInteger & UnsignedInteger>(
    upperBound: T
  ) -> T {
    _precondition(upperBound != 0, "upperBound cannot be zero.")
    // We use Lemire's "nearly divisionless" method for generating random
    // integers in an interval. For a detailed explanation, see:
    // https://arxiv.org/abs/1805.10941
    var random: T = next()
    var m = random.multipliedFullWidth(by: upperBound)
    if m.low < upperBound {
      let t = (0 &- upperBound) % upperBound
      while m.low < t {
        random = next()
        m = random.multipliedFullWidth(by: upperBound)
      }
    }
    return m.high
```

:::

## 前提知識

- **`FixedWidthInteger & UnsignedInteger`**: 固定ビット幅で符号なしの整数型です。`UInt8`、`UInt32`、`UInt64` などが当てはまります。
- **`multipliedFullWidth(by:)`**: 掛け算の結果を、桁あふれさせずに 2 倍の幅で返します。64 ビット同士なら、128 ビットの結果を上位と下位に分けて返します。
- **`_precondition`**: 条件が偽ならプログラムを止めます。上限 0 は意味がないので禁止しています。
- **`0 &- upperBound`**: 符号なし整数で 0 から引くと、回り込んで `2^64 - upperBound` になります。
- **剰余による偏り**: 0 から 7 の 8 通りの乱数を `% 3` すると、0 と 1 は 3 回ずつ、2 は 2 回しか出ません。全体の数が上限で割り切れないと偏ります。

## 何をしているか

説明のため、`T` が 3 ビット（0 から 7 の 8 通り）、`upperBound` が 3 だとして追います。

### 1. 乱数を掛けて、上位の部分を候補にする

乱数 `random` に上限を掛けると、結果は 0 から 21 の範囲になります。これを 3 ビットずつに分けたとき、上位の部分（`m.high`）が答えの候補です。上位は 0 から 2 のどれかになり、0 から 7 を 3 つに等分して、どこに落ちたかを見ているのと同じです。

```swift:line-numbers=110
    var random: T = next()
    var m = random.multipliedFullWidth(by: upperBound)
```
### 2. 偏りが出るかを確かめる

下位の部分（`m.low`）が上限より小さければ、偏りの恐れがあるかもしれません。そのときだけ、後の計算が必要です。

```swift:line-numbers=112
    if m.low < upperBound {
      let t = (0 &- upperBound) % upperBound
```
### 3. 偏りが出る場合だけ捨てて引き直す

8 通りを 3 つに分けると、2 通りぶんが余ります。この余りに当たる乱数は捨てて、引き直します。捨てるべき個数は `(8 - 3) % 3 = 2` です。ほとんどの場合は、この割り算を実行しません。

```swift:line-numbers=114
      while m.low < t {
        random = next()
        m = random.multipliedFullWidth(by: upperBound)
      }
```
### 4. 上位を返す

偏りのない候補として残った、上位の部分を返します。

```swift:line-numbers=119
    return m.high
```
## ここがすごい

- **割り算は遅い**: 64 ビットの割り算は、掛け算の数倍から十数倍の時間がかかります。素直な方法は毎回割り算をしますが、この関数は、割り算を実行する条件を、ほとんどの場合で通らないように組んでいます。
- **掛け算の上位で範囲に縮める**: 0 から 2^64 - 1 を、上限を掛けて上位を取るだけで、0 から上限 - 1 に縮められます。剰余を使わずに範囲が決まるのが、この方法の要点です。
- **偏りの原因を取り除く**: 余りに当たる乱数を捨てるので、結果は一様になります。捨てる確率は小さく、引き直しの回数もわずかです。

## まとめ

- 乱数に上限を掛けて、上位を取ると、範囲に縮められる。
- 偏りが出る恐れがあるときだけ、余りの部分を捨てて引き直す。
- 割り算を、ほとんどの場合で省ける。
