---
title: "負の数でも 0 以上になる、正しい余りを求める"
description: "Swift の % は、負の数では負の余りを返す。SwiftProtobuf の mod は、除数が正のとき必ず 0 以上の余りを返すように補正する。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/MathUtils.swift
lines: [28, 32]
function: "mod(_:_:)"
difficulty: 2
tags: [数値計算, アルゴリズム]
format: 2
---
## ひとことで

時刻や周期を扱うとき、「ある数を 60 で割った余り」を、必ず 0 から 59 の間で得たいことがあります。Swift の `%` は、割られる数が負のとき、負の余りを返します。この関数は、その場合に除数を足して、0 以上の余りにそろえます。

## コード

```swift:line-numbers=28
internal func mod<T: SignedInteger>(_ a: T, _ b: T) -> T {
    assert(b > 0)
    let r = a % b
    return r >= 0 ? r : r + b
}
```

## 前提知識

- **割り算の余り**: `a % b` は、`a` を `b` で割った余りです。Swift では、余りの符号は `a` の符号にそろいます。たとえば `-7 % 3` は `-1` です。
- **数学の剰余（modulo）**: 数学では、余りは常に `0` 以上で、`b` より小さい値になるように定めます。こちらが、プログラムの「周期」の計算に向いています。
- **`assert`**: 開発中だけ、条件を確かめる文です。ここでは、除数が正であることを確かめています。
- **`SignedInteger`**: 符号付きの整数型をまとめた条件です。`Int` や `Int64` などに使えます。

## 何をしているか

### 1. 普通の余りを求める

`a % b` で、まず余りを求めます。この段階では、`a` が負なら余りも負になることがあります。

```swift:line-numbers=29
    assert(b > 0)
    let r = a % b
```
### 2. 負なら除数を足して、0 以上にする

余りが 0 以上ならそのまま返します。負なら、除数 `b` を足すことで、0 以上で `b` より小さい値に変えます。

```swift:line-numbers=31
    return r >= 0 ? r : r + b
```
## ここがすごい

- **条件分岐は 1 つだけ**: `r >= 0 ? r : r + b` の 1 行で、正と負の両方に対応しています。
- **結果の範囲が保証される**: 戻り値は、常に `0 <= r < b` です。配列の添字や、時刻の成分に安心して使えます。
- **除数を正に限る**: `assert` で除数を正に限っているので、補正の式が正しく働く前提を明示しています。

## まとめ

- Swift の `%` は、負の被除数に対して負の余りを返す。
- 余りが負なら、除数を足すと 0 以上の余りになる。
- 除数は正であることを前提にする。
