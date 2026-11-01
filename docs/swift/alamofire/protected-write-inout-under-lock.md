---
title: "ロックの中で、値を直接書き換える"
description: "Alamofire の Protected.write が、ロックを取ってから inout の値を渡し、クロージャの中で書き換える処理。読み書きの間に、別の処理が割り込めないようにする。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2020 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/Protected.swift
lines: [114, 116]
function: "Protected.write<U>(_:)"
difficulty: 2
tags: [並行処理, クロージャ]
format: 2
---
## ひとことで

複数の処理から同時に触られる値を、安全に書き換えたいことがあります。この関数は、ロックを取った状態で値を `inout` として渡し、クロージャの中で書き換えさせます。書き換えが終わるまで、ほかの処理は値に触れません。

## コード

```swift:line-numbers=114
    func write<U>(_ closure: (inout Value) throws -> U) rethrows -> U {
        try lock.around { try closure(&self.value) }
    }
```

## 前提知識

- **`inout`**: 引数を、呼び出し元の変数として直接書き換えられるようにする書き方です。
- **ロック**: 同時に 1 つの処理だけが、ある場所に入れるようにする仕組みです。
- **`lock.around`**: ロックを取り、クロージャを実行し、終わったら必ずロックを解放する関数です。
- **`rethrows`**: 渡されたクロージャがエラーを投げたときだけ、この関数もエラーを投げる書き方です。

## 何をしているか

### 1. ロックを取り、値を inout で渡す

`lock.around` の中で、保護している値を `&self.value` として渡します。クロージャは、この値を直接書き換えられます。

```swift:line-numbers=115
        try lock.around { try closure(&self.value) }
```
### 2. 書き換えの結果を返す

クロージャが返した値を、そのまま呼び出し元へ返します。書き換えとあわせて、結果も受け取れます。

```swift:line-numbers=114
    func write<U>(_ closure: (inout Value) throws -> U) rethrows -> U {
        try lock.around { try closure(&self.value) }
    }
```
## ここがすごい

- **書き換えと読み取りを 1 か所に**: 値を取り出して戻すという手間がありません。
- **ロックの解放を忘れない**: `around` が必ずロックを解放するので、途中でエラーが起きても、ロックが残りません。
- **コピーしない**: 値を複製せず、元の場所を直接書き換えます。

## まとめ

- ロックを取ってから、値を `inout` で渡す。
- クロージャの中で、安全に書き換える。
- 書き換えの結果を、呼び出し元へ返す。
