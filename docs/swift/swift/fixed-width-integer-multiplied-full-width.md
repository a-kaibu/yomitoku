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
format: 2
---
## ひとことで

64 ビット同士を掛けると、結果は最大 128 ビットになります。`multipliedFullWidth(by:)` は、その結果を上位（`high`）と下位（`low`）の 2 つに分けて返すメソッドです。多くの CPU には 2 倍幅の掛け算の命令がありますが、そうでない環境のために、この汎用版があります。中身は、小学校で習う掛け算の筆算そのものです。

## コード

::: code-group

```swift:line-numbers=2580 [日本語訳]
  //
  // 主に 32 ビット環境での [U]Int64 向けの実装です。
  // 専用の実装がない他の型では、効率は良くありませんが、
  // 極端に遅くなるわけでもありません。
  // Int64 でも改善の余地はありますが、それは主に最適化の問題です。
  // ここでの基本のアルゴリズムは、
  // 効率のよいコードを生成するために必要な情報を、コンパイラに与えています。
  @export(implementation)
  public func multipliedFullWidth(by other: Self) -> (high: Self, low: Magnitude) {
    // 整数を上位と下位の半分に分けるユーティリティ関数を定義します。
    // 下位は常に符号なしですが、上位は入力の型と同じ符号を持ちます。
    // どちらの結果も、元の数と同じ全幅になります。
    // 最初は意外に感じるかもしれませんが、
    // 理由は次の 2 つです。
    //
    // - ここで作った値は掛け算の入力になるため、
    //   &* は `multipliedFullWidth` より短く書けて、
    //   この関数の残りを読みやすくします。
    //
    // - 汎用の文脈では「半分の幅の型」を取り出せないため、
    //   ほかに選べる方法がそもそもありません。
    //
    // 幸い、コンパイラは必要な情報を伝えるのが上手で、
    // 不要な計算を消してくれます。
    func split<T: FixedWidthInteger>(_ x: T) -> (high: T, low: T.Magnitude) {
      let n = T.bitWidth/2
      return (x >> n, T.Magnitude(truncatingIfNeeded: x) & ((1 &<< n) &- 1))
    }
    // `self` と `other` を上位と下位に分け、途中で繰り上がりを持ち越しながら、
    // 部分積を計算していきます。ラップ演算と `truncatingIfNeeded` は、
    // コンパイラへの最適化のヒントとしてだけ使っています。
    // 演算の制約のため、実際にはこれらの演算は折り返しません。
    // 各行の前に、符号付きの型の範囲を書いてあります。
    // 符号なしの型では、範囲のほうが分かりやすいので、ここでは書いていません。
    // 範囲は導きやすいので、ここでは書いていません。
    // ただし、どれも符号なしの a, b, c, d について a*b + c + d が
    // 二倍幅の結果を超えないという事実にまとまります。
    let (x1, x0) = split(self)
    let (y1, y0) = split(other)
    // B が 2^(bitWidth/2) のとき、x0 と y0 は 0 から B-1 の範囲にあるので、
    // その積は 0 から B^2-2B+1 の範囲になります。さらに分析するには、
    // 上位の桁が 0 から B-2 の範囲にあるという事実が必要です。
    let p00 = x0 &* y0
    // x1 は -B/2 から B/2-1 の範囲にあるので、積 x1*y0 は
    // -(B^2-B)/2 から (B^2-3B+2)/2 の範囲になります。p00 の上位を足すと、
    // 結果は -(B^2-B)/2 から (B^2-B-2)/2 の範囲です。
    let p01 = x1 &* Self(y0) &+ Self(split(p00).high)
    // 前の分析はこの積にも当てはまり、和は
    // in -(B^2-B)/2 ... (B^2-B)/2.
    let p10 = Self(x0) &* y1 &+ Self(split(p01).low)
    // この項については分析が要りません。
    // 積全体があふれることはなく、この項が積の最終的な上位になります。
    // （上の続きです）
    let p11 = x1 &* y1 &+ split(p01).high &+ split(p10).high
    // ここでは、積の下位の部分だけを組み立てれば十分です。
    return (p11, split(p10).low << (bitWidth/2) | split(p00).low)
  }
```

