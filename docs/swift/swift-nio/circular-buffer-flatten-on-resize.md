---
title: "リングバッファを広げるとき、要素を先頭から並べ直す"
description: "リングバッファの容量が足りなくなったとき、新しい大きい配列へ要素を先頭から順に詰め直す関数。回り込んでいた要素もつなぎ直し、先頭の添字を 0 に戻す。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2017-2018 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/CircularBuffer.swift
lines: [430, 453]
function: "CircularBuffer._resizeAndFlatten(newCapacity:)"
difficulty: 2
tags: [データ構造, メモリ管理, アルゴリズム]
format: 2
---
## ひとことで

リングバッファは、要素が配列の末尾から先頭へ回り込むことがあります。容量を広げるときは、その回り込みを解いて、要素を新しい配列の先頭から順に詰め直します。
この関数は、大きい配列を作り、要素を先頭から並べ、残りを空（`nil`）で埋めます。最後に、先頭の添字を 0、末尾の添字を要素の数にします。

## コード

```swift:line-numbers=430
    internal mutating func _resizeAndFlatten(newCapacity: Int) {
        var newBacking: ContiguousArray<Element?> = []
        precondition(newCapacity > 0, "Can't change capacity to \(newCapacity)")
        assert(newCapacity % 2 == 0)
        assert(newCapacity > self.capacity)

        newBacking.reserveCapacity(newCapacity)

        if self.tailBackingIndex >= self.headBackingIndex {
            newBacking.append(contentsOf: self._buffer[self.headBackingIndex..<self.tailBackingIndex])
        } else {
            newBacking.append(contentsOf: self._buffer[self.headBackingIndex...])
            newBacking.append(contentsOf: self._buffer[..<self.tailBackingIndex])
        }

        let newTailIndex = newBacking.count
        let paddingCount = newCapacity &- newTailIndex
        newBacking.append(contentsOf: repeatElement(nil, count: paddingCount))

        self._headBackingIndex = 0
        self._tailBackingIndex = newTailIndex
        self._buffer = newBacking
        assert(self.verifyInvariants())
    }
```

## 前提知識

- **先頭と末尾の添字**: `headBackingIndex` は先頭の要素の位置、`tailBackingIndex` は次に入る位置です。`head > tail` のときは、要素が配列の末尾と先頭に分かれています。
- **`ContiguousArray`**: 要素を連続したメモリに置く配列です。
- **`repeatElement`**: 同じ値を、指定した数だけ並べた列を作る関数です。

## 何をしているか

### 1. 新しい配列と、容量を確かめる

広げる先の容量は、今より大きくなければなりません。新しい配列を、その大きさで用意します。

```swift:line-numbers=431
        var newBacking: ContiguousArray<Element?> = []
        precondition(newCapacity > 0, "Can't change capacity to \(newCapacity)")
        assert(newCapacity % 2 == 0)
        assert(newCapacity > self.capacity)

        newBacking.reserveCapacity(newCapacity)
```
### 2. 回り込んでいるかで、場合分けして詰める

末尾が先頭より後ろにあれば、要素は続いて並んでいるので、1 回だけコピーします。末尾が先頭より前にあれば、要素は末尾と先頭に分かれているので、末尾側と先頭側の 2 回に分けてコピーします。

```swift:line-numbers=438
        if self.tailBackingIndex >= self.headBackingIndex {
            newBacking.append(contentsOf: self._buffer[self.headBackingIndex..<self.tailBackingIndex])
        } else {
            newBacking.append(contentsOf: self._buffer[self.headBackingIndex...])
            newBacking.append(contentsOf: self._buffer[..<self.tailBackingIndex])
        }
```
### 3. 残りを空で埋め、添字を整える

詰めた要素の後ろを、新しい容量まで `nil` で埋めます。先頭の添字を 0、末尾の添字を詰めた要素の数にします。

```swift:line-numbers=445
        let newTailIndex = newBacking.count
        let paddingCount = newCapacity &- newTailIndex
        newBacking.append(contentsOf: repeatElement(nil, count: paddingCount))

        self._headBackingIndex = 0
        self._tailBackingIndex = newTailIndex
        self._buffer = newBacking
        assert(self.verifyInvariants())
```
例として、容量 8 で、先頭が位置 6、末尾が位置 2 だとします。要素は、位置 6 と 7 と、位置 0 と 1 の 4 個です。容量を 16 に広げると、位置 0 から 3 に詰め直され、先頭は 0、末尾は 4 になります。

## ここがすごい

- **回り込みを解く**: 回り込んだままでは、添字の計算が複雑になります。広げるときに一度だけ直線の並びにしておくと、以後の添字は単純な形になります。
- **コピーは要素の数だけ**: 2 回のコピーで、全要素を 1 回ずつ移すだけです。
- **容量は倍にして使う**: 呼び出し側は、容量を 2 倍にして広げます。広げる回数が `log n` で済み、1 回ごとのコストは要素数に比例します。全体では、1 要素あたりの平均コストは一定です。

## まとめ

- リングバッファを広げるときは、回り込みを解いて、先頭から順に詰め直す。
- 回り込みが 1 か所か 2 か所かで、コピーの仕方を分ける。
- 容量を 2 倍にして広げると、要素 1 つあたりの平均コストは一定に近い。
