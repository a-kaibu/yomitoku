---
title: "ロックの中で数値を増やしたり減らしたりし、新しい値を返す"
description: "NSLock で守った値に対し、増減の処理をまとめて 1 回のロックで行い、その結果を返す GRDB の Mutex の increment と decrement。"
language: swift
project: "GRDB"
repo: https://github.com/groue/GRDB.swift
license: MIT
copyright: "Copyright (C) 2015-2025 Gwendal Roué"
commit: "92a554cd0d5e8d67cb18993c6054e73fe42c066c"
file: GRDB/Utils/Mutex.swift
lines: [36, 52]
function: "Mutex.increment() と decrement()"
difficulty: 2
tags: [並行処理, 防御的プログラミング]
format: 2
---
## ひとことで

複数のスレッドから同じカウンタを増やしたり減らしたりすると、途中の値が混ざって数が合わなくなることがあります。この拡張は、ロックの中で 1 回だけ増減を行い、その結果を返します。

## コード

```swift:line-numbers=36
extension Mutex where T: Numeric {
    @discardableResult
    func increment() -> T {
        withLock { n in
            n += 1
            return n
        }
    }
    
    @discardableResult
    func decrement() -> T {
        withLock { n in
            n -= 1
            return n
        }
    }
}
```

## 前提知識

- **`Mutex<T>`**: 値をロックで守る箱です。値を読んだり書いたりするときは、必ず `withLock` を通します。
- **`Numeric`**: 足し算と引き算ができる数の型をまとめた条件です。`where T: Numeric` と書くと、数値型の `Mutex` だけに、この拡張が付きます。
- **`@discardableResult`**: 戻り値を使わなくても、警告を出さない印です。増減の結果を捨てて呼べるようにしています。
- **クロージャの戻り値**: `withLock { n in ... return n }` のように、ロックの中で計算した値を返せます。

## 何をしているか

### 1. 増やしてから、新しい値を返す

`withLock` の中で、`n` を 1 増やし、その値を返します。ロックの中なので、ほかのスレッドが間に入りません。

```swift:line-numbers=37
    @discardableResult
    func increment() -> T {
        withLock { n in
            n += 1
            return n
        }
    }
```
### 2. 減らしてから、新しい値を返す

同じ形で、1 減らします。増やす処理と同じ方法で、ロックを 1 回だけかけます。

```swift:line-numbers=45
    @discardableResult
    func decrement() -> T {
        withLock { n in
            n -= 1
            return n
        }
    }
```
## ここがすごい

- **読んで書く処理を 1 回のロックに入れる**: `n += 1` の前後で、値が別のスレッドに変わることがありません。読み取りと書き込みが、ひとまとめに行われます。
- **結果をそのまま返す**: 増やした後の値が、同じロックの中で得られます。別に読み直すと、その間に値が変わっているかもしれません。
- **型の条件で守る範囲を決める**: 数値でない型に、誤って増減を付けられないようにしています。

## まとめ

- 増減は、ロックの中で 1 回だけ行う。
- 増やした後の値を、同じロックの中で返す。
- 数値型だけに、この操作を許す。
