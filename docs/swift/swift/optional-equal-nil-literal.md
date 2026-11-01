---
title: "Equatable でない型でも x == nil と書ける理由"
description: "中身が比較できない型のオプショナルでも「== nil」と書けるようにする仕組み。nil リテラル専用の空っぽの型を用意し、その型を受け取る == をオーバーロードしている。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Optional.swift
lines: [681, 693]
function: "Optional.==(_:_:)（nil リテラルとの比較）"
difficulty: 2
tags: [型システム, API設計, ハック, 標準ライブラリ]
format: 2
---
## ひとことで

オプショナルどうしの `==` は、中身の型が `Equatable`（比べられる）でないと使えません。でも、どんな型でも「`nil` かどうか」は知りたいものです。
Swift では、比べられない型（たとえばクロージャや独自のクラス）のオプショナルでも `if stream == nil` と書けます。その秘密が、この **`nil` リテラル専用の `==`** です。

## コード

```swift:line-numbers=681
  @_transparent
  @_preInverseGenerics
  public static func ==(
    lhs: borrowing Wrapped?,
    rhs: _OptionalNilComparisonType
  ) -> Bool {
    switch lhs {
    case .some:
      return false
    case .none:
      return true
    }
  }
```

## 前提知識

- **`_OptionalNilComparisonType`**: 同じファイルで定義されている、中身が空の構造体です。`ExpressibleByNilLiteral` に準拠しているので、`nil` と書くとこの型の値になれます。
- **`ExpressibleByNilLiteral`**: 「`nil` リテラルから作れる」型であることを示すプロトコルです。オプショナルもこれに準拠しています。
- **オーバーロード**: 同じ名前の関数（ここでは `==`）を、引数の型を変えて複数定義することです。Swift は引数の型に合うものを選びます。
- **`borrowing`**: 「この値を借りるだけで、所有権はもらわない」という印です。コピーできない型（`~Copyable`）にも対応するための指定です。
- **`@_preInverseGenerics`**: コピーできない型への対応を後から加えたとき、以前のバイナリとの互換性を保つための内部属性です。
- **`case .some:`**: 中身を取り出さずに「値があるか」だけを見るパターンです。

## 何をしているか

### 1. 空の型で受け取る

`nil` リテラルは、`_OptionalNilComparisonType` という中身のない型として解釈されます。そのため、比べられない型の `Wrapped` でも、この `==` が選ばれます。

```swift:line-numbers=605
public struct _OptionalNilComparisonType: ExpressibleByNilLiteral {
  /// Create an instance initialized with `nil`.
  @_transparent
  public init(nilLiteral: ()) {
  }
}
```

### 2. 中身を見ずに判定する

`.some` なら false、`.none` なら true を返します。中身の値には一切触れないので、`Wrapped` が `Equatable` かどうかは関係ありません。

```swift:line-numbers=686
  ) -> Bool {
    switch lhs {
    case .some:
      return false
    case .none:
      return true
    }
```


## ここがすごい

- **空っぽの型で「nil だけ」を受け取る**: 引数の型を `Wrapped?` にすると、任意のオプショナルが来てしまいます。`nil` リテラルだけを受け取る専用の型を作ることで、「`nil` と比べるときだけ使われる `==`」を作れます。値を持たない型（サイズ 0）なので、実行時のコストもありません。
- **型の制約を回避するテクニック**: 「比べられない型でも、`nil` かどうかだけは比べたい」という要望を、言語機能を追加せずにライブラリの中だけで実現しています。オーバーロードとリテラルのプロトコルを組み合わせた、Swift らしい工夫です。
- **中身に触れない比較**: `case .some:` は中身を取り出しません。`borrowing` と合わせて、コピーできない値や大きな値でも、余計なコピーなしで判定できます。

## まとめ

- `nil` リテラルだけを受け取る空の型を作ると、「`nil` との比較」専用の関数をオーバーロードできる。
- リテラル用のプロトコル（`ExpressibleByNilLiteral` など）を使うと、リテラルの解釈を型で制御できる。
- 中身を見ない判定なら、中身の型の能力（`Equatable` など）は要らない。
