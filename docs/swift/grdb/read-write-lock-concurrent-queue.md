---
title: "複数の読み手と 1 人の書き手を、並行キューの障壁で両立させる"
description: "並行キューの同期実行と、障壁（barrier）付きの同期実行を使い、読み取りは同時に行い、書き込みは 1 つずつ行う GRDB の ReadWriteLock。"
language: swift
project: "GRDB"
repo: https://github.com/groue/GRDB.swift
license: MIT
copyright: "Copyright (C) 2015-2025 Gwendal Roué"
commit: "92a554cd0d5e8d67cb18993c6054e73fe42c066c"
file: GRDB/Utils/ReadWriteLock.swift
lines: [15, 28]
function: "read(_:) と withLock(_:)"
difficulty: 2
tags: [並行処理, 防御的プログラミング]
format: 2
---
## ひとことで

値を読むときは、複数のスレッドが同時に読んでかまいません。値を書き換えるときは、他の読み手も書き手も入れないようにします。この 2 つの約束を、並行キューの仕組みだけで実現しています。

## コード

::: code-group

```swift:line-numbers=15 [日本語訳]
    func read<U>(_ body: (T) throws -> U) rethrows -> U {
        try queue.sync {
            try body(_value)
        }
    }
    
    /// 値を守りながら、渡されたクロージャを実行します。
    ///
    /// body は、値を書き換えてよいクロージャです。
    func withLock<U>(_ body: (inout T) throws -> U) rethrows -> U {
        try queue.sync(flags: [.barrier]) {
            try body(&_value)
        }
    }
```

```swift:line-numbers=15 [原文]
    func read<U>(_ body: (T) throws -> U) rethrows -> U {
        try queue.sync {
            try body(_value)
        }
    }
    
    /// Runs the provided closure while holding a lock on the value.
    ///
    /// - parameter body: A closure that can modify the value.
    func withLock<U>(_ body: (inout T) throws -> U) rethrows -> U {
        try queue.sync(flags: [.barrier]) {
            try body(&_value)
        }
    }
```

:::

## 前提知識

- **`DispatchQueue`**: 処理を並べて実行する仕組みです。`attributes: [.concurrent]` を付けると、同時に複数の処理を走らせられます。
- **`sync`**: 処理が終わるまで待ってから戻る実行方法です。戻り値を、そのまま受け取れます。
- **バリア（`.barrier`）**: 並行キューで、そのバリアの処理は、前後の処理と重ならずに単独で走る印です。
- **`inout`**: 引数を、呼び出し側の変数として書き換えられるようにする指定です。

## 何をしているか

### 1. 読むときは、同時に読んでもよい

`read` は、通常の `sync` で実行します。並行キューなので、他の `read` と同時に動けます。

```swift:line-numbers=15
    func read<U>(_ body: (T) throws -> U) rethrows -> U {
        try queue.sync {
            try body(_value)
        }
    }
```
### 2. 書くときは、バリアを付けて単独で実行する

`withLock` は、`.barrier` を付けて実行します。バリアの処理は、前後のどの読み取りや書き込みとも重なりません。その間は、値を `inout` で書き換えられます。

```swift:line-numbers=24
    func withLock<U>(_ body: (inout T) throws -> U) rethrows -> U {
        try queue.sync(flags: [.barrier]) {
            try body(&_value)
        }
    }
```
## ここがすごい

- **読み取りを並べられる**: 読むだけの処理は同時に走れるので、読み手が多くても待たされにくくなります。
- **書き込みを安全にする**: バリアの間は他の処理が入らないので、値の途中の状態を誰も読まずに済みます。
- **ロックを明示的に書かない**: `NSLock` のように、鍵の取得と解放を書く必要がありません。キューの仕組みが、同じ約束を守ります。

## まとめ

- 読み取りは並行キューで同時に行う。
- 書き込みは、バリア付きで単独に行う。
- 値を読み書きするときは、必ずこの 2 つの入り口を通す。
