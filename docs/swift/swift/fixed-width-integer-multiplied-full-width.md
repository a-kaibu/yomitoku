---
title: "半分ずつに割って掛ける、筆算式の 2 倍幅の掛け算"
description: "64 ビット同士の掛け算を、桁あふれさせずに 128 ビットの結果として返す関数のジェネリック版。各数を上下 2 つに分け、小学校の筆算と同じ要領で部分積を足し合わせる。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2024 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Integers.swift
lines: [2580, 2636]
function: "FixedWidthInteger.multipliedFullWidth(by:)"
difficulty: 3
tags: [数値計算, ビット演算, ジェネリクス, 標準ライブラリ]
---
## ひとことで

64 ビット同士を掛けると、結果は最大 128 ビットになります。`multipliedFullWidth(by:)` は、その結果を上位（`high`）と下位（`low`）の 2 つに分けて返すメソッドです。
多くの CPU には 2 倍幅の掛け算命令がありますが、ない場合（32 ビット CPU での `Int64` など）のために、この汎用版があります。中身は **小学校で習う掛け算の筆算** そのものです。

## コード

```swift:line-numbers=2580
  //
  // This implementation is mainly intended for [U]Int64 on 32b platforms. It
  // will not be especially efficient for other types that do not provide their
  // own implementation, but neither will it be catastrophically bad. It can
  // surely be improved on even for Int64, but that is mostly an optimization
  // problem; the basic algorithm here gives the compiler all the information
  // that it needs to generate efficient code.
  @export(implementation)
  public func multipliedFullWidth(by other: Self) -> (high: Self, low: Magnitude) {
    // We define a utility function for splitting an integer into high and low
    // halves. Note that the low part is always unsigned, while the high part
    // matches the signedness of the input type. Both result types are the
    // full width of the original number; this may be surprising at first, but
    // there are two reasons for it:
    //
    // - we're going to use these as inputs to a multiplication operation, and
    //   &* is quite a bit less verbose than `multipliedFullWidth`, so it makes
    //   the rest of the code in this function somewhat easier to read.
    //
    // - there's no "half width type" that we can get at from this generic
    //   context, so there's not really another option anyway.
    //
    // Fortunately, the compiler is pretty good about propagating the necessary
    // information to optimize away unnecessary arithmetic.
    func split<T: FixedWidthInteger>(_ x: T) -> (high: T, low: T.Magnitude) {
      let n = T.bitWidth/2
      return (x >> n, T.Magnitude(truncatingIfNeeded: x) & ((1 &<< n) &- 1))
    }
    // Split `self` and `other` into high and low parts, compute the partial
    // products carrying high words in as we go. We use the wrapping operators
    // and `truncatingIfNeeded` inits purely as an optimization hint to the
    // compiler; none of these operations will ever wrap due to the constraints
    // on the arithmetic. The bounds are documented before each line for signed
    // types. For unsigned types, the bounds are much more well known and
    // easier to derive, so I haven't bothered to document them here, but they
    // all boil down to the fact that a*b + c + d cannot overflow a double-
    // width result with unsigned a, b, c, d.
    let (x1, x0) = split(self)
    let (y1, y0) = split(other)
    // If B is 2^bitWidth/2, x0 and y0 are in 0 ... B-1, so their product is
    // in 0 ... B^2-2B+1. For further analysis, we'll need the fact that
    // the high word is in 0 ... B-2.
    let p00 = x0 &* y0
    // x1 is in -B/2 ... B/2-1, so the product x1*y0 is in
    // -(B^2-B)/2 ... (B^2-3B+2)/2; after adding the high word of p00, the
    // result is in -(B^2-B)/2 ... (B^2-B-2)/2.
    let p01 = x1 &* Self(y0) &+ Self(split(p00).high)
    // The previous analysis holds for this product as well, and the sum is
    // in -(B^2-B)/2 ... (B^2-B)/2.
    let p10 = Self(x0) &* y1 &+ Self(split(p01).low)
    // No analysis is necessary for this term, because we know the product as
    // a whole cannot overflow, and this term is the final high word of the
    // product.
    let p11 = x1 &* y1 &+ split(p01).high &+ split(p10).high
    // Now we only need to assemble the low word of the product.
    return (p11, split(p10).low << (bitWidth/2) | split(p00).low)
  }
```

## 前提知識

- **関数の中の関数**: 2604〜2607 行目の `split` は、関数の中で定義された小さな関数（ネスト関数）です。外からは見えません。
- **`T.Magnitude`**: 型 `T` の絶対値を表す符号なしの型です。
- **`&*` / `&+`**: オーバーフローを検査しない掛け算・足し算です。
- **`>>` / `<<`**: 右シフト・左シフトです。符号付きの値の右シフトでは、符号ビットがコピーされます（負の数は負のまま）。
- **`(x >> n, ...)`**: タプルで 2 つの値を返しています。
- **筆算の仕組み**: 2 桁 × 2 桁、たとえば 23 × 45 は、(20 + 3) × (40 + 5) = 20×40 + 20×5 + 3×40 + 3×5 と 4 つの部分積に分けて足します。

## 何をしているか

説明のため、10 進数の 2 桁 × 2 桁で考えます（実際は「1 桁」が 32 ビットです）。`23 × 45` を計算します。

### 1. 上下に分ける（2604〜2607、2617〜2618 行目）

`split` で `x1 = 2, x0 = 3`、`y1 = 4, y0 = 5` に分けます。上位はシフト、下位はマスクで取り出します。

### 2. 下の桁から部分積を足す（2622〜2633 行目）

- `p00 = x0 × y0 = 3 × 5 = 15`。下の桁 `5`、繰り上がり `1`。
- `p01 = x1 × y0 + 繰り上がり = 2 × 5 + 1 = 11`。
- `p10 = x0 × y1 + p01 の下の桁 = 3 × 4 + 1 = 13`。下の桁 `3` が結果の 2 桁目です。
- `p11 = x1 × y1 + p01 の上の桁 + p10 の上の桁 = 2 × 4 + 1 + 1 = 10`。これが結果の上位です。

### 3. 組み立てる（2635 行目）

上位は `p11 = 10`、下位は「`p10` の下の桁」と「`p00` の下の桁」を並べた `35`。結果は `10|35`、つまり 1035 です（23 × 45 = 1035）。

## ここがすごい

- **どの途中結果もあふれない**: 半分の幅の数どうしの積は、元の幅に必ず収まります。さらに繰り上がりを足しても収まることが、2619〜2629 行目のコメントで **値の範囲を使って証明** されています。符号付きの場合も含めて丁寧に範囲を書いているのは、標準ライブラリならではの厳密さです。
- **「半分の型」がなくても書ける**: ジェネリックな文脈では「64 ビットの半分の 32 ビット型」を取り出せません。コメント（2599〜2600 行目）にあるように、同じ幅の型のまま上位・下位を扱っています。計算に使わない上半分は常に 0 なので、コンパイラが無駄を消してくれます。
- **ラップ演算は最適化のヒント**: `&*` や `&+` を使っていますが、実際にはあふれません（2609〜2612 行目のコメント）。「あふれチェックは不要」とコンパイラに伝えて、余計な検査の命令を消すための書き方です。

## まとめ

- 2 倍幅の掛け算は、数を上下半分に分けて筆算と同じように部分積を足せば作れる。
- 途中の値があふれないことを、値の範囲を見積もって確かめる。
- `&*` / `&+` は「あふれない」とわかっているときに、チェックを省くヒントとしても使える。
