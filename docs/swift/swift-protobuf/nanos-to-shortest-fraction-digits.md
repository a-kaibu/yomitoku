---
title: "ナノ秒を、0 を省いた最短の小数の桁数で書く"
description: "ナノ秒の値を、3 桁・6 桁・9 桁のうち必要最小限の小数として文字列にする SwiftProtobuf の nanosToString。JSON の Timestamp 表記に使われる。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/TimeUtils.swift
lines: [56, 66]
function: "nanosToString(nanos:)"
difficulty: 2
tags: [日時, 文字列処理]
format: 2
---
## ひとことで

`Timestamp` の秒の小数部分は、ナノ秒（10 億分の 1 秒）で持ちます。JSON に書くときは、`.5` や `.123456` のように、無駄な 0 を省いた短い形にしたいことがあります。この関数は、ナノ秒の値を見て、必要な桁数だけの小数を作ります。

## コード

```swift:line-numbers=56
internal func nanosToString(nanos: Int32) -> String {
    if nanos == 0 {
        return ""
    } else if nanos % 1_000_000 == 0 {
        return ".\(threeDigit(abs(nanos) / 1_000_000))"
    } else if nanos % 1000 == 0 {
        return ".\(sixDigit(abs(nanos) / 1000))"
    } else {
        return ".\(nineDigit(abs(nanos)))"
    }
}
```

## 前提知識

- **ナノ秒**: 1 秒の 10 億分の 1 です。小数で書くと、9 桁の小数部分になります。
- **ミリ秒・マイクロ秒**: 1 秒の 1000 分の 1 がミリ秒（3 桁）、100 万分の 1 がマイクロ秒（6 桁）です。
- **`%` による倍数の判定**: `nanos % 1_000_000 == 0` は、ナノ秒がミリ秒単位でちょうど割り切れるかを表します。
- **文字列の補間**: `".\(...)"` のように、値を文字列の中に埋め込む書き方です。

## 何をしているか

### 1. ゼロなら、小数部分を書かない

ナノ秒が 0 なら、小数の部分は空の文字列にします。

```swift:line-numbers=57
    if nanos == 0 {
        return ""
```
### 2. ミリ秒単位でそろうなら、3 桁で書く

100 万で割り切れるなら、ミリ秒の値を 3 桁の小数にします。たとえば 0.5 秒は `.500` になります。

```swift:line-numbers=59
    } else if nanos % 1_000_000 == 0 {
        return ".\(threeDigit(abs(nanos) / 1_000_000))"
```
### 3. マイクロ秒単位でそろうなら、6 桁で書く

1000 で割り切れるなら、マイクロ秒の値を 6 桁の小数にします。

```swift:line-numbers=61
    } else if nanos % 1000 == 0 {
        return ".\(sixDigit(abs(nanos) / 1000))"
```
### 4. それ以外は、9 桁で書く

どの単位にもそろわないときは、ナノ秒そのものを 9 桁の小数にします。

```swift:line-numbers=63
    } else {
        return ".\(nineDigit(abs(nanos)))"
    }
```
## ここがすごい

- **最短の桁数を選ぶ**: 0 が並ぶ末尾を、割り切れるかどうかで判定しています。小さい単位から順に調べるのではなく、大きい単位から判定して、短い形を優先しています。
- **割り算と余りだけで判定**: 文字列を切り詰めたり、末尾を探したりしません。数の性質で決めるので、速く、分かりやすい処理です。
- **負の値も `abs` で扱う**: 符号は、呼び出し側で扱う前提にして、桁数の計算だけを行っています。

## まとめ

- ナノ秒が 0 なら、小数を付けない。
- 1 ミリ秒、1 マイクロ秒で割り切れれば、3 桁か 6 桁の小数にする。
- それ以外は、9 桁の小数で、正確に書く。
