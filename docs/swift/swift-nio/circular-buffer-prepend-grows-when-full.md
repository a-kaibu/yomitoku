---
title: "リングバッファの先頭に追加し、いっぱいなら大きくする"
description: "swift-nio の CircularBuffer.prepend が、先頭の 1 つ前に値を書き、先頭の位置を戻す処理。先頭と末尾がぶつかったら、容量を倍にする。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2017-2018 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/CircularBuffer.swift
lines: [386, 395]
function: "CircularBuffer.prepend(_:)"
difficulty: 2
tags: [データ構造, メモリ管理]
format: 2
---
## ひとことで

リングバッファの先頭に、値を追加したいことがあります。配列の先頭に挿入すると、後ろの要素をすべて動かす必要があります。この関数は、先頭の 1 つ前の場所に書き込み、先頭の位置を戻すだけで済ませます。

## コード

::: code-group

```swift:line-numbers=386 [日本語訳]
    public mutating func prepend(_ value: Element) {
        let idx = self.indexBeforeHeadIdx()
        self._buffer[idx] = value
        self.advanceHeadIdx(by: -1)

        if self.headBackingIndex == self.tailBackingIndex {
            // 先頭への追加でも、空きがなくなったら、バッファを先に大きくします。
            self._doubleCapacity()
        }
    }
```

```swift:line-numbers=386 [原文]
    public mutating func prepend(_ value: Element) {
        let idx = self.indexBeforeHeadIdx()
        self._buffer[idx] = value
        self.advanceHeadIdx(by: -1)

        if self.headBackingIndex == self.tailBackingIndex {
            // No more room left for another append so grow the buffer now.
            self._doubleCapacity()
        }
    }
```

:::

## 前提知識

- **先頭の 1 つ前**: リングバッファでは、先頭の前の場所は配列の末尾側につながっています。そこへ書き込めます。
- **`indexBeforeHeadIdx`**: 先頭の 1 つ前の、実際の場所を求める内部の関数です。
- **`advanceHeadIdx(by:)`**: 先頭の位置を、指定した数だけ動かします。ここでは -1 で、1 つ前に戻します。
- **容量の上限**: 先頭と末尾が同じ位置になると、書き込める場所がなくなります。

## 何をしているか

### 1. 先頭の 1 つ前に値を書き、先頭を戻す

先頭の 1 つ前の場所を求め、そこに値を書きます。そのあと、先頭の位置を 1 つ戻します。

```swift:line-numbers=387
        let idx = self.indexBeforeHeadIdx()
        self._buffer[idx] = value
        self.advanceHeadIdx(by: -1)
```
### 2. 空きがなくなったら、容量を倍にする

先頭と末尾が同じ位置になったときだけ、容量を 2 倍にします。

```swift:line-numbers=391
        if self.headBackingIndex == self.tailBackingIndex {
            // 先頭への追加でも、空きがなくなったら、バッファを先に大きくします。
            self._doubleCapacity()
        }
```
## ここがすごい

- **後ろの要素を動かさない**: 先頭への追加は、位置の計算と 1 回の書き込みで済みます。
- **末尾への追加と対になる**: 先頭と末尾の両方を、同じ仕組みで扱えます。
- **空きの判定を共通化**: 容量を増やす条件は、末尾への追加と同じ形です。

## まとめ

- 先頭の 1 つ前に値を書き、先頭の位置を戻す。
- 先頭と末尾がぶつかったら、容量を倍にする。
- 先頭への追加も、一定の手間で済む。
