---
title: "パラメータのキーを並べ替えて、& でつないだクエリにする"
description: "辞書のパラメータをキーの順に並べ、key=value を & でつないで URL のクエリ文字列を作る Alamofire の関数。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2018 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/ParameterEncoding.swift
lines: [230, 238]
function: "query(_:)"
difficulty: 1
tags: [文字列処理, イディオム]
format: 2
---
## ひとことで

辞書のパラメータを、キーの順に並べてから `key=value&key=value` の形の文字列にします。キーの順を決めておくと、同じ内容のパラメータからは、毎回同じ文字列ができます。

## コード

```swift:line-numbers=230
    private func query(_ parameters: [String: Any]) -> String {
        var components: [(String, String)] = []

        for key in parameters.keys.sorted(by: <) {
            let value = parameters[key]!
            components += queryComponents(fromKey: key, value: value)
        }
        return components.map { "\($0)=\($1)" }.joined(separator: "&")
    }
```

## 前提知識

- **辞書**: `[String: Any]` のように、キーと値の組を持つ型です。辞書の順番は決まっていないので、並べ替えないと、毎回並びが変わることがあります。
- **`sorted(by:)`**: 配列の要素を、指定した比べ方で並べ替えたコピーを返します。
- **`joined(separator:)`**: 配列の要素を、区切り文字でつないだ文字列を返します。
- **`!`（強制アンラップ）**: オプショナルの値を取り出します。値がなければ実行時エラーになります。

## 何をしているか

### 1. キーを並べて、値を集める

`parameters.keys.sorted(by: <)` で、キーを昇順に並べます。値は `queryComponents` に任せて、組の一覧へ足していきます。

```swift:line-numbers=233
        for key in parameters.keys.sorted(by: <) {
            let value = parameters[key]!
            components += queryComponents(fromKey: key, value: value)
        }
```
### 2. `key=value` の形にして、& でつなぐ

組の一覧を `=` と `&` でつないで、1 つの文字列にします。

```swift:line-numbers=237
        return components.map { "\($0)=\($1)" }.joined(separator: "&")
    }
```
## ここがすごい

- **毎回同じ文字列になる**: キーの順を固定しているので、同じ内容のパラメータからは、いつも同じクエリ文字列ができます。
- **比較演算子をそのまま渡す**: `sorted(by: <)` は、クロージャを書かずに、型の比較演算子をそのまま使っています。
- **`map` と `joined` でつなぐ**: ループで文字列を足し続けず、一度の変換で組み立てています。

## まとめ

- 辞書のキーを並べてから、値を集める。
- 入れ子の値は、`queryComponents` に任せる。
- 最後に `=` と `&` で、1 つの文字列にまとめる。
