---
title: "並んだストリーム ID を、二分探索で見つける"
description: "HTTP/2 の接続で、ストリーム ID の順に並んだ配列から目的の ID を二分探索で探す関数。件数が少ないうちは線形探索に切り替える。"
language: swift
project: "SwiftNIO HTTP/2"
repo: https://github.com/apple/swift-nio-http2
license: Apache-2.0
copyright: "Copyright (c) 2020-2021 Apple Inc. and the SwiftNIO project authors"
commit: "728149ca4f382e42e9cea8837fee9fe00cdb39fe"
file: Sources/NIOHTTP2/StreamMap.swift
lines: [236, 261]
function: "CircularBuffer.binarySearchForStreamID(_:)"
difficulty: 2
tags: [アルゴリズム, 探索, データ構造]
format: 2
---
## ひとことで

HTTP/2 では、1 本の接続の中で、通信の単位を **ストリーム** と呼び、それぞれに番号（ストリーム ID）が付きます。この番号は小さい順に並んで管理されます。
この関数は、その並んだ配列から、ストリーム ID が一致する要素の位置を探します。見つからなければ `nil` を返します。
ストリームの数が少ないうちは、二分探索ではなく、先頭から順に見る方が速いので、そちらに切り替えます。

## コード

```swift:line-numbers=236
    private func binarySearchForStreamID(_ streamID: HTTP2StreamID) -> Index? {
        var left = self.startIndex
        var right = self.endIndex

        while left != right {
            let pivot = self.index(left, offsetBy: self.distance(from: left, to: right) / 2)
            let currentStreamID = self[pivot].streamID
            if currentStreamID > streamID {
                right = pivot
            } else if currentStreamID == streamID {
                return pivot
            } else {
                left = self.index(after: pivot)
            }
        }

        return nil
    }

    fileprivate func findIndexForFirstStreamIDLargerThan(_ streamID: HTTP2StreamID) -> Index {
        if self.count < binarySearchThreshold {
            return self.linearScanForFirstStreamIDLargerThan(streamID)
        } else {
            return self.binarySearchForFirstStreamIDLargerThan(streamID)
        }
    }
```

## 前提知識

- **二分探索**: 整列された配列で、真ん中の値と比べて、探す範囲を半分ずつ狭める方法です。
- **`CircularBuffer`**: 先頭と末尾から、どちらも効率よく追加・削除できる、リング状の配列です。添字ではなく `Index` で位置を指します。
- **`pivot`**: 比べるために選んだ真ん中の位置です。
- **線形探索**: 先頭から 1 つずつ順に見ていく探し方です。

## 何をしているか

### 1. 探す範囲を、左と右の位置で持つ

探す範囲は `left` から `right` までです。最初は配列全体です。

```swift:line-numbers=237
        var left = self.startIndex
        var right = self.endIndex
```
### 2. 真ん中と比べて、範囲を半分にする

範囲の真ん中 `pivot` のストリーム ID を見ます。探している ID より大きければ、右側は要らないので `right` を `pivot` にします。小さければ、左側は要らないので `left` を `pivot` の次にします。一致すれば、その位置を返します。

```swift:line-numbers=240
        while left != right {
            let pivot = self.index(left, offsetBy: self.distance(from: left, to: right) / 2)
            let currentStreamID = self[pivot].streamID
            if currentStreamID > streamID {
                right = pivot
            } else if currentStreamID == streamID {
                return pivot
            } else {
                left = self.index(after: pivot)
            }
```
### 3. 範囲が空になったら、見つからなかったと返す

範囲が空になるまで繰り返しても一致しなければ、その ID はありません。`nil` を返します。

```swift:line-numbers=250
        }

        return nil
    }
```
### 4. 件数が少なければ、先頭から順に探す

`binarySearchThreshold`（200 件）より少なければ、線形探索を使います。件数が少ないときは、二分探索の計算より先頭から見る方が速いためです。

```swift:line-numbers=255
    fileprivate func findIndexForFirstStreamIDLargerThan(_ streamID: HTTP2StreamID) -> Index {
        if self.count < binarySearchThreshold {
            return self.linearScanForFirstStreamIDLargerThan(streamID)
        } else {
            return self.binarySearchForFirstStreamIDLargerThan(streamID)
        }
    }
```
## ここがすごい

- **範囲を半分ずつ狭める**: 比べるたびに候補が半分になるので、件数が `n` でも比べる回数は `log n` で済みます。
- **線形探索との切り替え**: 件数が少ないうちは、二分探索の計算のオーバーヘッドの方が大きくなります。閾値で使い分けることで、少ない場合も速くなります。
- **添字ではなく位置で管理**: `CircularBuffer` は、途中の位置を `Index` で指します。`index(_:offsetBy:)` で真ん中の位置を求めるので、リングの形でも同じ考え方で探せます。

## まとめ

- 整列された並びからの探索は、真ん中と比べて範囲を半分ずつ狭めれば、`log n` 回の比較で済む。
- 件数が少ないうちは線形探索の方が速いので、閾値で切り替える。
- 探索の前提は、並びが小さい順に整列されていること。
