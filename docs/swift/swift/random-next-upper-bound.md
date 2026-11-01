---
title: "ほぼ割り算なしで偏りのない乱数を作る Lemire の方法"
description: "0 から上限未満までの一様な乱数を作る関数。128 ビットの掛け算の上半分を答えに使い、偏りが出る可能性があるときだけ割り算をする。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Random.swift
lines: [102, 120]
function: "RandomNumberGenerator.next(upperBound:)"
difficulty: 3
tags: [乱数, アルゴリズム, 数値計算, 最適化, 標準ライブラリ]
---
## ひとことで

`Int.random(in: 0..<6)` のように「0〜5 のどれかを等しい確率で」という乱数は、内部でこの関数を使って作られます。
乱数生成器が出すのは 0〜2^64−1 の大きな乱数です。これを 0〜5 に縮めるとき、素直に `random % 6` とすると **わずかに偏り** が出ます。この関数は Daniel Lemire が考案した「ほぼ割り算なし（nearly divisionless）」の方法で、偏りを出さずに、しかもほとんどの場合割り算をせずに答えを出します。

## コード

```swift:line-numbers=102
  @inlinable
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
  }
```

## 前提知識

- **`<T: FixedWidthInteger & UnsignedInteger>`**: `T` は「固定ビット幅」かつ「符号なし」の整数型（`UInt8`, `UInt32`, `UInt64` など）です。`&` は 2 つのプロトコルを両方満たすことを表します。
- **`next()`**: 乱数生成器から `T` 型の乱数を 1 つもらいます。
- **`multipliedFullWidth(by:)`**: 掛け算の結果を、桁あふれさせずに 2 倍の幅で返します。64 ビット × 64 ビットなら 128 ビットの結果を、上位 64 ビット（`high`）と下位 64 ビット（`low`）に分けて返します。
- **`_precondition`**: 条件が偽ならプログラムを止めます。上限 0 は意味がないので禁止しています。
- **`0 &- upperBound`**: 符号なし整数で 0 から引くと回り込んで `2^64 - upperBound` になります。
- **剰余による偏り**: 0〜7 の乱数（8 通り）を `% 3` すると、0 と 1 は 3 回ずつ、2 は 2 回しか出ません。全体の数が上限で割り切れないと偏るのです。

## 何をしているか

説明のため、`T` が 3 ビット（0〜7 の 8 通り）、`upperBound = 3` だとして追います。

### 1. 掛けて上半分を取る（110〜111、119 行目）

乱数 `random`（0〜7）に 3 を掛けると、結果は 0〜21 です。これを 3 ビット単位の上半分（`high` = 結果 ÷ 8）と下半分（`low` = 結果 % 8）に分けます。

`high` は 0〜2 のどれかになります。これが答えの候補です。`random / 8 × 3` を整数で計算しているのと同じで、0〜7 の範囲を 3 つに等分して「どこに落ちたか」を見ています。

### 2. 偏りが出る場合だけ捨てる（112〜118 行目）

8 通りを 3 つに分けると、2 通りぶん余ります。この余りに当たる `random` は捨てて引き直す必要があります。

- `t = (8 - 3) % 3 = 2` が「捨てるべき個数」です（113 行目）。
- `low < t` のとき、その `random` は余りの部分に当たっているので、引き直します（114〜117 行目）。

ポイントは 112 行目です。`low < upperBound` でなければ、`low < t` も必ず偽です（`t < upperBound` だから）。つまり、**ほとんどの場合は 113 行目の割り算そのものを実行しません。**

## ここがすごい

- **割り算は遅い**: CPU にとって 64 ビットの割り算は、掛け算の数倍〜十数倍の時間がかかります。素直な方法（拒否サンプリング＋`%`）は毎回割り算をしますが、この方法は `upperBound` が 2^64 よりずっと小さいとき、割り算をする確率がほぼ 0 です。
- **偏りがゼロ**: `random % upperBound` は手軽ですが、上限が大きいと偏りが無視できなくなります。たとえば上限が 2^63 + 1 くらいだと、ある値は他の 2 倍出やすくなります。この方法は必要なときだけ引き直すので、すべての値が厳密に同じ確率になります。
- **出典の明記**: 107〜109 行目に、論文（arXiv:1805.10941）へのリンクがあります。巧妙なアルゴリズムほど、根拠をたどれることが大切です。

## まとめ

- `random % n` は、乱数の範囲が `n` で割り切れないと偏る。
- 「掛け算の上半分」を使うと、割り算なしで範囲を縮められる。
- 偏りが出る可能性があるときだけ高価な計算をする、という条件の付け方が速さの秘訣。
