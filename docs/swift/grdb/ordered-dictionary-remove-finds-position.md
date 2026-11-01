---
title: "順序を保つ辞書から、キーを消すときに位置も探して消す"
description: "順序を保つ辞書の removeValue。辞書からは値を消し、キーの順序の配列からも同じキーの位置を探して消す。二つの保存場所を一致させるための処理。"
language: swift
project: "GRDB"
repo: https://github.com/groue/GRDB.swift
license: MIT
copyright: "Copyright (C) 2015-2025 Gwendal Roué"
commit: "92a554cd0d5e8d67cb18993c6054e73fe42c066c"
file: GRDB/Utils/OrderedDictionary.swift
lines: [81, 89]
function: "OrderedDictionary.removeValue(forKey:)"
difficulty: 2
tags: [データ構造, 探索, ハッシュ]
format: 2
---
## ひとことで

順序を保つ辞書は、値を辞書に、キーの順序を配列に持ちます。キーを削除するときは、両方から消す必要があります。
`removeValue(forKey:)` は、まず辞書から値を消し、そのキーが配列のどこにあるかを探して、配列からも消します。どちらか一方だけが残ることがないようにしています。

## コード

```swift:line-numbers=81
    @discardableResult
    mutating func removeValue(forKey key: Key) -> Value? {
        guard let value = dictionary.removeValue(forKey: key) else {
            return nil
        }
        let index = keys.firstIndex { $0 == key }!
        keys.remove(at: index)
        return value
    }
```

## 前提知識

- **二つの保存場所を一致させる**: 値の辞書とキーの配列は、同じキーの集合を持つ必要があります。片方だけ消すと、順序が壊れたり、探せなくなったりします。
- **`firstIndex(where:)`**: 条件に合う最初の位置を、配列から探す関数です。見つからなければ `nil` を返します。
- **`!`（強制アンラップ）**: `nil` ではないと分かっている値を、取り出す書き方です。

## 何をしているか

### 1. 辞書からキーの値を消す

まず辞書から、キーに対応する値を消します。そのキーがなければ、何もせず `nil` を返します。

```swift:line-numbers=82
    mutating func removeValue(forKey key: Key) -> Value? {
        guard let value = dictionary.removeValue(forKey: key) else {
            return nil
        }
```
### 2. 順序の配列で、キーの位置を探す

辞書にあったキーは、必ず配列にもあります。そこで、配列から同じキーを探し、その位置を求めます。強制アンラップは、この前提があるから安全です。

```swift:line-numbers=86
        let index = keys.firstIndex { $0 == key }!
```
### 3. 配列から消して、値を返す

求めた位置から、配列の要素を消します。消した値を返して終わります。

```swift:line-numbers=87
        keys.remove(at: index)
        return value
```
例として、`foo`、`bar`、`qux` の順に入っているとします。`bar` を消すと、辞書から `bar` が消え、配列の位置 1 にある `bar` も消えます。残りは `foo, qux` の順です。

## ここがすごい

- **消すのは 1 件だけでも、順序が保たれる**: 配列から消したあとも、残りの要素の順番は変わりません。
- **辞書で存在を確かめてから、配列を探す**: 辞書に値がなければ、配列を探しません。存在しないキーの削除は、すぐに終わります。
- **注意: 配列の探索は、件数に比例して遅くなる**: キーの位置は、先頭から比べて探すので、件数が多いと時間がかかります。頻繁に削除する大きな辞書では、この点を考える必要があります。

## まとめ

- 順序を保つ辞書の削除は、辞書と配列の両方から同じキーを消す必要がある。
- 配列の位置は、先頭から探すので、件数が多いと遅くなる。
- 辞書に値がなければ、配列を探さずに終わる。