```swift:line-numbers=2580 [原文]
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

:::

## 前提知識

- **関数の中の関数**: `split` は、関数の中で定義された小さな関数（ネスト関数）です。外からは見えません。
- **`T.Magnitude`**: 型 `T` の絶対値を表す、符号なしの型です。
- **`&*` と `&+`**: 桁あふれを検査しない掛け算と足し算です。
- **`>>` と `<<`**: 右シフトと左シフトです。符号付きの値を右シフトすると、符号ビットがコピーされます。
- **筆算の仕組み**: 2 桁どうしの掛け算、たとえば 23 × 45 は、(20 + 3) × (40 + 5) として 4 つの部分積に分けて足せます。

## 何をしているか

説明のために、10 進数の 2 桁どうしで考えます。実際には、1 つの「桁」が 32 ビットに当たります。`23 × 45` を計算してみましょう。

### 1. 上下に分ける

`split` で、`23` を上位 `2` と下位 `3` に、`45` を上位 `4` と下位 `5` に分けます。上位はシフトで、下位はマスクで取り出します。

```swift:line-numbers=2604
    func split<T: FixedWidthInteger>(_ x: T) -> (high: T, low: T.Magnitude) {
      let n = T.bitWidth/2
      return (x >> n, T.Magnitude(truncatingIfNeeded: x) & ((1 &<< n) &- 1))
    }
```
### 2. 下の桁から部分積を足す

まず `p00 = 3 × 5 = 15` を計算します。下の桁 `5` が結果に残り、繰り上がり `1` が次へ回ります。次に `p01 = 2 × 5 + 1 = 11` と計算します。続けて `p10 = 3 × 4 + 1 = 13` で、下の桁 `3` が結果の 2 桁目になります。最後に `p11 = 2 × 4 + 1 + 1 = 10` が上位になります。

```swift:line-numbers=2609
    // 部分積を計算していきます。ラップ演算と `truncatingIfNeeded` は、
    // コンパイラへの最適化のヒントとしてだけ使っています。
    // 演算の制約のため、実際にはこれらの演算は折り返しません。
    // 各行の前に、符号付きの型の範囲を書いてあります。
    // 符号なしの型では、範囲のほうが分かりやすいので、ここでは書いていません。
    // 範囲は導きやすいので、ここでは書いていません。
    // ただし、どれも符号なしの a, b, c, d について a*b + c + d が
    // 二倍幅の結果を超えないという事実にまとまります。
    let (x1, x0) = split(self)
    let (y1, y0) = split(other)
    // B が 2^(bitWidth/2) のとき、x0 と y0 は 0 から B-1 の範囲にあるので、
    // その積は 0 から B^2-2B+1 の範囲になります。さらに分析するには、
    // 上位の桁が 0 から B-2 の範囲にあるという事実が必要です。
    let p00 = x0 &* y0
    // x1 は -B/2 から B/2-1 の範囲にあるので、積 x1*y0 は
    // -(B^2-B)/2 から (B^2-3B+2)/2 の範囲になります。p00 の上位を足すと、
    // 結果は -(B^2-B)/2 から (B^2-B-2)/2 の範囲です。
```
### 3. 上位と下位を組み立てる

上位は `p11 = 10`、下位は `p10` の下の桁と `p00` の下の桁を並べた `35` です。結果は `10` と `35` を並べた 1035 になり、23 × 45 = 1035 と一致します。

```swift:line-numbers=2626
    let p01 = x1 &* Self(y0) &+ Self(split(p00).high)
    // 前の分析はこの積にも当てはまり、和は
    // in -(B^2-B)/2 ... (B^2-B)/2.
    let p10 = Self(x0) &* y1 &+ Self(split(p01).low)
    // この項については分析が要りません。
    // 積全体があふれることはなく、この項が積の最終的な上位になります。
    // （上の続きです）
    let p11 = x1 &* y1 &+ split(p01).high &+ split(p10).high
    // ここでは、積の下位の部分だけを組み立てれば十分です。
    return (p11, split(p10).low << (bitWidth/2) | split(p00).low)
```
## ここがすごい

- **どの途中結果もあふれない**: 半分の幅の数どうしの積は、元の幅に必ず収まります。繰り上がりを足しても収まることを、コメントで値の範囲を使って確かめています。符号付きの場合まで丁寧に書かれているところが、標準ライブラリらしい厳密さです。
- **半分の型がなくても書ける**: ジェネリックな文脈では、64 ビットの半分の 32 ビット型を取り出せません。そこで、同じ幅の型のまま上位と下位を扱っています。計算に使わない上半分は常に 0 なので、コンパイラが無駄を消してくれます。
- **ラップ演算は最適化のヒント**: `&*` と `&+` を使っていますが、実際にはあふれません。「あふれの検査は要らない」とコンパイラに伝えて、余計な命令を消すための書き方です。

## まとめ

- 2 倍幅の掛け算は、数を上下の半分に分けて、筆算と同じように部分積を足せば作れる。
- 途中の値があふれないことを、値の範囲を見積もって確かめる。
- `&*` と `&+` は、あふれないと分かっているときに検査を省くヒントとして使える。
