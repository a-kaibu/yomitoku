---
title: "空でなければ先頭を取り出し、空なら nil を返す"
description: "swift-nio の CircularBuffer.popFirst が、要素が残っているかを先に確かめ、あれば removeFirst で取り出し、なければ nil を返す処理。"
language: swift
project: "SwiftNIO"
repo: https://github.com/apple/swift-nio
license: Apache-2.0
copyright: "Copyright (c) 2017-2018 Apple Inc. and the SwiftNIO project authors"
commit: "108daca35da6a1b4ed8da29c1dfbd19668b9b8fc"
file: Sources/NIOCore/CircularBuffer.swift
lines: [558, 564]
function: "CircularBuffer.popFirst()"
difficulty: 1
tags: [データ構造, 防御的プログラミング]
format: 2
---
## ひとことで

キューのように、先頭から 1 つずつ取り出したいことがあります。要素がないときに取り出すとエラーになるので、この関数は、まず要素があるかを確かめます。空なら nil を返して、安全に終わります。

## コード

```swift:line-numbers=558
    public mutating func popFirst() -> Element? {
        if count > 0 {
            return self.removeFirst()
        } else {
            return nil
        }
    }
```

## 前提知識

- **`Optional` の戻り値**: 値があれば値を、なければ nil を返す型です。
- **`removeFirst()`**: 先頭の要素を取り出して、列から取り除きます。空の列では使えません。
- **`count`**: 要素の数です。ここでは 0 かどうかを確かめます。

## 何をしているか

### 1. 要素があるかを確かめる

`count` が 0 より大きいなら、先頭に取り出せる要素があります。

```swift:line-numbers=559
        if count > 0 {
```
### 2. あれば先頭を取り出す

要素があるときは、`removeFirst()` で先頭を取り出して返します。

```swift:line-numbers=560
            return self.removeFirst()
```
### 3. なければ nil を返す

要素がないときは、nil を返します。呼ぶ側は nil を見て、取り出し終わったと判断できます。

```swift:line-numbers=561
        } else {
            return nil
        }
```
## ここがすごい

- **エラーを起こさない**: 空の列に `removeFirst()` を呼ぶ前に確かめるので、実行時のエラーになりません。
- **終わりを型で表す**: 取り出せないことを、nil という値で伝えます。
- **呼ぶ側がループを書きやすい**: `while let` と組み合わせれば、空になるまで取り出せます。

## まとめ

- 要素があるかを、`count` で確かめる。
- あれば先頭を取り出す。
- なければ nil を返して、安全に終わる。
