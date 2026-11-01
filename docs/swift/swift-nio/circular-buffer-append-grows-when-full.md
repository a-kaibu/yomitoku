---
title: "リングバッファの末尾に追加し、いっぱいなら大きくする"
description: "swift-nio の CircularBuffer.append が、末尾に値を書き込み、先頭と末尾がぶつかったら容量を倍にする処理。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2017-2018 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/CircularBuffer.swift
lines: [372, 380]
function: "CircularBuffer.append(_:)"
difficulty: 2
tags: [データ構造, メモリ管理]
format: 2
---
## ひとことで

リングバッファは、配列の端と端をつないで、先頭と末尾を効率よく動かすデータ構造です。この関数は、末尾に値を書き、末尾の位置を進めます。空きがなくなったら、容量を倍にして詰め直します。

## コード

::: code-group

```swift:line-numbers=372 [日本語訳]
    public mutating func append(_ value: Element) {
        self._buffer[self.tailBackingIndex] = value
        self.advanceTailIdx(by: 1)

        if self.headBackingIndex == self.tailBackingIndex {
            // 追加の空きがなくなったので、ここで先にバッファを大きくします。
            self._doubleCapacity()
        }
    }
```

```swift:line-numbers=372 [原文]
    public mutating func append(_ value: Element) {
        self._buffer[self.tailBackingIndex] = value
        self.advanceTailIdx(by: 1)

        if self.headBackingIndex == self.tailBackingIndex {
            // No more room left for another append so grow the buffer now.
            self._doubleCapacity()
        }
    }
```

:::

## 前提知識

- **リングバッファ**: 配列を輪のように扱い、先頭と末尾の位置だけを動かす仕組みです。要素を前に詰め直す必要がありません。
- **バッキングインデックス**: 配列の中の、実際の場所を表す番号です。
- **空きがなくなる条件**: 先頭と末尾の位置が同じになったら、もう書き込める場所がありません。
- **`_doubleCapacity`**: 容量を 2 倍にして、要素を並べ直す内部の関数です。

## 何をしているか

### 1. 末尾に値を書き、位置を進める

末尾の位置に値を書き込み、末尾の位置を 1 つ進めます。

```swift:line-numbers=373
        self._buffer[self.tailBackingIndex] = value
        self.advanceTailIdx(by: 1)
```
### 2. 先頭と末尾がぶつかったら、容量を倍にする

先頭と末尾が同じ位置になったら、書き込める場所が残っていません。そのときだけ、容量を 2 倍にします。

```swift:line-numbers=376
        if self.headBackingIndex == self.tailBackingIndex {
            // 追加の空きがなくなったので、ここで先にバッファを大きくします。
            self._doubleCapacity()
        }
```
## ここがすごい

- **ほとんどの追加は、すぐに終わる**: 空きがあるときは、書き込みと位置の更新だけで済みます。
- **必要なときだけ大きくする**: 容量を増やすのは、いっぱいになったときだけです。
- **倍にする**: 何度も少しずつ大きくするより、倍にするほうが回数が少なくなります。

## まとめ

- 末尾に値を書いて、位置を進める。
- 先頭と末尾がぶつかったら、容量を倍にする。
- ふつうの追加は、一定の手間で終わる。
