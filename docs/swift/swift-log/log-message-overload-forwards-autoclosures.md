---
title: "メッセージだけの呼び出しを、完全な形へ渡す"
description: "swift-log の Logger.log(level:_:metadata:source:file:function:line:) が、エラーなしの簡易版から、エラーを含む完全版の log へ転送する処理。すべての引数を autoclosure で受け取る。"
language: swift
project: "Swift Log"
repo: https://github.com/apple/swift-log
license: Apache-2.0
copyright: "Copyright (c) 2018-2019 Apple Inc. and the Swift Logging API project authors"
commit: "d0f784af9ea2bc75e557c3d2bb628a68248605f3"
file: Sources/Logging/Logger.swift
lines: [233, 251]
function: "Logger.log(level:_:metadata:source:file:function:line:)"
difficulty: 2
tags: [設計パターン, API設計]
format: 2
---
## ひとことで

ログを書く関数には、エラーを付けない形と、付ける形があります。どちらも同じ仕組みで動いてほしいものです。この関数は、エラーなしの形を受け取り、完全な形の `log` へ渡すだけの転送役です。

## コード

```swift:line-numbers=233
    public func log(
        level: Logger.Level,
        _ message: @autoclosure () -> Logger.Message,
        metadata: @autoclosure () -> Logger.Metadata? = nil,
        source: @autoclosure () -> String? = nil,
        file: String = #fileID,
        function: String = #function,
        line: UInt = #line
    ) {
        self.log(
            level: level,
            message(),
            error: nil,
            metadata: metadata(),
            source: source(),
            file: file,
            function: function,
            line: line
        )
```

## 前提知識

- **オーバーロード**: 同じ名前の関数を、引数の違いで複数用意する書き方です。
- **`@autoclosure`**: 引数の式を、関数の中で必要になるまで評価しない書き方です。ログのメッセージは、出力されないなら作られません。
- **`#fileID`、`#function`、`#line`**: 呼び出し元の場所を、コンパイラが自動で埋める特別な値です。
- **`Logger.Message`**: ログの本文を表す型です。

## 何をしているか

### 1. 引数の評価を、転送の時まで遅らせる

受け取った `message`、`metadata`、`source` は、クロージャのまま渡されます。ここでは評価せず、完全版へ渡します。

```swift:line-numbers=234
        level: Logger.Level,
        _ message: @autoclosure () -> Logger.Message,
        metadata: @autoclosure () -> Logger.Metadata? = nil,
        source: @autoclosure () -> String? = nil,
        file: String = #fileID,
        function: String = #function,
        line: UInt = #line
```
### 2. エラーなしとして、完全版の log に渡す

完全版の `log` に、`error` を `nil` にして渡します。`message()`、`metadata()`、`source()` の時点で、値が初めて作られます。

```swift:line-numbers=242
        self.log(
            level: level,
            message(),
            error: nil,
            metadata: metadata(),
            source: source(),
            file: file,
            function: function,
            line: line
        )
```
## ここがすごい

- **無駄な作業をしない**: ログレベルで出力されないときは、メッセージを作る処理が動きません。
- **場所の情報が正しい**: `#fileID` などの既定値を、この関数の呼び出し元で埋めるので、ログの場所が正しく残ります。
- **1 か所に処理を集める**: 本当の処理は完全版にだけ書き、簡易版は引数を渡すだけになっています。

## まとめ

- 簡易版は、すべての引数を autoclosure で受け取る。
- 完全版の `log` に、エラーなしとして転送する。
- 値は、実際に出力されるときにだけ作られる。
