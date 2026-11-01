---
title: "ロックの中で値を読み、結果だけを返す"
description: "Alamofire の Protected.read が、ロックを取ったまま保護された値をクロージャに渡し、その戻り値を返す処理。読み取りの途中で、値が変わることを防ぐ。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2020 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/Protected.swift
lines: [104, 106]
function: "Protected.read<U>(_:)"
difficulty: 1
tags: [並行処理, クロージャ]
format: 2
---
## ひとことで

保護された値を、安全に読みたいことがあります。この関数は、ロックを取ってから値をクロージャに渡し、その結果だけを返します。値そのものは外へ出さず、読み取りの間に書き換えられないようにします。

## コード

```swift:line-numbers=104
    func read<U>(_ closure: (Value) throws -> U) rethrows -> U {
        try lock.around { try closure(self.value) }
    }
```

## 前提知識

- **ロック**: 同時に 1 つの処理だけが、その中に入れる仕組みです。
- **`lock.around`**: ロックを取り、クロージャを実行して、必ず解放する関数です。
- **`rethrows`**: クロージャがエラーを投げたときだけ、この関数もエラーを投げる書き方です。
- **クロージャの戻り値**: 読み取った値から計算した結果を返せます。値全体を外へ出す必要はありません。

## 何をしているか

### 1. ロックを取り、値をクロージャに渡す

`lock.around` の中で、保護された値をクロージャに渡します。読み取りの間は、ほかの処理が値を変えられません。

```swift:line-numbers=105
        try lock.around { try closure(self.value) }
```
### 2. クロージャの結果を返す

クロージャの戻り値を、そのまま返します。呼び出し元は、値の一部や計算結果だけを受け取れます。

```swift:line-numbers=104
    func read<U>(_ closure: (Value) throws -> U) rethrows -> U {
        try lock.around { try closure(self.value) }
    }
```
## ここがすごい

- **読む範囲を呼ぶ側が決める**: 値全体ではなく、必要な部分だけを使った結果を返せます。
- **ロックの忘れがない**: 解放は `around` が行うので、書く側が気をつける必要がありません。
- **書き込みと対になっている**: 同じ `Protected` の `write` と組み合わせて、安全な読み書きを作ります。

## まとめ

- ロックを取って、値をクロージャに渡す。
- クロージャの結果を、そのまま返す。
- 読み取りの間は、ほかの処理が値を変えられない。
