---
title: "流れてくる値を、一定の間隔ごとに 1 つにまとめて返す"
description: "非同期の値の列から、一定の時間ごとに 1 回だけ値を返す仕組み（スロットル）。間隔の途中で届いた値は、畳み込み関数で 1 つにまとめる。最後の値も、間隔を守って返す。"
language: swift
project: "Swift Async Algorithms"
repo: https://github.com/apple/swift-async-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 Apple Inc. and the Swift project authors"
commit: "cbde9aed744bc058974e6bd5c0367ca55a6bf97c"
file: Sources/AsyncAlgorithms/AsyncThrottleSequence.swift
lines: [103, 128]
function: "_AsyncThrottleSequence.Iterator.next()"
difficulty: 3
tags: [非同期, 並行処理, イテレータ]
format: 2
---
## ひとことで

値が次々に届くとき、画面の更新や通信を、一定の間隔ごとにだけ行いたいことがあります。この `next()` は、その **スロットル** を実現します。
間隔の途中で届いた値は捨てずに、`reducing` で 1 つにまとめます。たとえば、0.1 秒の間に届いた値の合計を、0.1 秒ごとに返す、といった使い方ができます。

## コード

::: code-group

```swift:line-numbers=103 [日本語訳]
    public mutating func next() async rethrows -> Reduced? {
      var reduced: Reduced?
      let start = last ?? clock.now
      repeat {
        guard let element = try await base.next() else {
          if reduced != nil, let last {
            // 要素の割合が、指定された間隔を超えないようにします。
            let amount = interval - last.duration(to: clock.now)
            if amount > .zero {
              try? await clock.sleep(until: clock.now.advanced(by: amount), tolerance: nil)
            }
          }
          // 最後の値には、後に続く値がありません。
          // そのため、常に最後の畳み込みの結果を返します。
          return reduced
        }
        let reduction = await reducing(reduced, element)
        let now = clock.now
        if start.duration(to: now) >= interval || last == nil {
          last = now
          return reduction
        } else {
          reduced = reduction
        }
      } while true
    }
```

```swift:line-numbers=103 [原文]
    public mutating func next() async rethrows -> Reduced? {
      var reduced: Reduced?
      let start = last ?? clock.now
      repeat {
        guard let element = try await base.next() else {
          if reduced != nil, let last {
            // ensure the rate of elements never exceeds the given interval
            let amount = interval - last.duration(to: clock.now)
            if amount > .zero {
              try? await clock.sleep(until: clock.now.advanced(by: amount), tolerance: nil)
            }
          }
          // the last value is unable to have any subsequent
          // values so always return the last reduction
          return reduced
        }
        let reduction = await reducing(reduced, element)
        let now = clock.now
        if start.duration(to: now) >= interval || last == nil {
          last = now
          return reduction
        } else {
          reduced = reduction
        }
      } while true
    }
```

:::

## 前提知識

- **`AsyncIteratorProtocol`**: 非同期に次の値を返すイテレータです。`next()` は `await` で待ってから、値か `nil` を返します。
- **`Clock`**: 現在の時刻と、指定した時刻までの待機を提供する型です。テストで時間を進めるためにも使えます。
- **`reducing`**: 前の畳み込みの結果と、新しい要素から、新しい畳み込みの結果を作る関数です。
- **`Duration`**: 時間の長さを表す型です。`interval - last.duration(to: clock.now)` のように、差を取れます。

## 何をしているか

### 1. 次の要素を取り、今までの畳み込みに加える

基になる列から次の要素を取り、`reducing` でこれまでの結果に加えます。

```swift:line-numbers=119
        let reduction = await reducing(reduced, element)
```
### 2. 間隔が過ぎていれば、その結果を返す

前の出力からの時間が `interval` を過ぎていれば、今の結果を返します。`last` を今の時刻にして、次の間隔を始めます。最初の値（`last == nil`）も、すぐに返します。

```swift:line-numbers=120
        let now = clock.now
        if start.duration(to: now) >= interval || last == nil {
          last = now
          return reduction
```
### 3. まだ間隔の途中なら、結果を覚えて次へ進む

間隔の途中なら、結果を `reduced` に保存して、次の要素を待ちます。値は返しません。

```swift:line-numbers=124
        } else {
          reduced = reduction
        }
```
### 4. 元の列が終わったら、間隔を守って最後の値を返す

元の列が終わったとき、まだ返していない畳み込みがあれば、次の間隔まで待ってから返します。待つ時間は、前の出力からの残りです。

```swift:line-numbers=107
        guard let element = try await base.next() else {
          if reduced != nil, let last {
            // 要素の割合が、指定された間隔を超えないようにします。
            let amount = interval - last.duration(to: clock.now)
            if amount > .zero {
              try? await clock.sleep(until: clock.now.advanced(by: amount), tolerance: nil)
            }
          }
          // 最後の値には、後に続く値がありません。
          // そのため、常に最後の畳み込みの結果を返します。
          return reduced
```
## ここがすごい

- **値を捨てずに畳み込む**: 間隔の途中の値を、`reducing` で 1 つにまとめます。たとえば合計を取れば、値が落ちても総量は失われません。
- **出力の間隔が守られる**: 最後の値も、間隔を守って出します。途中で列が終わっても、速く流れすぎることがありません。
- **時間を `Clock` で扱う**: 現在時刻と待機を、`clock` という引数で受け取っています。本物の時計の代わりにテスト用の時計を渡せるので、時間に依存した処理を試せます。

## まとめ

- スロットルは、間隔の途中の値を畳み込み、間隔が過ぎたときに 1 つだけ返す。
- 列の終わりでも、間隔を守って最後の値を返すので、出力が速くなりすぎない。
- 時刻と待機を `Clock` として受け取ると、時間の処理をテストしやすい。
