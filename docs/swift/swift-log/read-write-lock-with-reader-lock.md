---
title: "読み手の間だけ、読み取りロックで囲む"
description: "swift-log の ReadWriteLock.withReaderLock(_:) が、読み取りロックを取ってからクロージャを実行し、defer で解放する処理。複数の読み手が同時に入れる。"
language: swift
project: "Swift Log"
repo: https://github.com/apple/swift-log
license: Apache-2.0
copyright: "Copyright (c) 2018-2026 Apple Inc. and the Swift Logging API project authors"
commit: "d0f784af9ea2bc75e557c3d2bb628a68248605f3"
file: Sources/Logging/Locks.swift
lines: [275, 281]
function: "ReadWriteLock.withReaderLock(_:)"
difficulty: 2
tags: [並行処理, ロック不要]
format: 2
---
## ひとことで

値を読むだけの処理は、同時に何人が読んでも安全です。書き換える処理だけを、1 人ずつにすれば十分です。この関数は、読み取り用のロックを取って、読み手の処理を囲みます。

## コード

```swift:line-numbers=275
    internal func withReaderLock<T>(_ body: () throws -> T) rethrows -> T {
        self.lockRead()
        defer {
            self.unlock()
        }
        return try body()
    }
```

## 前提知識

- **読み取りロック（reader lock）**: 複数の読み手が同時に持てるロックです。書き手がいないときだけ、取得できます。
- **書き込みロック（writer lock）**: 1 人だけが持てるロックです。読み手も書き手も入れません。
- **`defer`**: 関数を抜けるときに、必ず実行される処理です。
- **`rethrows`**: クロージャがエラーを投げたときだけ、この関数もエラーを投げる書き方です。

## 何をしているか

### 1. 読み取りロックを取る

`lockRead()` で、読み取り用のロックを取ります。書き手が持っていなければ、ほかの読み手と同時に入れます。

```swift:line-numbers=276
        self.lockRead()
```
### 2. 解放を defer で予約する

`defer` に `unlock()` を書き、関数を抜けるときに必ず解放されるようにします。

```swift:line-numbers=277
        defer {
            self.unlock()
        }
```
### 3. 読み手の処理を実行して、結果を返す

ロックの中で `body()` を実行し、その戻り値を返します。

```swift:line-numbers=280
        return try body()
```
## ここがすごい

- **読み手どうしは待たない**: 読むだけの処理が増えても、互いを待たせません。
- **書き手は待つ**: 書き換え中は、読み取りロックが取れないので、途中の値を読むことがありません。
- **解放は自動**: `defer` のおかげで、途中の `throw` でもロックが残りません。

## まとめ

- 読み取りロックを取る。
- 解放を `defer` で予約する。
- 読み手の処理を実行し、結果を返す。
