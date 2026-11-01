---
title: "ビットフラグの集合でも「入っていたか」を正しく返す insert"
description: "OptionSet（ビットフラグの集合）への挿入。複数のビットをまとめた要素も入れられるので、共通部分を取って「全部入っていたか」を判定し、Set と同じ形の結果を返す。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/OptionSet.swift
lines: [240, 254]
function: "OptionSet.insert(_:)"
difficulty: 2
tags: [ビット演算, API設計, 標準ライブラリ]
---
## ひとことで

`OptionSet` は、「速達」「翌日配送」「ギフト包装」のようなオン・オフの選択肢を、整数のビットで表す仕組みです。`[.standard, .priority]` のように集合として書けます。
`insert(_:)` は要素を追加し、`(inserted: 追加したか, memberAfterInsert: 追加後の要素)` を返します。これは `Set` の `insert` と同じ形の戻り値です。ビットフラグでは「複数のビットをまとめた要素」もあるので、判定には少し工夫が必要です。

## コード

```swift:line-numbers=240
  @inlinable // generic-performance
  @discardableResult
  public mutating func insert(
    _ newMember: Element
  ) -> (inserted: Bool, memberAfterInsert: Element) {
    let oldMember = self.intersection(newMember)
    let shouldInsert = oldMember != newMember
    let result = (
      inserted: shouldInsert,
      memberAfterInsert: shouldInsert ? newMember : oldMember)
    if shouldInsert {
      self.formUnion(newMember)
    }
    return result
  }
```

## 前提知識

- **`OptionSet` の例**: ドキュメントでは配送オプションの例が使われています。

  ```swift
  struct ShippingOptions: OptionSet {
      let rawValue: Int
      static let nextDay    = ShippingOptions(rawValue: 1 << 0)
      static let secondDay  = ShippingOptions(rawValue: 1 << 1)
      static let priority   = ShippingOptions(rawValue: 1 << 2)
      static let standard   = ShippingOptions(rawValue: 1 << 3)
      static let express: ShippingOptions = [.nextDay, .secondDay]
  }
  ```

  `express` は 2 つのビットをまとめた要素です。
- **`intersection(_:)` / `formUnion(_:)`**: 共通部分を返す・和集合にする（自分を書き換える）メソッドです。ビットでは AND と OR にあたります。
- **ラベル付きタプル**: `(inserted: Bool, memberAfterInsert: Element)` は、名前付きで 2 つの値を返します。
- **`@discardableResult`**: 戻り値を使わなくても警告が出ません。`options.insert(.priority)` と書くだけの人が多いからです。
- **`@inlinable // generic-performance`**: ジェネリックなコードを呼び出し側で特殊化できるように中身を公開しています。

## 何をしているか

`options = [.secondDay]`（`0b0010`）に `.express`（`0b0011`）を入れる例で追います。

1.この部分: `oldMember = options ∩ express = 0b0010`。すでに入っているビットだけが残ります。
2.この部分: `oldMember != newMember`（`0b0010 != 0b0011`）なので、`shouldInsert = true`。一部しか入っていないので、追加が必要です。
3.この部分: 結果は `(inserted: true, memberAfterInsert: .express)`。
4.この部分: 和集合を取り、`options = 0b0011` になります。

もし `options` がすでに `[.nextDay, .secondDay]` なら、`oldMember == newMember` なので、`(false, oldMember)` を返し、何も変更しません。

## ここがすごい

- **「全部入っているか」を共通部分で判定**: 単純なビットフラグなら `options & member != 0` で「入っているか」を見ますが、それでは複数ビットの要素で「一部だけ入っている」を見分けられません。共通部分を取って元の要素と比べることで、**すべてのビットが入っているか** を正しく判定しています。
- **プロトコルの機能だけで書く**: この実装は `intersection` と `formUnion` という `SetAlgebra` の操作だけを使っています。ビット演算を直接書いていないので、`OptionSet` に準拠するどんな型でも使えます。実際には、別の場所で `rawValue` の AND・OR として実装されます。
- **Set と同じ戻り値の形**: `Set.insert` も `(inserted:memberAfterInsert:)` を返します。`OptionSet` を `Set` と同じように扱えるので、学ぶことが少なくて済みます。
- **結果を先に作ってから変更**:この部分結果を作ってからこの部分自分を書き換えています。変更の前に答えを確定させているので、順番の取り違えが起きません。

## まとめ

- ビットフラグの集合は、`OptionSet` を使うと `Set` のように書ける。
- 複数のビットを持つ要素では、「共通部分 == 要素」で全部入っているかを判定する。
- プロトコルの操作だけで書いておくと、どの準拠型にも同じ実装を使える。
