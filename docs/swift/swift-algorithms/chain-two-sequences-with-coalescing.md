---
title: "前の列が終わったら、次の列へ移る"
description: "swift-algorithms の chain(_:) で、2 つの列を 1 つにつなぐイテレータの next()。Optional の ?? で、前の列が尽きたときだけ次の列を読む。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Chain.swift
lines: [46, 47]
function: "Chain2Sequence.Iterator.next()"
difficulty: 1
tags: [イテレータ, 遅延評価]
format: 2
---
## ひとことで

2 つの列を、前から順に続けて読みたいことがあります。たとえば `[1, 2]` と `[3, 4]` を「1, 2, 3, 4」として扱うような場合です。この関数は、1 つ目の列を読み切ってから、2 つ目の列を読みます。

## コード

```swift:line-numbers=46
    public mutating func next() -> Base1.Element? {
      iterator1.next() ?? iterator2.next()
```

## 前提知識

- **`Sequence` と `IteratorProtocol`**: 列は要素を順に渡せるもの、イテレータはその順番を 1 つずつ進める仕組みです。
- **`??`（nil 合体演算子）**: 左の値が nil でなければ左の値を、nil なら右の値を使う演算子です。
- **遅延評価**: 値を先にすべて作らず、要求されたときに 1 つずつ取り出す方法です。

## 何をしているか

### 1. 1 つ目の列から、次の要素を取り出す

まず `iterator1.next()` を呼びます。1 つ目の列にまだ要素があれば、その値が返ります。

```swift:line-numbers=47
      iterator1.next() ?? iterator2.next()
```
### 2. 1 つ目が尽きたら、2 つ目の列を読む

1 つ目が nil を返したときだけ、`??` の右側にある `iterator2.next()` が呼ばれます。2 つ目の列から値が返れば、それがそのまま結果になります。

```swift:line-numbers=46
    public mutating func next() -> Base1.Element? {
      iterator1.next() ?? iterator2.next()
```
## ここがすごい

- **1 行で切り替える**: 「前が終わったら後へ」という判断を、`??` の 1 つで表しています。
- **順番を守る**: 1 つ目の列の要素は、すべて 2 つ目より先に返ります。
- **2 つの列を作り直さない**: 元の列はコピーされず、そのまま読まれます。

## まとめ

- 1 つ目の列を先に読む。
- 1 つ目が尽きた瞬間に、2 つ目の列を読む。
- `??` の 1 行で、2 つの列を前後につなげる。
