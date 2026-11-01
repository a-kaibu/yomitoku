---
title: "ネストした辞書と配列を、URL のキーと値の組に平らにする"
description: "Alamofire がクエリ文字列を作るときの再帰関数。辞書や配列の入れ子を「key[name][0]」のようなキーに変えながら、最後の値の組をすべて集める。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2018 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/ParameterEncoding.swift
lines: [196, 219]
function: "URLEncoding.queryComponents(fromKey:value:)"
difficulty: 2
tags: [再帰, 型システム, ネットワーク]
format: 2
---
## ひとことで

Alamofire の `URLEncoding` は、`["user": ["name": "Ann", "tags": ["a", "b"]]]` のような入れ子の辞書を、`user[name]=Ann&user[tags][]=a&user[tags][]=b` のような URL のクエリ文字列に変換します。
`queryComponents(fromKey:value:)` は、その変換の中心です。入れ子を 1 段ずつ下りながら、最後の値の組（キー, 値）を配列にして返します。

## コード

```swift:line-numbers=196
    public func queryComponents(fromKey key: String, value: Any) -> [(String, String)] {
        var components: [(String, String)] = []
        switch value {
        case let dictionary as [String: Any]:
            for (nestedKey, value) in dictionary {
                components += queryComponents(fromKey: "\(key)[\(nestedKey)]", value: value)
            }
        case let array as [Any]:
            for (index, value) in array.enumerated() {
                components += queryComponents(fromKey: arrayEncoding.encode(key: key, atIndex: index), value: value)
            }
        case let number as NSNumber:
            if number.isBool {
                components.append((escape(key), escape(boolEncoding.encode(value: number.boolValue))))
            } else {
                components.append((escape(key), escape("\(number)")))
            }
        case let bool as Bool:
            components.append((escape(key), escape(boolEncoding.encode(value: bool))))
        default:
            components.append((escape(key), escape("\(value)")))
        }
        return components
    }
```

## 前提知識

- **`switch` の型パターン**: `case let dictionary as [String: Any]:` は、値がその型なら中身を `dictionary` に取り出して、その `case` を実行します。
- **`Any`**: どんな型の値でも入る型です。JSON のような形を、型を決めずに扱えます。
- **`NSNumber`**: Objective-C 由来の数値の箱です。`Bool` も数値として入ってくることがあるため、判定が必要になります。
- **`+=`（配列の連結）**: 配列の後ろに、別の配列の要素を追加します。
- **`escape`**: キーや値を URL で安全に使える形に変換する関数です（同じ型の別のメソッド）。

## 何をしているか

### 1. 辞書のとき

各鍵に対して、キーを `key[鍵]` の形にして、自分自身を再帰的に呼びます。

```swift:line-numbers=199
        case let dictionary as [String: Any]:
            for (nestedKey, value) in dictionary {
                components += queryComponents(fromKey: "\(key)[\(nestedKey)]", value: value)
            }
```
### 2. 配列のとき

配列の要素を 1 つずつ、`arrayEncoding` が決めた形のキーで再帰します。既定では `key[]` の形です。

```swift:line-numbers=203
        case let array as [Any]:
            for (index, value) in array.enumerated() {
                components += queryComponents(fromKey: arrayEncoding.encode(key: key, atIndex: index), value: value)
            }
```
### 3. 数値・真偽値・それ以外

値そのものを `escape` して、組にして追加します。`NSNumber` の中の `Bool` は、`boolEncoding` で `1` や `true` などに変換します。

```swift:line-numbers=207
        case let number as NSNumber:
            if number.isBool {
                components.append((escape(key), escape(boolEncoding.encode(value: number.boolValue))))
            } else {
                components.append((escape(key), escape("\(number)")))
            }
        case let bool as Bool:
            components.append((escape(key), escape(boolEncoding.encode(value: bool))))
        default:
            components.append((escape(key), escape("\(value)")))
        }
```
## ここがすごい

- **1 つの関数で入れ子を全部処理**: 辞書も配列も、同じ関数が自分自身を呼ぶことで、どこまでも深く下りられます。深さに上限を設けなくて済みます。
- **キーの組み立てが再帰と一緒に進む**: 外側のキーを、内側の呼び出しに少しずつ付け足していきます。最終的なキーは、通ってきた道をそのまま表します。
- **型の判定を上から順に**: `switch` の順番を並べるだけで、辞書、配列、数値、真偽値、その他を見分けます。`NSNumber` の `Bool` を先に判定しているのは、通常の `Bool` と区別するためです。

## まとめ

- 入れ子のデータは、再帰で「通ってきたキー」を作りながら平らにできる。
- 型のパターンを順に並べると、データの種類ごとの処理がはっきりする。
- 変換の方法（配列のキーの書き方など）を外から差し替えられると、同じ関数で仕様の違いに対応できる。
