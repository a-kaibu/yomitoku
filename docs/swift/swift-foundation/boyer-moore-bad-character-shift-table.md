---
title: "一致しなかった文字から、次に何文字ずらすかを表にしておく"
description: "Boyer-Moore 法の悪い文字の表を作る swift-foundation の関数。各バイトについて、一致しなかったときに何文字ずらせるかを前もって計算する。"
language: swift
project: "Swift Foundation"
repo: https://github.com/swiftlang/swift-foundation
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2025 Apple Inc. and the Swift project authors"
commit: "aff1e7f822dc1655deeee887f9661a9b8d032703"
file: Sources/FoundationEssentials/Data/Data+Searching+BoyerMoore.swift
lines: [100, 116]
function: "_computeBadCharacterShift(for:backwards:into:)"
difficulty: 3
tags: [アルゴリズム, 探索, 文字列処理]
format: 2
---
## ひとことで

文字列の中から、別の短い列（針）を探す方法の 1 つが Boyer-Moore 法です。針と比べて一致しなかった文字を見て、一度に大きくずらせるように、ずらす量の表を先に作っておきます。この関数は、その表（悪い文字の表）を作ります。

## コード

::: code-group

```swift:line-numbers=100 [日本語訳]
    @_lifetime(badCharacterShift: copy badCharacterShift)
    private static func _computeBadCharacterShift(
        for needle: Span<UInt8>,
        backwards: Bool,
        into badCharacterShift: inout MutableSpan<Int>
    ) {
        if backwards {
            for i in (0..<needle.count).reversed() {
                // i は 0..<needle.count の範囲にあるので、添字の検査を省いています。
                badCharacterShift[Int(needle[unchecked: i])] = i
            }
        } else {
            for i in 0..<needle.count {
                badCharacterShift[Int(needle[i])] = needle.count - i - 1
            }
        }
    }
```

```swift:line-numbers=100 [原文]
    @_lifetime(badCharacterShift: copy badCharacterShift)
    private static func _computeBadCharacterShift(
        for needle: Span<UInt8>,
        backwards: Bool,
        into badCharacterShift: inout MutableSpan<Int>
    ) {
        if backwards {
            for i in (0..<needle.count).reversed() {
                // i stays within 0..<needle.count, so safe to use the unchecked subscript.
                badCharacterShift[Int(needle[unchecked: i])] = i
            }
        } else {
            for i in 0..<needle.count {
                badCharacterShift[Int(needle[i])] = needle.count - i - 1
            }
        }
    }
```

:::

## 前提知識

- **針（needle）と干し草（haystack）**: 探す短い列を針、探される長い列を干し草と呼びます。
- **バイト**: 0 から 255 までの値を取る、データの最小単位です。表の 256 個の枠は、バイトの値に対応します。
- **`MutableSpan`**: 配列の一部を、コピーせずに書き換えられる参照です。表の書き込みに使われています。
- **`reversed()`**: 範囲を逆順に回す書き方です。後ろから順に値を入れるときに使います。

## 何をしているか

### 1. 順方向の検索では、末尾からの距離を入れる

順方向では、針の各位置 `i` について、そのバイトを見つけたときに「末尾までの距離」をずらす量にします。針の後ろに近い位置ほど、小さい値になります。

```swift:line-numbers=112
            for i in 0..<needle.count {
                badCharacterShift[Int(needle[i])] = needle.count - i - 1
            }
```
### 2. 逆方向の検索では、先頭からの位置を入れる

逆方向では、後ろから順に表を埋めます。同じバイトが複数あるときは、最後に入った値（先頭に近い位置）が残ります。

```swift:line-numbers=106
        if backwards {
            for i in (0..<needle.count).reversed() {
                // i は 0..<needle.count の範囲にあるので、添字の検査を省いています。
                badCharacterShift[Int(needle[unchecked: i])] = i
            }
```
### 3. 表の残りは、針の長さのままにする

この関数の外で、表はすべて針の長さで初期化されています。針にないバイトは、針の長さだけずらせます。

## ここがすごい

- **表は一度だけ作る**: 検索のたびに計算せず、針ごとに 1 回だけ表を作ります。検索の中で何度も使えます。
- **不一致の文字だけで大きくずらせる**: 一致しなかった文字が針にないなら、針の長さ分ずらせます。そのため、長い干し草を速く読み飛ばせます。
- **向きに応じて表を作り分ける**: 順方向と逆方向で、同じ表を別の入れ方で作っています。検索の向きを、1 つの関数で扱えます。

## まとめ

- 針の各バイトについて、一致しなかったときのずらす量を表にする。
- 順方向と逆方向で、表の作り方を変える。
- 針にないバイトは、針の長さ分ずらせるように初期化しておく。
