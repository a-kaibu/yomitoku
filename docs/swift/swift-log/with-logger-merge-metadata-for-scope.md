---
title: "一時的なメタデータを付けて、処理の中だけ使う"
description: "swift-log の withLogger(mergingMetadata:_:) が、現在のロガーをコピーしてメタデータを足し、タスクローカルに設定してから処理を実行する関数。"
language: swift
project: "Swift Log"
repo: https://github.com/apple/swift-log
license: Apache-2.0
copyright: "Copyright (c) 2026 Apple Inc. and the Swift Logging API project authors"
commit: "d0f784af9ea2bc75e557c3d2bb628a68248605f3"
file: Sources/Logging/Logger+With.swift
lines: [138, 153]
function: "withLogger(mergingMetadata:_:)"
difficulty: 3
tags: [ログ, 並行処理]
format: 2
---
## ひとことで

ある処理の間だけ、ログに追加情報を付けたいことがあります。処理が終われば、その情報は消えてほしいものです。この関数は、現在のロガーをコピーして情報を足し、その中で処理を実行します。

## コード

```swift:line-numbers=138
public func withLogger<Result, Failure: Error>(
    mergingMetadata metadata: @autoclosure () -> Logger.Metadata,
    _ operation: (Logger) throws(Failure) -> Result
) throws(Failure) -> Result {
    var logger = Logger.current
    for (key, value) in metadata() {
        logger[metadataKey: key] = value
    }
    do {
        return try Logger.withTaskLocalLogger(logger) {
            try operation(logger)
        }
    } catch {
        throw error as! Failure
    }
}
```

## 前提知識

- **`Logger`**: ログを書くための値です。`metadata` などの設定を持ちます。
- **タスクローカル**: 非同期の処理の中だけで有効な値です。処理の外からは見えません。
- **`@autoclosure`**: 引数の式を、必要になるまで評価しない書き方です。ここでは、メタデータを必要なときに作ります。
- **`throws(Failure)`**: 投げるエラーの型を、呼ぶ側が決められる書き方です。

## 何をしているか

### 1. 現在のロガーをコピーし、メタデータを足す

`Logger.current` の値をコピーし、渡されたメタデータを 1 つずつ足します。元のロガーは変わりません。

```swift:line-numbers=142
    var logger = Logger.current
    for (key, value) in metadata() {
        logger[metadataKey: key] = value
    }
```
### 2. コピーしたロガーを、処理の間だけ有効にする

`withTaskLocalLogger` で、コピーしたロガーをタスクローカルに設定し、その中で `operation` を実行します。処理が終われば、元のロガーに戻ります。

```swift:line-numbers=146
    do {
        return try Logger.withTaskLocalLogger(logger) {
            try operation(logger)
        }
```
### 3. エラーの型をそろえて投げ直す

`catch` で受けたエラーを、`Failure` の型に変換して投げ直します。呼ぶ側は、想定したエラーの型だけを受け取ります。

```swift:line-numbers=150
    } catch {
        throw error as! Failure
    }
```
## ここがすごい

- **元のロガーを壊さない**: コピーに足すので、ほかの場所のログには影響しません。
- **スコープで区切る**: 処理の終わりに、追加情報は自動的に消えます。
- **メタデータは必要なときだけ作る**: `@autoclosure` のおかげで、使われないときは評価されません。

## まとめ

- 現在のロガーをコピーして、メタデータを足す。
- コピーを、処理の間だけタスクローカルで有効にする。
- エラーを想定の型にして、投げ直す。
