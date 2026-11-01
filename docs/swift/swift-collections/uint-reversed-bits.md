---
title: "6 回のシフトで 64 ビットの並びを逆にする"
description: "UInt の全ビットを逆順に並べ替える関数。ビット列を 32、16、8 ビットずつの区画に分けて、区画どうしを入れ替えるのを繰り返す。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2022 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/InternalCollectionsUtilities/IntegerTricks/UInt+reversed.swift
lines: [14, 29]
function: "UInt._reversed"
difficulty: 3
tags: [ビット演算, アルゴリズム, ハック]
format: 2
---
## ひとことで

`_reversed` は、`UInt` のビットを左右逆に並べ替えて返します。たとえば 8 ビットの `0b0000_0001` は `0b1000_0000` になります。
ビット列を逆順にする素朴な方法はループで 1 ビットずつ移すことですが、この関数はビット列を半分ずつに分けて入れ替えるのを繰り返すことで、少ない回数で済ませています。

## コード

::: code-group

```swift:line-numbers=14 [日本語訳]
extension UInt {
  @inlinable
  package var _reversed: UInt {
    // https://graphics.stanford.edu/~seander/bithacks.html#ReverseParallel （Bit Twiddling Hacks の Reverse Parallel）
    var shift: UInt = UInt(UInt.bitWidth)
    var mask: UInt = ~0;
    var result = self
    while true {
      shift &>>= 1
      guard shift > 0 else { break }
      mask ^= mask &<< shift
      result = ((result &>> shift) & mask) | ((result &<< shift) & ~mask)
    }
    return result
  }
}
```

```swift:line-numbers=14 [原文]
extension UInt {
  @inlinable
  package var _reversed: UInt {
    // https://graphics.stanford.edu/~seander/bithacks.html#ReverseParallel
    var shift: UInt = UInt(UInt.bitWidth)
    var mask: UInt = ~0;
    var result = self
    while true {
      shift &>>= 1
      guard shift > 0 else { break }
      mask ^= mask &<< shift
      result = ((result &>> shift) & mask) | ((result &<< shift) & ~mask)
    }
    return result
  }
}
```

:::

## 前提知識

- **`UInt`**: 符号なしの整数型です。環境によって 32 または 64 ビットです。
- **`~0`**: すべてのビットが 1 の値です。
- **`^=`**: ビットの XOR を取って代入します。
- **`&>>=` / `&<<=`**: オーバーフローを検査しないシフトを、代入つきで行います。
- **`while true` と `break`**: 無限ループを、条件で抜けるための書き方です。

## 何をしているか

```swift:line-numbers=18
    var shift: UInt = UInt(UInt.bitWidth)
    var mask: UInt = ~0;
```
### 区画の大きさを決める

`shift` は `bitWidth`（64）から始めます。ループの中で毎回 1 ずつ半分にしていくので、`32`、`16`、`8`、`4`、`2`、`1` の順に区画の大きさが変わります。

### マスクを作る

`mask` はちょうど区画の境目の形になります。`mask ^= mask << shift` で、たとえば `shift = 32` なら、上位 32 ビットと下位 32 ビットを区切るパターンになります。

```swift:line-numbers=21
    while true {
      shift &>>= 1
      guard shift > 0 else { break }
      mask ^= mask &<< shift
```
### 区画どうしを入れ替える

次の 1 行が、区画の入れ替えです。

@@L 25@@`mask` で指定した側を右へ、反対側を左へずらして、OR で合わせます。

`shift = 32` の 1 周目は、上位 32 ビットと下位 32 ビットが入れ替わります。次の `shift = 16` では、その中で 16 ビットずつが入れ替わります。これを 1 ビットまで繰り返すと、全体が逆順になります。

## ここがすごい

- **ループは 6 回だけ**: 64 ビットなら 6 回の入れ替えで済みます。1 ビットずつ移す方法は 64 回かかります。
- **同じ式を使い回す**: 区画の大きさが変わっても、式の形は同じです。マスクだけを作り直すので、コードが短くなります。
- **出典が明記されている**: 冒頭のコメントに、Sean Anderson の Bit Twiddling Hacks の「Reverse Parallel」へのリンクがあります。有名なビットハックのお手本です。

## まとめ

- ビット列の反転は、区画を半分ずつ入れ替えるとログの回数で済む。
- マスクと、左右へのシフトと OR で入れ替えを 1 行で書ける。
- 有名なビットハックには、出典へのリンクを残しておく。
