---
title: "タプルと switch で書く、オプショナルどうしの =="
description: "Optional の等価比較。2 つのオプショナルをタプルにまとめて switch し、両方に値がある・両方 nil・それ以外の 3 つの場合をパターンマッチで書き分ける。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Optional.swift
lines: [571, 581]
function: "Optional.==(_:_:)"
difficulty: 1
tags: [型システム, イディオム, 標準ライブラリ]
format: 2
---
## ひとことで

Swift のオプショナル（`Int?` のような「値があるか、`nil`」の型）どうしは、`==` で比べられます。`Optional(3) == Optional(3)` は true、`nil == nil` も true、`Optional(3) == nil` は false です。
この実装は、2 つの値を **タプルにまとめて `switch`** し、3 つの場合をパターンマッチで書き分けています。Swift らしい書き方の見本です。

## コード

```swift:line-numbers=571
  @_transparent
  public static func ==(lhs: Wrapped?, rhs: Wrapped?) -> Bool {
    switch (lhs, rhs) {
    case let (l?, r?):
      return l == r
    case (nil, nil):
      return true
    default:
      return false
    }
  }
```

## 前提知識

- **オプショナル `Wrapped?`**: `Optional<Wrapped>` の省略形です。中身は `enum Optional { case none; case some(Wrapped) }` という列挙型で、`nil` は `.none` のことです。
- **`static func ==`**: 演算子を型のメソッドとして定義しています。この `==` は、中身の型 `Wrapped` が `Equatable`（`==` で比べられる）のときだけ使えます（この拡張は `where Wrapped: Equatable` で宣言されています）。
- **`@_transparent`**: 必ずインライン化される、標準ライブラリ用の属性です。
- **タプル `(lhs, rhs)`**: 2 つの値を 1 つにまとめたものです。`switch` で両方を同時に調べられます。
- **`case let (l?, r?)`**: 「両方とも値がある」パターンです。`l?` は「`.some(l)` にマッチし、中身を `l` に入れる」という意味です。
- **`case (nil, nil)`**: 両方とも `nil` のパターンです。
- **`default`**: それ以外（片方だけ `nil`）。

## 何をしているか

### 1. 両方に値がある場合

`Optional(3) == Optional(3)` は `(3?, 3?)` なので、この `case` にマッチします。中身を `l` と `r` に取り出し、中身の型の `==` で比べます。

```swift:line-numbers=574
    case let (l?, r?):
      return l == r
```

### 2. 両方 nil の場合

`nil == nil` は `(nil, nil)` にマッチし、true を返します。

```swift:line-numbers=576
    case (nil, nil):
      return true
```

### 3. それ以外

片方だけ `nil` ならどちらの `case` にもマッチしないので、`default` で false を返します。

```swift:line-numbers=578
    default:
      return false
```


## ここがすごい

- **タプルで 2 つの値を同時にパターンマッチ**: `if let l = lhs, let r = rhs { ... } else if lhs == nil && rhs == nil { ... }` のように書くこともできますが、`switch (lhs, rhs)` にすると、すべての組み合わせを 1 か所で見渡せます。さらに Swift の `switch` は網羅性をチェックするので、場合分けの漏れがあればコンパイルエラーになります。
- **`nil` どうしは等しい**: `nil == nil` を true にするかどうかは言語によって違います（SQL の `NULL = NULL` は真になりません）。Swift はオプショナルを「値がない」という 1 つの状態として扱うので、両方 `nil` なら等しい、と決めています。
- **中身の `==` に任せる**: 両方に値があるときは、中身の型の `==` をそのまま使います。オプショナル自身は「包み」の部分だけを担当し、比較の本体は中身に委ねる、という役割分担です。

## まとめ

- 2 つの値の組み合わせで処理を分けるときは、タプルにして `switch` すると見通しがよい。
- `case let (l?, r?)` で「両方に値があるとき、中身を取り出す」を 1 行で書ける。
- Swift では値を自動でオプショナルに包むので、`値 == オプショナル` も同じ `==` で比べられる。
