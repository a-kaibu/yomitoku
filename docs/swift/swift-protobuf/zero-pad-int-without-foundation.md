---
title: "Foundation を使わずに、桁数をそろえた数字の文字列を作る"
description: "String(format:) を使えない環境でも動くように、0 を前に足して桁数をそろえる SwiftProtobuf の formatZeroPaddedInt と、その桁数ごとの関数。"
language: swift
project: "SwiftProtobuf"
repo: https://github.com/apple/swift-protobuf
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2016 Apple Inc. and the project authors"
commit: "61e40fbe39c7b40e48dec12ac96f73521372f34e"
file: Sources/SwiftProtobuf/StringUtils.swift
lines: [33, 46]
function: "formatZeroPaddedInt(_:digits:)"
difficulty: 1
tags: [文字列処理, 移植性]
format: 2
---
## ひとことで

日付の「05 日」や、時刻の「007 ミリ秒」のように、桁数をそろえた数字が必要になることがあります。この関数は、足りない桁を `0` で埋めて、指定した桁数の文字列を作ります。

## コード

```swift:line-numbers=33
private func formatZeroPaddedInt(_ value: Int32, digits: Int) -> String {
    precondition(value >= 0)
    let s = String(value)
    if s.count >= digits {
        return s
    } else {
        let pad = String(repeating: "0", count: digits - s.count)
        return pad + s
    }
}

internal func twoDigit(_ value: Int32) -> String {
    formatZeroPaddedInt(value, digits: 2)
}
```

## 前提知識

- **`String(format:)`**: C の書式指定に似た方法で、桁数をそろえた文字列を作れる関数です。ただし、Foundation に依存するので、一部の環境では使えません。
- **`precondition`**: 条件が満たされないと、実行を止める検査です。ここでは、値が負でないことを確かめています。
- **`String(repeating:count:)`**: 同じ文字を指定した回数だけ並べた文字列を作ります。ここでは `0` の列を作るのに使います。
- **文字列の連結**: `+` で、2 つの文字列をつなげられます。

## 何をしているか

### 1. 数字を文字列にして、桁数を比べる

値を文字列にして、その長さが指定の桁数以上なら、そのまま返します。

```swift:line-numbers=34
    precondition(value >= 0)
    let s = String(value)
    if s.count >= digits {
        return s
```
### 2. 足りない分だけ、先頭に 0 を付ける

桁数が足りないときは、足りない個数の `0` を作って、数字の前に付けます。

```swift:line-numbers=38
    } else {
        let pad = String(repeating: "0", count: digits - s.count)
        return pad + s
    }
```
### 3. 桁数ごとの短い関数を用意する

2 桁、3 桁などの呼び出しは、この関数に桁数を渡すだけの関数です。よく使う桁数を名前で書けるようにしています。

```swift:line-numbers=44
internal func twoDigit(_ value: Int32) -> String {
    formatZeroPaddedInt(value, digits: 2)
}
```
## ここがすごい

- **Foundation に頼らない**: 標準ライブラリの機能だけで書かれているので、どの環境でも使えます。移植性の高い書き方です。
- **長さが十分なら何もしない**: 桁数が超えているときは、そのまま返します。切り詰めて情報を失うことはありません。
- **名前で用途が分かる**: `twoDigit` や `nineDigit` のように、桁数の意味が名前に表れます。呼ぶ側の意図が読みやすくなります。

## まとめ

- 数字を文字列にして、足りない桁だけ 0 を前に付ける。
- 桁数が十分なら、そのまま返す。
- Foundation の書式機能が使えない場所でも、同じ結果を得られる。
