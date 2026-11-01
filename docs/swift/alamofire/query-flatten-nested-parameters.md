---
title: "入れ子のパラメータを、クエリ項目の一覧へ平らにする"
description: "辞書や配列が入れ子になったパラメータを、再帰呼び出しで key=value の組の一覧へ変換する Alamofire の関数。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2018 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/ParameterEncoding.swift
lines: [196, 219]
function: "queryComponents(fromKey:value:)"
difficulty: 2
tags: [文字列処理, 再帰]
format: 2
---
## ひとことで

`["user": ["name": "Ann"]]` のように入れ子になったパラメータを、`user[name]=Ann` のようなクエリ項目の一覧へ平らにします。自分自身を呼び出して、深さに関係なく同じ処理で扱います。

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

- **クエリ文字列**: URL の `?` のあとに、`key=value` を `&` でつないだ部分です。
- **`Any` とキャスト**: `Any` は、どの型の値でも入る型です。`case let dictionary as [String: Any]` のように、実行時に型を調べて分岐します。
- **再帰**: 関数が自分自身を呼び出す書き方です。入れ子の深さが決まっていなくても、同じ処理を繰り返せます。
- **タプル**: `(String, String)` のように、複数の値を 1 つにまとめた組です。

## 何をしているか

### 1. 辞書なら、キーをつないで再帰する

辞書の各要素について、外側のキーと内側のキーを `[ ]` でつないだ新しいキーを作り、同じ関数を呼びます。

```swift:line-numbers=199
        case let dictionary as [String: Any]:
            for (nestedKey, value) in dictionary {
                components += queryComponents(fromKey: "\(key)[\(nestedKey)]", value: value)
            }
```
### 2. 配列なら、添字を使ったキーで再帰する

配列の要素は、添字を使ったキーを作って、同じように呼び出します。

```swift:line-numbers=203
        case let array as [Any]:
            for (index, value) in array.enumerated() {
                components += queryComponents(fromKey: arrayEncoding.encode(key: key, atIndex: index), value: value)
            }
```
### 3. 数値と真偽値は、文字列にして追加する

`NSNumber` の中には、真偽値（Bool）も入っています。そのため、`isBool` で真偽値かどうかを先に調べ、文字列に直します。

```swift:line-numbers=207
        case let number as NSNumber:
            if number.isBool {
                components.append((escape(key), escape(boolEncoding.encode(value: number.boolValue))))
            } else {
                components.append((escape(key), escape("\(number)")))
            }
        case let bool as Bool:
            components.append((escape(key), escape(boolEncoding.encode(value: bool))))
```
### 4. それ以外の値は、文字列にして追加する

```swift:line-numbers=215
        default:
            components.append((escape(key), escape("\(value)")))
        }
```
### 5. 組の一覧を返す

最後に、集めた組の一覧を返します。

```swift:line-numbers=218
        return components
    }
```
## ここがすごい

- **深さに関係ない**: 辞書と配列の入れ子が何段あっても、同じ関数が自分を呼び続けて処理します。
- **型で分岐している**: `switch` の型のパターンで、辞書、配列、数値、真偽値を分けています。
- **連結は最後に 1 度だけ**: 途中では `(キー, 値)` の組を集めるだけで、文字列にはしません。

## まとめ

- 入れ子のパラメータは、再帰呼び出しで平らな組の一覧へ変換する。
- 型による分岐で、辞書、配列、数値、真偽値を別々に扱う。
- 結果は `(キー, 値)` の組として返し、あとで `&` でつなぐ。
