---
title: "ビットフラグの集合に、要素を入れて入ったかを返す"
description: "OptionSet の insert(_:) で、要素を追加し、追加したかと追加後の要素を返す実装。複数のビットを持つ要素では、共通部分と比べて判定する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/OptionSet.swift
lines: [242, 254]
function: "OptionSet.insert(_:)"
difficulty: 2
tags: [ビット演算, API設計, 型システム]
format: 2
---
## ひとことで

`OptionSet` は、「速達」「翌日配送」「ギフト包装」のようなオン・オフの選択肢を、整数のビットで表す仕組みです。`[.standard, .priority]` のように、集合として書けます。`insert(_:)` は要素を追加し、`(inserted: 追加したか, memberAfterInsert: 追加後の要素)` を返します。これは `Set` の `insert` と同じ形の戻り値です。ただし、ビットを複数まとめた要素もあるので、判定には少し工夫が必要です。

## コード

```swift:line-numbers=242
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

- **`OptionSet` の例**: 配送オプションを表すとき、`rawValue` の各ビットを 1 つの選択肢にします。`static let express: ShippingOptions = [.nextDay, .secondDay]` のように、複数のビットをまとめた要素も作れます。
- **`intersection(_:)` と `formUnion(_:)`**: 共通部分を返すメソッドと、和集合にして自分を書き換えるメソッドです。ビットでは、それぞれ AND と OR にあたります。
- **ラベル付きタプル**: `(inserted: Bool, memberAfterInsert: Element)` は、名前付きで 2 つの値を返します。
- **`@discardableResult`**: 戻り値を使わなくても、警告が出ないようにする属性です。`options.insert(.priority)` と書くだけの人が多いためです。

## 何をしているか

`options` が `[.secondDay]`（`0b0010`）で、そこへ `.express`（`0b0011`）を入れる例で追います。

### 1. すでに入っている部分を求める

`intersection` で、既存の要素と新しい要素の共通部分を求めます。`0b0010 & 0b0011 = 0b0010` なので、すでに入っているビットだけが残ります。

```swift:line-numbers=245
    let oldMember = self.intersection(newMember)
```
### 2. 追加が必要かを判定する

共通部分が新しい要素と違うなら、まだ全部は入っていません。`0b0010 != 0b0011` なので、追加が必要だと判定します。すでに全部入っていれば、共通部分と新しい要素が等しくなり、何も変えません。

```swift:line-numbers=246
    let shouldInsert = oldMember != newMember
```
### 3. 結果を作ってから、和集合で追加する

戻り値を先に作り、追加が必要なら `formUnion` で和集合にします。この例では、結果は `(inserted: true, memberAfterInsert: .express)` で、`options` は `0b0011` になります。

```swift:line-numbers=247
    let result = (
      inserted: shouldInsert,
      memberAfterInsert: shouldInsert ? newMember : oldMember)
    if shouldInsert {
      self.formUnion(newMember)
    }
    return result
```
## ここがすごい

- **全部入っているかを共通部分で判定**: 単純なビットフラグなら `options & member != 0` で「入っているか」を見ます。しかし、複数ビットの要素では、一部だけ入っている場合を見分けられません。共通部分を取って元の要素と比べると、「全部入っている」かどうかが正確に分かります。
- **プロトコルの操作だけで書く**: この実装は `intersection` と `formUnion` という `SetAlgebra` の操作だけを使っています。ビット演算を直接書いていないので、`OptionSet` に準拠する型なら、どの型でも使えます。
- **Set と同じ戻り値の形**: `Set.insert` も `(inserted:memberAfterInsert:)` を返します。`OptionSet` を `Set` と同じように扱えるので、覚えることが少なくて済みます。
- **結果を先に作ってから変更する**: 戻り値を確定させてから自分を書き換えているので、判定と変更の順番が入れ替わることがありません。

## まとめ

- ビットフラグの集合は、`OptionSet` を使うと `Set` と同じように書ける。
- 複数のビットを持つ要素では、共通部分と比べて「全部入っているか」を判定する。
- プロトコルの操作だけで書いておくと、どの準拠型にも同じ実装を使える。
