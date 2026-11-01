---
title: "ビット集合の部分集合かを、64 個ずつの語で一括に確かめる"
description: "BitSet の isSubset(of:) を、各語の差集合が空かどうかで判定する実装。要素を 1 つずつ比べず、64 要素ずつまとめて調べる。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/BitCollections/BitSet/BitSet+SetAlgebra isSubset.swift
lines: [37, 53]
function: "BitSet.isSubset(of:)"
difficulty: 2
tags: [データ構造, ビット演算, アルゴリズム]
format: 2
---
## ひとことで

集合 A の要素がすべて集合 B にもあるとき、A は B の部分集合です。`BitSet` は、整数の集合をビットで表すので、64 個の要素を 1 つの語にまとめて、語ごとに比べられます。この関数は、その性質を使って部分集合かを判定します。

## コード

```swift:line-numbers=37
  public func isSubset(of other: BitSet) -> Bool {
    unsafe self._read { first in
      unsafe other._read { second in
        let w1 = unsafe first._words
        let w2 = unsafe second._words
        if w1.count > w2.count {
          return false
        }
        for i in 0 ..< w1.count {
          if unsafe !w1[i].subtracting(w2[i]).isEmpty {
            return false
          }
        }
        return true
      }
    }
  }
```

## 前提知識

- **`BitSet`**: 0 から始まる整数の集合を、ビットの並びで表すデータ構造です。ある整数が含まれるなら、その位置のビットが 1 になります。
- **語（word）**: 64 ビットの整数で、64 個分の要素の有無を表します。`BitSet` は、語の配列として中身を持ちます。
- **差集合**: `w1.subtracting(w2)` は、`w1` にあって `w2` にない要素の集まりです。その結果が空なら、`w1` は `w2` に含まれています。
- **`unsafe` と `_read`**: 内部の配列に、安全な形で素早くアクセスするための書き方です。

## 何をしているか

### 1. 語の数で、すぐに判定できる場合を先に扱う

自分の語の数が相手より多ければ、相手にない大きな要素を持っています。そのため、部分集合ではありません。

```swift:line-numbers=40
        let w1 = unsafe first._words
        let w2 = unsafe second._words
        if w1.count > w2.count {
          return false
        }
```
### 2. 語ごとに、差集合が空かを調べる

各語について、自分の要素のうち相手にないものを求めます。1 つでも残れば、部分集合ではありません。

```swift:line-numbers=45
        for i in 0 ..< w1.count {
          if unsafe !w1[i].subtracting(w2[i]).isEmpty {
            return false
          }
        }
```
### 3. すべて空なら、部分集合

どの語でも差が出なければ、すべての要素が相手に含まれています。

```swift:line-numbers=50
        return true
```
## ここがすごい

- **64 個ずつまとめて比べる**: 要素を 1 つずつ見る代わりに、語単位で比べます。要素の数が多くても、比較の回数は語の数だけです。
- **差集合の形で書く**: 「相手にない要素があるか」を、差集合が空かどうかに置き換えています。条件の書き方が、ひとつにまとまります。
- **早く抜ける**: 1 つの語で差が見つかった時点で `false` を返します。残りの語は調べません。

## まとめ

- 語の数が多い側は、部分集合になれない。
- 語ごとに差集合を求め、1 つでも残れば `false` とする。
- 64 要素ずつ比べるので、大きな集合でも速く判定できる。
