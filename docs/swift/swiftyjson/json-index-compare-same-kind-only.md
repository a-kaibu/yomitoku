---
title: "配列の番号と辞書のキーを、同じ種類どうしだけ比べる"
description: "JSON の添字を、配列の番号か辞書のキーかの列挙型で表し、同じ種類の添字どうしだけを比べる SwiftyJSON の Index の == と <。"
language: swift
project: "SwiftyJSON"
repo: https://github.com/SwiftyJSON/SwiftyJSON
license: MIT
copyright: "Copyright (c) 2014 - 2017 Ruoyu Fu, Pinglin Tang"
commit: "3d2544101a03f22b2217d464dc7d359eeb86e159"
file: Source/SwiftyJSON/SwiftyJSON.swift
lines: [274, 295]
function: "Index の == と <"
difficulty: 2
tags: [型システム, API設計]
format: 2
---
## ひとことで

SwiftyJSON で JSON の中の場所を指す添字は、配列の番号か、辞書のキーの位置か、または何もない（null）かのどれかです。この型は、種類が同じ添字どうしだけを比べ、違う種類の添字は等しくないと判定します。

## コード

```swift:line-numbers=274
public enum Index<T: Any>: Comparable {
    case array(Int)
    case dictionary(DictionaryIndex<String, T>)
    case null

    static public func == (lhs: Index, rhs: Index) -> Bool {
        switch (lhs, rhs) {
        case (.array(let left), .array(let right)):           return left == right
        case (.dictionary(let left), .dictionary(let right)): return left == right
        case (.null, .null):                                  return true
        default:                                              return false
        }
    }

    static public func < (lhs: Index, rhs: Index) -> Bool {
        switch (lhs, rhs) {
        case (.array(let left), .array(let right)):           return left < right
        case (.dictionary(let left), .dictionary(let right)): return left < right
        default:                                              return false
        }
    }
}
```

## 前提知識

- **列挙型と関連値**: `case array(Int)` のように、ケースごとに値を持つ型です。どの種類の添字かと、その中身を 1 つにまとめて表せます。
- **`Comparable`**: `<` で大小を比べられる型の条件です。`<` を定義すると、並べ替えなどにも使えます。
- **タプルの `switch`**: `switch (lhs, rhs)` のように、2 つの値を組にして、同時に種類を照らし合わせられます。
- **`DictionaryIndex`**: 辞書の中の位置を表す型です。同じ辞書の中の位置どうしなら、比べられます。

## 何をしているか

### 1. 等しさは、同じ種類で中身が同じときだけ

配列どうしなら番号を比べ、辞書どうしなら辞書の位置を比べます。`null` どうしは等しく、それ以外の組み合わせは `false` です。

```swift:line-numbers=279
    static public func == (lhs: Index, rhs: Index) -> Bool {
        switch (lhs, rhs) {
        case (.array(let left), .array(let right)):           return left == right
        case (.dictionary(let left), .dictionary(let right)): return left == right
        case (.null, .null):                                  return true
        default:                                              return false
        }
    }
```
### 2. 大小は、同じ種類の配列か辞書の中だけで決める

配列どうしなら番号の大小で、辞書どうしなら辞書の位置の大小で決めます。違う種類や `null` が含まれる場合は、`false` を返します。

```swift:line-numbers=288
    static public func < (lhs: Index, rhs: Index) -> Bool {
        switch (lhs, rhs) {
        case (.array(let left), .array(let right)):           return left < right
        case (.dictionary(let left), .dictionary(let right)): return left < right
        default:                                              return false
        }
    }
```
## ここがすごい

- **違う種類を混ぜない**: 配列の番号と、辞書の位置を、勝手に比べません。`default` の分岐が、そうした比較を「等しくない」「小さくない」として扱います。
- **`null` の扱いがはっきりしている**: `null` は、どの場所とも大小を比べません。そのため、並べ替えで意味のない順序が生まれません。
- **タプルの `switch` で読みやすい**: 2 つの値の組み合わせを、表のように並べられるので、どの組み合わせがどう扱われるかが一目で分かります。

## まとめ

- 添字は、配列の番号、辞書の位置、null の 3 種類で表す。
- 等しさと大小は、同じ種類どうしの組み合わせだけで決める。
- 違う種類の組み合わせは、等しくなく、大小もない扱いにする。
