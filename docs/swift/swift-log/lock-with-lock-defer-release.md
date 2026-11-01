---
title: "ロックを取って、どこで抜けても必ず解放する"
description: "swift-log の Lock.withLock(_:) が、ロックを取ってからクロージャを実行し、defer で必ず解放する処理。途中でエラーが投げられても、ロックが残らない。"
language: swift
project: "Swift Log"
repo: https://github.com/apple/swift-log
license: Apache-2.0
copyright: "Copyright (c) 2018-2026 Apple Inc. and the Swift Logging API project authors"
commit: "d0f784af9ea2bc75e557c3d2bb628a68248605f3"
file: Sources/Logging/Locks.swift
lines: [145, 151]
function: "Lock.withLock(_:)"
difficulty: 1
tags: [並行処理, 防御的プログラミング]
format: 2
---
## ひとことで

ロックを取ったら、必ず解放しなければなりません。解放を忘れると、ほかの処理がずっと待ち続けてしまいます。この関数は、ロックを取ったあとに `defer` で解放を予約し、クロージャを実行します。

## コード

```swift:line-numbers=145
    package func withLock<T>(_ body: () throws -> T) rethrows -> T {
        self.lock()
        defer {
            self.unlock()
        }
        return try body()
    }
```

## 前提知識

- **ロック**: 同時に 1 つの処理だけが入れる場所を作る仕組みです。
- **`defer`**: 関数を抜けるときに、必ず実行される処理を書く文です。`return` や `throw` でも動きます。
- **`rethrows`**: 渡されたクロージャがエラーを投げたときだけ、この関数もエラーを投げる書き方です。
- **ジェネリクス `<T>`**: 戻り値の型を、呼ぶ側に合わせて決められる書き方です。

## 何をしているか

### 1. ロックを取る

まず `lock()` を呼び、ほかの処理が中に入れないようにします。

```swift:line-numbers=146
        self.lock()
```
### 2. 解放を defer で予約する

`defer` に `unlock()` を書きます。この時点で解放が予約され、関数を抜けるときに必ず実行されます。

```swift:line-numbers=147
        defer {
            self.unlock()
        }
```
### 3. クロージャを実行して、結果を返す

ロックの中で `body()` を実行し、その戻り値をそのまま返します。エラーが投げられた場合も、`defer` の解放が先に動きます。

```swift:line-numbers=150
        return try body()
```
## ここがすごい

- **解放を忘れない**: 解放を、取得したすぐ後に書きます。途中の `return` や `throw` の数に関係なく、必ず解放されます。
- **呼ぶ側が解放を気にしない**: 中身のクロージャは、ロックのことを知らなくて済みます。
- **結果をそのまま返せる**: ロックを取る処理が、戻り値の形を変えません。

## まとめ

- ロックを取る。
- 解放を `defer` で予約する。
- クロージャを実行し、結果を返す。
