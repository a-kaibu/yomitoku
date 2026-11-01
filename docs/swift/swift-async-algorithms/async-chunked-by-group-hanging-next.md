---
title: "同じグループが続くかぎり、非同期の要素を 1 つにまとめる"
description: "隣り合う要素が同じグループなら一緒に集め、グループが変わった要素は次の回へ持ち越す、AsyncChunkedByGroupSequence の next()。"
language: swift
project: "Swift Async Algorithms"
repo: https://github.com/apple/swift-async-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift project authors"
commit: "cbde9aed744bc058974e6bd5c0367ca55a6bf97c"
file: Sources/AsyncAlgorithms/AsyncChunkedByGroupSequence.swift
lines: [81, 107]
function: "AsyncChunkedByGroupSequence.Iterator の next()"
difficulty: 3
tags: [非同期, イテレータ]
format: 2
---
## ひとことで

非同期で届く値の列を、隣り合う要素が同じグループに属する間だけ、1 つの塊にまとめます。グループが変わった最初の要素は、捨てずに次の塊の先頭へ持ち越します。

## コード

```swift:line-numbers=81
    @inlinable
    public mutating func next() async rethrows -> Collected? {
      var firstOpt = hangingNext
      if firstOpt == nil {
        firstOpt = try await base.next()
      } else {
        hangingNext = nil
      }

      guard let first = firstOpt else {
        return nil
      }

      var result: Collected = .init()
      result.append(first)

      var prev = first
      while let next = try await base.next() {
        guard grouping(prev, next) else {
          hangingNext = next
          break
        }
        result.append(next)
        prev = next
      }
      return result
    }
```

## 前提知識

- **`AsyncSequence`**: `await` で値を 1 つずつ取り出せる列です。次の値が届くまで、処理は待ちます。
- **グループの判定**: `grouping(prev, next)` は、2 つの隣り合う要素が同じグループなら `true` を返す関数です。
- **持ち越し（hanging）**: 今回の塊に入れられなかった要素を、次の呼び出しのために覚えておくことです。ここでは `hangingNext` という変数に入れます。
- **`guard ... else`**: 条件が偽のときに、すぐ抜ける書き方です。

## 何をしているか

### 1. 持ち越しがあれば、それを先頭にする

前回の呼び出しで、次の塊に回した要素があれば、それを今回の先頭にします。なければ、列から新しく 1 つ読みます。

```swift:line-numbers=83
      var firstOpt = hangingNext
      if firstOpt == nil {
        firstOpt = try await base.next()
      } else {
        hangingNext = nil
      }
```
### 2. 先頭がなければ、列の終わり

先頭を用意できなかったときは、列が終わったので `nil` を返します。

```swift:line-numbers=90
      guard let first = firstOpt else {
        return nil
      }
```
### 3. 先頭を結果に入れ、同じグループの要素を足していく

先頭を結果に入れます。そのあと、列から次の要素を読み、直前の要素と同じグループなら、結果に足します。

```swift:line-numbers=94
      var result: Collected = .init()
      result.append(first)

      var prev = first
      while let next = try await base.next() {
```
### 4. グループが変わったら、持ち越して終わる

同じグループでなくなった要素は、`hangingNext` に入れておきます。次の呼び出しで、この要素が先頭になります。

```swift:line-numbers=99
        guard grouping(prev, next) else {
          hangingNext = next
          break
        }
        result.append(next)
        prev = next
      }
```
### 5. まとまりを返す

集まった要素を、塊として返します。

```swift:line-numbers=106
      return result
```
## ここがすごい

- **要素を失わない**: 次の塊に属する要素を読んでしまっても、持ち越しの変数に入れるので、取りこぼしがありません。
- **読みながら判断する**: 全体を先に読むのではなく、届いた順に判断するので、非同期の列でも、値が届いた時点で処理を進められます。
- **状態が 1 つで済む**: 持ち越しの変数だけで、前回の続きを表せます。複数の状態変数を持つ必要がありません。

## まとめ

- 持ち越しがあれば先頭にし、なければ新しく読む。
- 同じグループが続くかぎり、結果に足していく。
- グループが変わった要素は持ち越し、次の塊の先頭にする。
