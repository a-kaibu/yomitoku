---
title: "nil と値を区別する、オプショナルのハッシュ"
description: "Optional をハッシュ値に変える hash(into:)。nil なら 0、値があるなら 1 を先に混ぜてから中身を混ぜることで、nil と「中身のハッシュが偶然同じ値」とを区別する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Optional.swift
lines: [584, 600]
function: "Optional.hash(into:)"
difficulty: 1
tags: [ハッシュ, 型システム, 標準ライブラリ]
---
## ひとことで

`Int?` のようなオプショナルを、`Set` や `Dictionary` のキーとして使えるようにする実装です。
`nil` なら `0` という 1 バイトだけを、値があるなら **先に `1` という 1 バイトを混ぜてから** 中身を混ぜます。こうすると、`nil` と値のハッシュがぶつかりにくくなり、`Optional(Optional(nil))` のような入れ子も区別できます。

## コード

```swift:line-numbers=584
extension Optional: Hashable where Wrapped: Hashable {
  /// Hashes the essential components of this value by feeding them into the
  /// given hasher.
  ///
  /// - Parameter hasher: The hasher to use when combining the components
  ///   of this instance.
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
}
```

## 前提知識

- **`extension Optional: Hashable where Wrapped: Hashable`**: 「中身の型がハッシュ可能なら、そのオプショナルもハッシュ可能にする」という条件付きの準拠です。`Int` はハッシュ可能なので、`Int?` もハッシュ可能になります。
- **`hash(into hasher: inout Hasher)`**: Swift のハッシュの仕組みです。値を直接返すのではなく、渡された `Hasher` に、自分を表すデータを `combine` で混ぜ込みます。最終的なハッシュ値は `Hasher` が計算します。
- **`inout`**: 引数を関数の中で書き換えると、呼び出し元にも反映されます。
- **`case .none:` / `case .some(let wrapped):`**: オプショナルの 2 つの状態です。`.some(let wrapped)` は中身を `wrapped` という名前で取り出します。
- **`0 as UInt8`**: 0 を `UInt8` 型として書いています。1 バイトだけ混ぜるためです。

## 何をしているか

- `nil` の場合（この部分）: `hasher.combine(0 as UInt8)` だけ。
- `Optional(42)` の場合（この部分）: `hasher.combine(1 as UInt8)` のあと、`hasher.combine(42)`。

`Hasher` に入るデータの並びは、`nil` なら `[0]`、`Optional(42)` なら `[1, 42 のデータ]` になります。先頭の 1 バイトで、どちらの状態かがはっきり区別されます。

### 入れ子のオプショナル

`Int??`（オプショナルのオプショナル）では、外側が `nil` なら `[0]`、外側に値があって内側が `nil` なら `[1, 0]`、両方に値があれば `[1, 1, 42 のデータ]` です。全部違う並びになります。

## ここがすごい

- **「印」を先に混ぜる**: もし `nil` のときに何も混ぜず、値のときは中身だけを混ぜると、`nil` と「中身が空のデータを混ぜる値」の区別がつかなくなります。列挙型のどの場合かを表す番号（判別子）を先に混ぜるのは、ハッシュを正しく作るための定石です。Swift の自動生成されるハッシュ実装も同じ考え方です。
- **`==` と矛盾しない**: ハッシュには「`a == b` なら、ハッシュ値も同じでなければいけない」という約束があります。`Optional` の `==` は「両方 `nil`」「両方値があって中身が等しい」で true になるので（同じファイルのこの部分）、このハッシュはその約束を守っています。
- **`Hasher` に任せる設計**: `hashValue` を自分で計算させる昔の方式では、組み合わせ方を間違えると衝突だらけになりました。`hash(into:)` 方式では、データを順に混ぜるだけで、品質の高いハッシュ（SipHash）が自動で得られます。

## まとめ

- 列挙型をハッシュするときは、どの場合かを表す印を先に混ぜる。
- ハッシュは `==` と矛盾してはいけない。等しいものは同じハッシュになるように作る。
- Swift の `hash(into:)` は、値を `Hasher` に混ぜるだけでよい安全な設計。
