---
title: "順序を保つ辞書で、既存の値は位置を変えずに更新する"
description: "順序を保つ辞書の updateValue。既存のキーなら、値だけを書き換えて古い値を返す。新しいキーなら、順序の配列の末尾に追加して nil を返す。"
language: swift
project: "GRDB"
repo: https://github.com/groue/GRDB.swift
license: MIT
copyright: "Copyright (C) 2015-2025 Gwendal Roué"
commit: "92a554cd0d5e8d67cb18993c6054e73fe42c066c"
file: GRDB/Utils/OrderedDictionary.swift
lines: [71, 78]
function: "OrderedDictionary.updateValue(_:forKey:)"
difficulty: 1
tags: [データ構造, ハッシュ, 設計パターン]
format: 2
---
## ひとことで

GRDB の内部にある `OrderedDictionary` は、キーを **追加された順** に覚えている辞書です。普通の辞書は並び順が決まりませんが、この型では順序が保たれます。
`updateValue(_:forKey:)` は、値を書き込む関数です。キーがすでにあれば、位置は変えずに値だけを書き換えます。キーがなければ、末尾に追加します。

## コード

```swift:line-numbers=71
    @discardableResult
    mutating func updateValue(_ value: Value, forKey key: Key) -> Value? {
        if let oldValue = dictionary.updateValue(value, forKey: key) {
            return oldValue
        }
        keys.append(key)
        return nil
    }
```

## 前提知識

- **辞書（`Dictionary`）**: キーから値を素早く引ける型です。ただし、要素の並び順は保証されません。
- **二つの保存場所**: この型は、キーの配列 `keys` と、キーから値を引く辞書 `dictionary` を両方持ちます。並びは配列が、値の検索は辞書が担当します。
- **`@discardableResult`**: 戻り値を使わなくても、警告を出さないための属性です。

## 何をしているか

### 1. 辞書に値を入れ、古い値があったかを見る

まず辞書の `updateValue` を呼びます。辞書は、そのキーに前の値があれば、それを返します。

```swift:line-numbers=72
    mutating func updateValue(_ value: Value, forKey key: Key) -> Value? {
        if let oldValue = dictionary.updateValue(value, forKey: key) {
```
### 2. 既存のキーなら、古い値を返して終わる

前の値があった場合は、位置を変えずに、その値を返します。並び順の配列には、何もしません。

```swift:line-numbers=74
            return oldValue
        }
```
### 3. 新しいキーなら、末尾に追加する

前の値がなかった場合は、キーを並び順の配列の末尾に追加し、`nil` を返します。

```swift:line-numbers=76
        keys.append(key)
        return nil
```
例として、`foo` が位置 0、`bar` が位置 1 にあるとします。`foo` の値を書き換えても、順序は `foo, bar` のままです。`qux` を書き込むと、順序は `foo, bar, qux` になります。

## ここがすごい

- **値の更新は、並び順に影響しない**: 既存のキーを更新するときは、配列に触れません。配列の長さも変わらず、コストが小さいです。
- **古い値を返すので、変化を知れる**: 戻り値が `nil` かどうかで、新しく追加されたかを判定できます。
- **2 つの保存場所を、役割で分けている**: 値の検索は辞書、順序は配列と、役割ごとに保存場所を分けています。

## まとめ

- 順序を保つ辞書は、値の検索用の辞書と、キーの順序を持つ配列を組み合わせて作る。
- 既存のキーの更新は、位置を変えず、古い値を返す。
- 新しいキーは末尾に追加され、戻り値は `nil` になる。
