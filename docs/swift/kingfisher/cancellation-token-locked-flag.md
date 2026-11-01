---
title: "複数のスレッドから、キャンセルの有無を安全に読み書きする"
description: "バックグラウンドの処理を止めるためのフラグを、NSLock で守って読み書きする Kingfisher の CancellationToken。"
language: swift
project: "Kingfisher"
repo: https://github.com/onevcat/Kingfisher
license: MIT
copyright: "Copyright (c) 2024 Wei Wang <onevcat@gmail.com>"
commit: "7406a99571034568b6ca4ba875c01842607e03d9"
file: Sources/Utility/CancellationToken.swift
lines: [34, 49]
function: "CancellationToken"
difficulty: 2
tags: [並行処理, 防御的プログラミング]
format: 2
---
## ひとことで

画像の取得など、バックグラウンドで進む処理を途中でやめるための「キャンセルされたか」を表すフラグです。別のスレッドから書かれても読まれても壊れないように、ロックで守っています。

## コード

```swift:line-numbers=34
final class CancellationToken: @unchecked Sendable {
    private let lock = NSLock()
    private var _isCancelled = false

    var isCancelled: Bool {
        lock.lock()
        defer { lock.unlock() }
        return _isCancelled
    }

    func cancel() {
        lock.lock()
        _isCancelled = true
        lock.unlock()
    }
}
```

## 前提知識

- **スレッド**: 同時に動く処理の流れです。複数のスレッドが同じ変数を同時に書くと、値が壊れることがあります。
- **ロック（`NSLock`）**: 同時に入れるのは 1 つのスレッドだけにする仕組みです。`lock()` で入り、`unlock()` で出ます。
- **`defer`**: 関数を抜けるときに、必ず実行される処理を書く文です。`defer { lock.unlock() }` は、どこで戻っても解除されることを保証します。
- **`@unchecked Sendable`**: この型は、Swift のコンパイラでは安全性を確かめられないが、開発者が安全だと保証する、という印です。

## 何をしているか

### 1. ロックと、フラグを用意する

`lock` は、フラグを守るための鍵です。`_isCancelled` は、キャンセルされたかどうかを表す値で、最初は `false` です。

```swift:line-numbers=35
    private let lock = NSLock()
    private var _isCancelled = false
```
### 2. 読むときは、ロックをかけてから読む

`defer` で、読み終わったら必ず解除します。ロックの中で読むので、書き込みと同時に読むことはありません。

```swift:line-numbers=38
    var isCancelled: Bool {
        lock.lock()
        defer { lock.unlock() }
        return _isCancelled
    }
```
### 3. 書くときも、同じロックで守る

キャンセルを書き込むときも、同じ鍵をかけてから値を変えます。

```swift:line-numbers=44
    func cancel() {
        lock.lock()
        _isCancelled = true
        lock.unlock()
    }
```
## ここがすごい

- **読みと書きを同じ鍵で守る**: 読むときも、書くときも同じロックを使うので、値が途中で変わったものを読むことがありません。
- **`defer` で解除を忘れない**: 読む処理の途中で戻っても、ロックは必ず解除されます。
- **シンプルな形**: キャンセルは一度 `true` になれば戻らないので、複雑な状態管理を避けられます。

## まとめ

- キャンセルの状態は、1 つのフラグとして持つ。
- 読むときも書くときも、同じロックをかけてから扱う。
- `defer` で、ロックの解除を必ず行う。
