---
title: "持ち主が消えたら解放される、弱い参照の箱を作る"
description: "非同期の処理が画面の部品を参照しても、その部品の寿命を延ばさないよう、値を weak で持つ Kingfisher の WeakBox。"
language: swift
project: "Kingfisher"
repo: https://github.com/onevcat/Kingfisher
license: MIT
copyright: "Copyright (c) 2019 Wei Wang <onevcat@gmail.com>"
commit: "7406a99571034568b6ca4ba875c01842607e03d9"
file: Sources/Utility/Box.swift
lines: [45, 50]
function: "WeakBox"
difficulty: 2
tags: [メモリ管理, 並行処理]
format: 2
---
## ひとことで

画像の読み込みのように、完了まで時間がかかる処理は、終わるまで参照している物を生かし続けてしまいます。`WeakBox` は、値を弱い参照で持つ箱です。持ち主がほかで解放されれば、箱の中の値も `nil` になり、無駄に生き続けません。

## コード

```swift:line-numbers=45
final class WeakBox<T: AnyObject>: @unchecked Sendable {
    weak var value: T?

    init(_ value: T?) {
        self.value = value
    }
```

## 前提知識

- **参照の強さ**: 普通の参照（強い参照）は、その値を生かし続けます。弱い参照（`weak`）は、値を生かさず、解放されると `nil` になります。
- **`AnyObject`**: クラスのインスタンスだけを表す条件です。`weak` が使えるのは、クラスの値に限られます。
- **オプショナル（`T?`）**: 弱い参照は、解放されたときに `nil` になるので、型はオプショナルです。
- **`@unchecked Sendable`**: 複数のスレッドで受け渡してよいと、開発者が保証する印です。

## 何をしているか

### 1. 値を弱い参照で持つ

`weak var value` は、箱が値を持っていても、値の寿命を延ばさない宣言です。値を持つ別の強い参照がなくなれば、値は解放されます。

```swift:line-numbers=46
    weak var value: T?
```
### 2. 初期化では、値をそのまま受け取る

初期化のときは、渡された値を `value` に入れます。ここでは、強い参照は増えず、弱い参照として保存されます。

```swift:line-numbers=48
    init(_ value: T?) {
        self.value = value
    }
```
## ここがすごい

- **寿命を延ばさない**: 完了を待つ処理が箱を持っていても、中の画面の部品は、持ち主がいなくなれば解放されます。メモリを無駄に使いません。
- **`nil` で状態が分かる**: 解放されたかどうかは、`value` が `nil` かどうかで分かります。処理の後で、値があるかを安全に確かめられます。
- **循環参照を避けやすい**: 参照が互いに相手を強く持つと、どちらも解放されなくなります。片方を弱い参照にすると、この問題を防げます。

## まとめ

- 弱い参照は、値の寿命を延ばさない。
- 解放されると `nil` になるので、使う前に値を確かめる。
- 完了を待つ処理が、持ち主の寿命を延ばさないように使う。
