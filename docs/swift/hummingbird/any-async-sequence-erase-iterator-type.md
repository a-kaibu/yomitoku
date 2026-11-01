---
title: "非同期の列の具体的な型を隠し、1 つの型で扱えるようにする"
description: "どの AsyncSequence でも同じ型として持てるように、イテレータの型を閉包の中に閉じ込める Hummingbird の AnyAsyncSequence。型消去の例。"
language: swift
project: "Hummingbird"
repo: https://github.com/hummingbird-project/hummingbird
license: Apache-2.0
copyright: "Copyright (c) the Hummingbird authors"
commit: "341e11f65d8e24cf87e9aae427c040f0084ada4e"
file: Sources/HummingbirdCore/Utils/AnyAsyncSequence.swift
lines: [9, 47]
function: "AnyAsyncSequence"
difficulty: 3
tags: [非同期, ジェネリクス, イテレータ]
format: 2
---
## ひとことで

`AsyncSequence` を実装した型は、型ごとに別の型になってしまいます。この型は、列の具体的な型を外から見えなくして、「次の値を返す関数」だけを持つ 1 つの型にまとめます。これを型消去（type erasure）と呼びます。

## コード

```swift:line-numbers=9
@usableFromInline
struct AnyAsyncSequence<Element>: AsyncSequence {
    @usableFromInline
    typealias AsyncIteratorNextCallback = () async throws -> Element?

    @usableFromInline
    let makeAsyncIteratorCallback: @Sendable () -> AsyncIteratorNextCallback

    @inlinable
    init<AS: AsyncSequence>(_ base: AS) where AS.Element == Element, AS: Sendable, AS.AsyncIterator: _HB_SendableMetatype {
        self.makeAsyncIteratorCallback = {
            var iterator = base.makeAsyncIterator()
            return {
                try await iterator.next()
            }
        }
    }

    @usableFromInline
    struct AsyncIterator: AsyncIteratorProtocol {
        @usableFromInline
        let nextCallback: AsyncIteratorNextCallback

        @usableFromInline
        init(nextCallback: @escaping AsyncIteratorNextCallback) {
            self.nextCallback = nextCallback
        }

        @inlinable
        func next() async throws -> Element? {
            try await self.nextCallback()
        }
    }

    @inlinable
    func makeAsyncIterator() -> AsyncIterator {
        .init(nextCallback: self.makeAsyncIteratorCallback())
    }
}
```

## 前提知識

- **`AsyncSequence`**: 値を `await` で 1 つずつ取り出せる列です。`AsyncIterator` という型で、次の値を順に返します。
- **ジェネリクス**: `AS: AsyncSequence` のように、型を後から決める書き方です。型ごとに、別の具体的な型になります。
- **型消去**: 具体的な型の情報を捨てて、共通の型で扱えるようにする手法です。閉包（クロージャ）に中身を閉じ込めることで実現します。
- **`@Sendable`**: 複数の並行処理の間で、安全に受け渡せることを示す印です。

## 何をしているか

### 1. 保存するのは、イテレータを作る関数だけ

この型が持つのは、`makeAsyncIteratorCallback` という閉包です。元の列の型は、この型の外には出てきません。

```swift:line-numbers=10
struct AnyAsyncSequence<Element>: AsyncSequence {
    @usableFromInline
    typealias AsyncIteratorNextCallback = () async throws -> Element?

    @usableFromInline
    let makeAsyncIteratorCallback: @Sendable () -> AsyncIteratorNextCallback
```
### 2. 元の列から、閉包の中でイテレータを作る

`init` は、元の列を受け取り、その列のイテレータを閉包の中で作ります。`next()` を呼ぶと、元の列の次の値が返ります。

```swift:line-numbers=17
    @inlinable
    init<AS: AsyncSequence>(_ base: AS) where AS.Element == Element, AS: Sendable, AS.AsyncIterator: _HB_SendableMetatype {
        self.makeAsyncIteratorCallback = {
            var iterator = base.makeAsyncIterator()
            return {
                try await iterator.next()
            }
        }
    }
```
### 3. 次の値を読むためのイテレータ

`AsyncIterator` は、`nextCallback` を呼ぶだけの型です。元の列が何であるかは知りません。

```swift:line-numbers=28
    struct AsyncIterator: AsyncIteratorProtocol {
        @usableFromInline
        let nextCallback: AsyncIteratorNextCallback

        @usableFromInline
        init(nextCallback: @escaping AsyncIteratorNextCallback) {
            self.nextCallback = nextCallback
        }

        @inlinable
        func next() async throws -> Element? {
            try await self.nextCallback()
        }
    }
```
### 4. イテレータを取り出す

`makeAsyncIterator` で、閉包から新しい `AsyncIterator` を作って返します。

```swift:line-numbers=43
    @inlinable
    func makeAsyncIterator() -> AsyncIterator {
        .init(nextCallback: self.makeAsyncIteratorCallback())
    }
```
## ここがすごい

- **型の数を増やさない**: どの列も `AnyAsyncSequence<Int>` のように、同じ型として扱えます。受け取る関数や、保存する配列の型を単純にできます。
- **中身は閉包で隠れている**: 元の型の情報は、閉包の中に閉じ込められ、外からは使えません。その分、公開する型の形が安定します。
- **`Sendable` を条件にしている**: 並行処理で使うために、元の列とイテレータが安全に送れる条件を付けています。

## まとめ

- 列の具体的な型を閉包の中に閉じ込め、外には `Element` の型だけを見せる。
- イテレータは、次の値を返す閉包を呼ぶだけになる。
- 型の数を増やさずに、どの非同期列も同じ型として扱える。
