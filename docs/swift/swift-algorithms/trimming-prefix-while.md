---
title: "条件が真のあいだだけ先頭を削る、trimmingPrefix"
description: "先頭から条件を満たす要素だけを取り除いたスライスを返す関数。コピーを作らず、残りの範囲を指す添字を返すだけで済む。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Trim.swift
lines: [33, 39]
function: "Collection.trimmingPrefix(while:)"
difficulty: 1
tags: [イテレータ, 標準ライブラリ, イディオム]
format: 2
---
## ひとことで

`trimmingPrefix(while:)` は、先頭から条件を満たすあいだだけ要素を取り除いた、残りの部分を返します。たとえば `"  hello"` から先頭の空白だけを取り除くとき、`"hello"` の部分が得られます。
要素を新しく作ってコピーするのではなく、元のコレクションの一部を指すスライスを返します。

## コード

```swift:line-numbers=33
  @inlinable
  public func trimmingPrefix(
    while predicate: (Element) throws -> Bool
  ) rethrows -> SubSequence {
    let start = try endOfPrefix(while: predicate)
    return self[start..<endIndex]
  }
```

## 前提知識

- **`endOfPrefix(while:)`**: 先頭から条件を満たすあいだ進み、その次の位置を返すメソッドです。
- **`SubSequence`**: そのコレクションの一部分を表す型です。元のデータを共有するので、コピーはしません。
- **`rethrows`**: 引数の関数がエラーを投げたときだけ、この関数もエラーを投げます。
- **`self[start..<endIndex]`**: 元のコレクションの一部を取り出します。

## 何をしているか

### 1. 条件を満たす終わりを探す

`endOfPrefix(while:)` で、条件が偽になる最初の位置を求めます。その位置が、残す部分の始まりです。

```swift:line-numbers=37
    let start = try endOfPrefix(while: predicate)
```
### 2. 残りの部分を返す

その位置から末尾までを、スライスとして返します。

```swift:line-numbers=38
    return self[start..<endIndex]
```
## ここがすごい

- **コピーが起きない**: 残す部分は元のデータの一部を指すスライスです。長いデータでも、先頭を削るだけなら、メモリの使用量はほとんど増えません。
- **`rethrows` で同期にも非同期にも対応**: 条件が投げるエラーの有無に応じて、呼び出し側も普通の関数として使えます。
- **探す処理を再利用する**: 削る位置を決めるのは `endOfPrefix` の仕事です。`trimmingPrefix` は、位置から範囲を作るだけになっています。

## まとめ

- 先頭を削る操作は、残りの部分を指すスライスを返せば、コピーなしで済む。
- 条件の判定は、探す関数に任せると、コードが短くなる。
- `rethrows` を使うと、条件のエラーを呼び出し側へ正しく伝えられる。
