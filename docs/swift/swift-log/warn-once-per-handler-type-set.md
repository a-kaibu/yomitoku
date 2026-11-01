---
title: "同じ型への警告は、最初の 1 回だけ出す"
description: "swift-log の warnOnceLogHandlerNotSupportedMetadataProvider(type:) が、ロックの中で型の ID を Set に入れ、初めてのときだけ true を返す処理。"
language: swift
project: "Swift Log"
repo: https://github.com/apple/swift-log
license: Apache-2.0
copyright: "Copyright (c) 2018-2019 Apple Inc. and the Swift Logging API project authors"
commit: "d0f784af9ea2bc75e557c3d2bb628a68248605f3"
file: Sources/Logging/LoggingSystem.swift
lines: [219, 225]
function: "warnOnceLogHandlerNotSupportedMetadataProvider(type:)"
difficulty: 2
tags: [ログ, 並行処理]
format: 2
---
## ひとことで

ある機能が使えないときに、警告を出したいことがあります。ただし、同じ警告を何度も出すと、ログがうるさくなります。この関数は、型ごとに最初の 1 回だけ `true` を返し、その時だけ警告を出せるようにします。

## コード

::: code-group

```swift:line-numbers=219 [日本語訳]
    func warnOnceLogHandlerNotSupportedMetadataProvider<Handler: LogHandler>(type: Handler.Type) -> Bool {
        self.lock.withLock {
            let id = ObjectIdentifier(type)
            let (inserted, _) = warnOnceLogHandlerNotSupportedMetadataProviderPerType.insert(id)
            return inserted  // この型について警告するのは、初めて見たときだけです。
        }
    }
```

```swift:line-numbers=219 [原文]
    func warnOnceLogHandlerNotSupportedMetadataProvider<Handler: LogHandler>(type: Handler.Type) -> Bool {
        self.lock.withLock {
            let id = ObjectIdentifier(type)
            let (inserted, _) = warnOnceLogHandlerNotSupportedMetadataProviderPerType.insert(id)
            return inserted  // warn about this handler type, it is the first time we encountered it
        }
    }
```

:::

## 前提知識

- **`ObjectIdentifier`**: 型やオブジェクトに対して、同じものかを比べられる ID です。
- **`Set`**: 同じ値を 2 回入れられない集合です。`insert` の結果で、新しいかどうかが分かります。
- **`insert` の戻り値**: 値が新しく入ったかを、`inserted` で教えてくれます。
- **`Lock` と `withLock`**: 複数の処理から同時に `Set` を触らないように、ロックの中で扱います。

## 何をしているか

### 1. ロックの中で、型の ID を作る

型を `ObjectIdentifier` に変えます。これで、同じ型かどうかを、ID の比較で判断できます。

```swift:line-numbers=221
            let id = ObjectIdentifier(type)
```
### 2. Set に入れて、新しいかを確かめる

ID を `Set` に入れます。`inserted` が `true` なら、この型は初めて見たことになります。

```swift:line-numbers=222
            let (inserted, _) = warnOnceLogHandlerNotSupportedMetadataProviderPerType.insert(id)
```
### 3. 初めてのときだけ true を返す

初めて見た型なら `true` を返します。呼ぶ側は、その結果で警告を出すかを決めます。

```swift:line-numbers=223
            return inserted  // この型について警告するのは、初めて見たときだけです。
```
## ここがすごい

- **警告の回数を抑える**: 同じ型の警告は、プログラムの実行中に 1 回だけになります。
- **判断を 1 回の操作で行う**: 入っているかを調べてから入れる、という 2 段階は必要ありません。
- **ロックで守る**: 複数の処理から同時に呼ばれても、`Set` の中身が壊れません。

## まとめ

- 型の ID を作る。
- `Set` に入れて、新しいかを確かめる。
- 初めてのときだけ `true` を返し、警告を 1 回に絞る。
