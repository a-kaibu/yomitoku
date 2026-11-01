---
title: "辞書は中身を再帰的にまぜ、配列は連結する JSON の merge"
description: "SwiftyJSON で 2 つの JSON 値をまとめる内部関数。型が同じなら辞書は鍵ごとに再帰的にまぜ、配列は後ろに連結し、型が違うときは型チェックの有無で扱いを分ける。"
language: swift
project: "SwiftyJSON"
repo: https://github.com/SwiftyJSON/SwiftyJSON
license: MIT
copyright: "Copyright (c) 2014 - 2017 Ruoyu Fu, Pinglin Tang"
commit: "3d2544101a03f22b2217d464dc7d359eeb86e159"
file: Source/SwiftyJSON/SwiftyJSON.swift
lines: [176, 195]
function: "JSON.merge(with:typecheck:)"
difficulty: 2
tags: [再帰, 型システム, イディオム]
format: 2
---
## ひとことで

SwiftyJSON の `merge(with:typecheck:)` は、ある JSON の値に別の JSON の値を取り込む関数です。たとえば 2 つのオブジェクトなら、鍵ごとに中身を合わせていきます。同じ型の配列なら、後ろへつなぎます。
型が違うときは、`typecheck` の値によって、エラーにするか、後の値で置き換えるかを選びます。

## コード

```swift:line-numbers=176
 	fileprivate mutating func merge(with other: JSON, typecheck: Bool) throws {
        if type == other.type {
            switch type {
            case .dictionary:
                for (key, _) in other {
                    try self[key].merge(with: other[key], typecheck: false)
                }
            case .array:
                self = JSON(arrayValue + other.arrayValue)
            default:
                self = other
            }
        } else {
            if typecheck {
                throw SwiftyJSONError.wrongType
            } else {
                self = other
            }
        }
    }
```

## 前提知識

- **`JSON` 型**: SwiftyJSON が JSON の値を包む型です。`type` で、辞書・配列・文字列などの種類がわかります。
- **`fileprivate`**: このファイルの中からだけ使える修飾子です。
- **`mutating`**: 構造体の自分自身を書き換えるメソッドに付けます。
- **`throws` と `try`**: エラーを投げうる関数に付けます。呼び出すときは `try` を書きます。
- **`self[key]`**: 辞書のように鍵で中身にアクセスします。`self[key]` は、ない鍵でも空の JSON を返します。

## 何をしているか

### 1. 型が同じ場合

`type == other.type` のときは、型ごとに処理を分けます。

```swift:line-numbers=177
        if type == other.type {
            switch type {
            case .dictionary:
                for (key, _) in other {
                    try self[key].merge(with: other[key], typecheck: false)
                }
            case .array:
                self = JSON(arrayValue + other.arrayValue)
            default:
                self = other
            }
```
- 辞書なら、`other` の鍵を 1 つずつ取り出し、`self[key]` と `other[key]` を再帰的に merge します。
- 配列なら、`arrayValue` を連結して新しい配列にします。
- そのほか（文字列や数値など）は、`other` の値で置き換えます。

### 2. 型が違う場合

型が違うときは、`typecheck` で扱いが変わります。

```swift:line-numbers=188
        } else {
            if typecheck {
                throw SwiftyJSONError.wrongType
            } else {
                self = other
            }
        }
```
`typecheck` が true なら、`wrongType` のエラーを投げます。false なら、`other` の値で置き換えます。辞書の中で再帰するときは false で呼ぶので、深いところの型の違いは置き換えで受け入れます。

## ここがすごい

- **再帰で深い構造をそのまま扱う**: 辞書の中に辞書があれば、同じ関数がその中でも動きます。構造ごとに別々の処理を書く必要がありません。
- **同じ型だけ中身をまぜる**: 型が違うのに中身をまぜると、意味がおかしくなります。型が同じときだけ中身をまぜ、違うときは丸ごと置き換えるか、エラーにするかを選べます。
- **`typecheck` で呼び方を変える**: 外から呼ぶときは厳しく、中で再帰するときは緩く、と挙動を切り替えられます。1 つの関数で 2 つの要件をまかなっています。

## まとめ

- 辞書のような入れ子の構造は、再帰で鍵ごとにまとめられる。
- 型が同じかどうかで、まぜるか置き換えるかを決める。
- 厳しさを引数で切り替えると、同じ関数を複数の場面で使える。
