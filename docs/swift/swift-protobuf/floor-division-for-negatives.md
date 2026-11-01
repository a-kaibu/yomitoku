---
title: "負の数でも、小さい方へ丸めた商を求める"
description: "Swift の / は 0 方向へ切り捨てる。SwiftProtobuf の div は、負の数でも数学の商（小さい方への丸め）になるように補正する。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/MathUtils.swift
lines: [41, 44]
function: "div(_:_:)"
difficulty: 2
tags: [数値計算, アルゴリズム]
format: 2
---
## ひとことで

`-7` を `3` で割るとき、数学では商は `-3` です（`-2.33` を小さい方へ丸めた値）。しかし Swift の `/` は、0 の方向へ切り捨てて `-2` を返します。この関数は、負の数でも数学の商になるように調整します。

## コード

```swift:line-numbers=41
internal func div<T: SignedInteger>(_ a: T, _ b: T) -> T {
    assert(b > 0)
    return a >= 0 ? a / b : (a + 1) / b - 1
}
```

## 前提知識

- **切り捨ての方向**: Swift の整数の `/` は、0 に近づく方向へ切り捨てます。`-7 / 3` は `-2` になります。
- **床関数（floor）**: 実数を、それ以下で最も大きい整数に丸める関数です。`-2.33` の床は `-3` です。
- **商と余りの関係**: 数学では「被除数 = 除数 × 商 + 余り」が成り立つように、商と余りを決めます。余りを 0 以上に保つと、商もこの式に合わせて決まります。
- **`assert`**: 除数が正であることを、開発中に確かめる文です。

## 何をしているか

### 1. 0 以上なら、普通の割り算でよい

非負の数では、0 への切り捨てと床関数の結果が同じです。そのまま `a / b` を返します。

```swift:line-numbers=42
    assert(b > 0)
    return a >= 0 ? a / b : (a + 1) / b - 1
```
### 2. 負の数は、1 を足してから割り、1 を引く

負の数では、`a + 1` を割ってから 1 を引きます。たとえば `-7` は `(-6) / 3 - 1` となり、`-2 - 1` で `-3` になります。割り切れる `-6` は `-2` です。

```swift:line-numbers=43
    return a >= 0 ? a / b : (a + 1) / b - 1
```
## ここがすごい

- **条件は 1 つ**: `a >= 0` だけで、2 通りの計算を選べます。割り算の結果を後から直すより、分かりやすい形です。
- **式で床関数を作っている**: 1 を足してから割って 1 を引く変形で、切り捨てを床関数の動きに変えています。
- **除数を正に限る**: 除数が負のときは、この式の前提が崩れるので、`assert` で止めています。

## まとめ

- Swift の `/` は、0 の方向へ切り捨てる。
- 負の被除数は、1 を足してから割り、1 を引くと床関数の商になる。
- 除数は正の場合に限って使う。
