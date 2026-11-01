---
title: "読み出しは、retain せずに値を見る"
description: "swift-atomics の ManagedAtomicLazyReference.load() が、アトミックに読み出した Unmanaged の値を、retain せずに takeUnretainedValue で取り出して返す処理。"
language: swift
project: "Swift Atomics"
repo: https://github.com/apple/swift-atomics
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 - 2023 Apple Inc. and the Swift project authors"
commit: "bc30c67cf0c4479633621ad7950d71494a07390f"
file: Sources/Atomics/Types/ManagedAtomicLazyReference.swift
lines: [99, 102]
function: "ManagedAtomicLazyReference.load()"
difficulty: 2
tags: [並行処理, 低レイヤ]
format: 2
---
## ひとことで

遅延して作られた値を、あとから読みたいことがあります。まだ作られていなければ、nil を返すだけで十分です。この関数は、アトミックに値を読み、参照の数を変えずに中身を取り出して返します。

## コード

```swift:line-numbers=99
  public func load() -> Instance? {
    let value = _Rep.atomicLoad(at: _ptr, ordering: .acquiring)
    return value?.takeUnretainedValue()
  }
```

## 前提知識

- **アトミックな読み出し**: 読んでいる途中に、ほかの処理が値を書き換えても壊れない読み出しです。
- **`acquiring` の順序**: ほかの処理が書き込んだ内容を、この読み出しの後の処理から必ず見えるようにする指定です。
- **`takeUnretainedValue()`**: `Unmanaged` から、retain を増やさずに参照を取り出します。
- **Optional の `?`**: 値が nil なら、そのまま nil を返します。

## 何をしているか

### 1. アトミックに値を読む

`atomicLoad` で、保存されている `Unmanaged` の値を読みます。まだ初期化されていなければ、ここでは nil になります。

```swift:line-numbers=100
    let value = _Rep.atomicLoad(at: _ptr, ordering: .acquiring)
```
### 2. 中身を取り出して返す

値があれば、`takeUnretainedValue()` で参照を取り出して返します。retain は増やしません。参照を保つ責任は、保存している側にあります。

```swift:line-numbers=101
    return value?.takeUnretainedValue()
```
## ここがすごい

- **読むだけなら軽い**: retain を増やさないので、読み出しのたびに参照数を動かしません。
- **初期化を待たない**: 値がまだなければ、nil を返すだけで、待ちは発生しません。
- **順序を守る**: `acquiring` の指定で、書き込みの結果が読み出し側から正しく見えます。

## まとめ

- アトミックに、保存されている値を読む。
- retain せずに、参照を取り出す。
- まだなければ nil を返し、ある場合は中身を返す。
