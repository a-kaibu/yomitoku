---
title: "新しい値を、書き換えの処理に任せて入れる"
description: "Alamofire の Protected.write(_:) が、新しい値を受け取り、inout の書き換えを使って上書きする 1 行の処理。値の上書きも、ロックの中で行われる。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2020 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/Protected.swift
lines: [121, 123]
function: "Protected.write(_:)"
difficulty: 1
tags: [並行処理, クロージャ]
format: 2
---
## ひとことで

保護された値を、新しい値で置き換えたいことがあります。この関数は、値を受け取り、先ほどの `write` を使って上書きするだけです。上書きの処理を、1 か所にまとめています。

## コード

```swift:line-numbers=121
    func write(_ value: Value) {
        write { $0 = value }
    }
```

## 前提知識

- **`write` の別の形**: `inout` を受け取る `write` を、値の上書きに使います。
- **`$0`**: クロージャの最初の引数の省略名です。ここでは、`inout` で渡された値を指します。
- **代入**: `$0 = value` は、保護された値を新しい値に置き換えます。

## 何をしているか

### 1. 値を上書きする書き換えを、write に渡す

`write` に、`$0 = value` を書いたクロージャを渡します。`$0` は保護されている値そのものなので、代入で上書きされます。

```swift:line-numbers=122
        write { $0 = value }
```
## ここがすごい

- **同じ仕組みを使い回す**: ロックの処理を新しく書かず、既存の `write` に任せています。
- **短く読める**: 「値を新しいものにする」という意図が、1 行で伝わります。
- **安全性を保つ**: 上書きもロックの中で行われるので、読み取りと同時に起きることはありません。
- **経路を 1 つにまとめる**: 上書きも読み取りも同じロックを通るので、ロックの決まりを守る場所が 1 つで済みます。新しい書き込みの方法を足すときも、この形に合わせれば安全です。

## まとめ

- 新しい値を受け取る。
- `write` に、代入のクロージャを渡す。
- ロックの中で、値を安全に上書きする。
