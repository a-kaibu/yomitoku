---
title: "リングバッファの添字を、割り算の代わりに AND で回す"
description: "リングバッファの添字を、容量で割った余りの代わりに、容量 - 1 とのビット AND で求める関数。容量が 2 の冪なら、この式で正しく折り返せる。負の数に進めるときも、同じ式で戻れる。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2017-2018 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/CircularBuffer.swift
lines: [40, 68]
function: "CircularBuffer.indexAdvanced(index:by:)"
difficulty: 2
tags: [ビット演算, データ構造, 低レイヤ]
format: 2
---
## ひとことで

リングバッファは、配列の末尾まで来たら先頭へ戻る、輪のような配列です。添字を進めるときは、「配列の長さで割った余り」で折り返します。
この関数は、その余りを **割り算ではなく AND** で求めます。容量が 2 の冪なら、`容量 - 1` とのビット AND が、余りと同じになるからです。

## コード

```swift:line-numbers=40
    @inlinable
    internal var mask: Int {
        self._buffer.count &- 1
    }

    @inlinable
    internal mutating func advanceHeadIdx(by: Int) {
        self._headBackingIndex = indexAdvanced(index: self.headBackingIndex, by: by)
    }

    @inlinable
    internal mutating func advanceTailIdx(by: Int) {
        self._tailBackingIndex = indexAdvanced(index: self.tailBackingIndex, by: by)
    }

    @inlinable
    internal func indexBeforeHeadIdx() -> Int {
        self.indexAdvanced(index: self.headBackingIndex, by: -1)
    }

    @inlinable
    internal func indexBeforeTailIdx() -> Int {
        self.indexAdvanced(index: self.tailBackingIndex, by: -1)
    }

    @inlinable
    internal func indexAdvanced(index: Int, by: Int) -> Int {
        (index &+ by) & self.mask
    }
```

## 前提知識

- **2 の冪**: 1, 2, 4, 8, 16 のような、2 を何回か掛けた数です。2 進数では、1 つのビットだけが 1 です。
- **マスク**: 特定のビットだけを残すための数です。`容量 - 1` は、下の桁がすべて 1 の数になります。たとえば容量 8 なら、`0b0111` です。
- **2 の補数**: 負の数を、ビットで表す方式です。`-1` は、すべてのビットが 1 です。

## 何をしているか

### 1. 容量から、マスクを作る

容量は 2 の冪で作られています。そのため、`容量 - 1` は、下の桁がすべて 1 の数になります。これをマスクとして使います。

```swift:line-numbers=41
    internal var mask: Int {
        self._buffer.count &- 1
    }
```
### 2. 添字に `by` を足し、マスクで折り返す

添字に `by` を足し、マスクと AND を取ります。値が容量を超えると、先頭へ戻ります。

```swift:line-numbers=65
    @inlinable
    internal func indexAdvanced(index: Int, by: Int) -> Int {
        (index &+ by) & self.mask
    }
```
例として、容量 8（マスクは `0b0111`）で、添字 6 を 3 進めます。`(6 + 3) & 7 = 9 & 7 = 1` で、先頭へ戻ります。反対に、添字 0 を 1 戻すと、`(0 - 1) & 7` で、`-1` の下の 3 ビットは `111` なので、`7` になります。

## ここがすごい

- **割り算より速い**: 割り算は、AND より遅い命令です。添字を進めるたびに使うので、この差が効きます。
- **負の数もそのまま回る**: 2 の補数では、負の数の下の桁も正しく並ぶので、`by` が負でも同じ式で戻れます。
- **容量を 2 の冪に限定する理由**: 2 の冪でないと、マスクが余りと一致しません。だから、初期化のときに 2 の冪へ切り上げ、拡張のときも 2 倍ずつ広げています。

## まとめ

- 容量が 2 の冪なら、余りは `容量 - 1` との AND で求まる。
- 負の数も、2 の補数の性質で同じ式で折り返せる。
- そのため、容量はいつも 2 の冪に保たれる。
