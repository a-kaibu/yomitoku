---
title: "nil を飛ばして、次の値だけを返す"
description: "swift-algorithms の compacted() が、途中の nil を読み飛ばして次の値を返すイテレータの next()。while let と continue の組み合わせを見る。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Compacted.swift
lines: [34, 41]
function: "CompactedSequence.Iterator.next()"
difficulty: 1
tags: [イテレータ, アルゴリズム]
format: 2
---
## ひとことで

`[1, nil, 2, nil, 3]` のような配列から、nil を除いて 1, 2, 3 だけを順に取り出したいことがあります。この関数は、元の配列を 1 つずつ読み、nil なら次へ進み、値があればそれを返します。

## コード

```swift:line-numbers=34
    @inlinable
    public mutating func next() -> Element? {
      while let wrapped = base.next() {
        guard let some = wrapped else { continue }
        return some
      }
      return nil
    }
```

## 前提知識

- **`Optional`（オプショナル）**: 値があるか、nil（何もない）かを表す型です。`Int?` は Int の値か nil のどちらかです。
- **`IteratorProtocol`**: `next()` を呼ぶたびに 1 つずつ要素を返す仕組みです。値がなくなったら nil を返します。
- **`while let`**: 値が nil でない間だけ、ループの中身を実行します。
- **`guard let ... else { continue }`**: 条件を満たさなければ、そのループの残りを飛ばして次の周回へ進みます。

## 何をしているか

### 1. 元の列から、次の要素を取り出す

`while let` で、元の列から要素を取り出し続けます。元の列が終われば、ループを抜けます。

```swift:line-numbers=36
      while let wrapped = base.next() {
```
### 2. nil なら、次の要素へ進む

取り出した要素の中身が nil なら、`continue` で次の周回に進みます。ここで nil は捨てられます。

```swift:line-numbers=37
        guard let some = wrapped else { continue }
```
### 3. 値があれば、それを返す

中身があれば、その値を `return` します。戻り値の型は `Element` なので、nil の包みが外れた値になります。

```swift:line-numbers=38
        return some
```
### 4. 元の列が終わったら、nil を返す

ループを抜けたら、もう返す値がないので `nil` を返します。これで、すべての値を取り出し終わったことを伝えます。

```swift:line-numbers=40
      return nil
```
## ここがすごい

- **配列を作り直さない**: `compactMap` のように新しい配列を作るのではなく、読むたびに 1 つずつ判断します。大きな列でも、余分なメモリをほとんど使いません。
- **`continue` で読み飛ばす**: nil を見つけたら、ループを続けるだけです。条件分岐を重ねずに済みます。
- **遅延評価**: 値は要求されたときに取り出されます。全部を先に計算しません。

## まとめ

- 元の列から 1 つずつ要素を読む。
- nil なら `continue` で飛ばし、値があればそれを返す。
- 元の列が終わったら nil を返して、終わりを知らせる。
