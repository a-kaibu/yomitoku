---
title: "「キーが初めて出た要素だけ」を残す、重複の取り除き"
description: "配列などから、同じキーの要素を 2 回目以降は捨てて、最初に現れた要素だけを残す関数。Set を使って、見たキーを記録しながら 1 回の走査で済ませる。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Unique.swift
lines: [114, 126]
function: "Sequence.uniqued(on:)"
difficulty: 1
tags: [データ構造, イディオム, 標準ライブラリ]
format: 2
---
## ひとことで

`uniqued(on:)` は、要素から取り出した値（キー）が同じものを、最初の 1 つだけ残して取り除きます。たとえば文字列の配列から、長さが同じものを最初の 1 つだけ残す、といった使い方ができます。
引数の `projection` で、どの値を重複の判定に使うかを決めます。

## コード

```swift:line-numbers=114
  @inlinable
  public func uniqued<Subject: Hashable>(
    on projection: (Element) throws -> Subject
  ) rethrows -> [Element] {
    var seen: Set<Subject> = []
    var result: [Element] = []
    for element in self {
      if seen.insert(try projection(element)).inserted {
        result.append(element)
      }
    }
    return result
  }
```

## 前提知識

- **`Set<Subject>`**: 重複しない値の集合です。`insert` をすると、新しく入ったかどうかが分かります。
- **`inserted`**: `insert` の戻り値のうち、新しく入ったかを表す `Bool` です。
- **`projection`**: 要素からキーを取り出す関数です。
- **`Hashable`**: ハッシュを計算でき、`Set` に入れられる型の条件です。

## 何をしているか

### 1. 見たキーを記録する場所を用意する

`seen` は、ここまでに出てきたキーの集まりです。`result` は、残す要素を順に入れる配列です。

```swift:line-numbers=118
    var seen: Set<Subject> = []
    var result: [Element] = []
```
### 2. 要素を 1 つずつ確かめる

各要素のキーを `seen` に入れます。新しく入ったときだけ、その要素を `result` に加えます。

```swift:line-numbers=120
    for element in self {
      if seen.insert(try projection(element)).inserted {
        result.append(element)
      }
```
### 3. 結果を返す

すべての要素を見終わったら、残った要素を返します。

```swift:line-numbers=125
    return result
```
## ここがすごい

- **1 回の走査で済む**: 要素を 1 回ずつ見るだけで、重複の判定が終わります。キーごとに配列を探し直す方法より、ずっと速くなります。
- **`insert` の戻り値を使う**: 「入っているか調べる」と「入れる」を 2 回に分けず、`insert` の結果だけで判定しています。
- **キーを自由に決める**: 要素そのものではなく、`projection` で取り出した値を使うので、構造体などの複雑な値でも、必要な部分だけで重複を判定できます。

## まとめ

- 重複の除去は、見たキーを集合に記録しながら 1 回の走査で行う。
- `insert` の戻り値を使うと、判定と記録を 1 回で済ませられる。
- 比べる値を `projection` で選べると、要素全体ではなく一部だけで判定できる。
