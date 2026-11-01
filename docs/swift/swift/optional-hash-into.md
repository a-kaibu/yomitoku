---
title: "nil と値を、先頭の印で区別してハッシュする"
description: "Optional が Hashable になるための hash(into:) の実装。nil なら 0、値があれば 1 を先に混ぜてから中身を混ぜ、入れ子のオプショナルも区別する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Optional.swift
lines: [590, 599]
function: "Optional.hash(into:)"
difficulty: 1
tags: [ハッシュ, 型システム, 標準ライブラリ]
format: 2
---
## ひとことで

`Int?` のようなオプショナルを、`Set` や `Dictionary` のキーとして使えるようにする実装です。`nil` なら 0 という 1 バイトだけを混ぜます。値があるなら、先に 1 という 1 バイトを混ぜてから中身を混ぜます。こうすると、`nil` と値のハッシュがぶつかりにくくなります。`Optional(Optional(nil))` のような入れ子も区別できます。

## コード

```swift:line-numbers=590
  @inlinable
  public func hash(into hasher: inout Hasher) {
    switch self {
    case .none:
      hasher.combine(0 as UInt8)
    case .some(let wrapped):
      hasher.combine(1 as UInt8)
      hasher.combine(wrapped)
    }
  }
```

## 前提知識

- **`extension Optional: Hashable where Wrapped: Hashable`**: 「中身の型がハッシュ可能なら、そのオプショナルもハッシュ可能にする」という条件付きの準拠です。`Int` はハッシュ可能なので、`Int?` もハッシュ可能になります。
- **`hash(into:)`**: Swift のハッシュの仕組みです。値を直接返すのではなく、渡された `Hasher` に、自分を表すデータを `combine` で混ぜ込みます。最終的なハッシュ値は `Hasher` が計算します。
- **`inout`**: 引数を関数の中で書き換えると、呼び出し元にも反映されます。`Hasher` はこの形で受け取ります。
- **`case .none:` と `case .some(let wrapped):`**: オプショナルの 2 つの状態です。`.some(let wrapped)` は中身を `wrapped` という名前で取り出します。
- **`0 as UInt8`**: 0 を `UInt8` 型として書いています。1 バイトだけ混ぜるためです。

## 何をしているか

### 1. nil の場合

`nil` のときは、`0` という 1 バイトだけを混ぜます。

```swift:line-numbers=593
    case .none:
      hasher.combine(0 as UInt8)
```
### 2. 値がある場合

値があるときは、先に `1` という 1 バイトを混ぜ、そのあとに中身を混ぜます。`Optional(42)` なら、混ぜられるデータの並びは `[1, 42 のデータ]` になります。`nil` の `[0]` とは先頭の 1 バイトで区別されます。

```swift:line-numbers=595
    case .some(let wrapped):
      hasher.combine(1 as UInt8)
      hasher.combine(wrapped)
```
### 3. 入れ子のオプショナル

`Int??` では、外側が `nil` なら `[0]`、外側に値があって内側が `nil` なら `[1, 0]`、両方に値があれば `[1, 1, 42 のデータ]` になります。どの場合も、並びがすべて違います。

## ここがすごい

- **印を先に混ぜる**: もし `nil` のときに何も混ぜず、値のときは中身だけを混ぜると、`nil` と「中身が空のデータを混ぜる値」を区別できません。どの場合かを表す番号（判別子）を先に混ぜるのは、ハッシュを正しく作るための定石です。
- **`==` と矛盾しない**: ハッシュには、「a == b なら、ハッシュ値も同じでなければならない」という約束があります。`Optional` の `==` は、両方 `nil` のときと、両方に値があって中身が等しいときに true になります。このハッシュは、その約束を守っています。
- **`Hasher` に任せる設計**: 昔の `hashValue` を自分で計算する方式では、組み合わせ方を間違えると衝突が多くなりました。`hash(into:)` の方式では、データを順に混ぜるだけで、品質の高いハッシュが自動で得られます。

## まとめ

- 列挙型をハッシュするときは、どの場合かを表す印を先に混ぜる。
- ハッシュは `==` と矛盾してはいけない。等しいものは同じハッシュになるように作る。
- `hash(into:)` は、値を `Hasher` に混ぜるだけでよい安全な設計。
