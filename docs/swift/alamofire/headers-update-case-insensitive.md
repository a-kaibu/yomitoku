---
title: "同じ名前のヘッダーを、大文字と小文字を区別せずに置き換える"
description: "HTTP ヘッダーの名前は大文字と小文字を区別しないので、同じ名前があれば値を置き換え、なければ末尾に追加する Alamofire の update(_:)。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2018 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/HTTPHeaders.swift
lines: [74, 81]
function: "update(_:)"
difficulty: 1
tags: [API設計, 文字列処理]
format: 2
---
## ひとことで

HTTP ヘッダーには、同じ名前のものを 1 つだけ持つ、という決まりがあります。名前は大文字と小文字を区別しません。この関数は、同じ名前のヘッダーがあれば値を置き換え、なければ末尾に追加します。

## コード

```swift:line-numbers=74
    public mutating func update(_ header: HTTPHeader) {
        guard let index = headers.index(of: header.name) else {
            headers.append(header)
            return
        }

        headers.replaceSubrange(index...index, with: [header])
    }
```

## 前提知識

- **HTTP ヘッダー**: リクエストやレスポンスに付ける「名前: 値」の組です。たとえば `Content-Type: application/json` のような形です。
- **大文字と小文字を区別しない**: `Accept` と `accept` は同じ名前として扱われます。HTTP の仕様でそう決まっています。
- **`guard let ... else`**: 値がなかったときの処理を先に書き、そのあとは値がある前提で進む書き方です。
- **`replaceSubrange`**: 配列の一部の範囲を、別の要素の並びに置き換えるメソッドです。

## 何をしているか

### 1. 同じ名前のヘッダーがなければ、末尾に追加する

`headers.index(of:)` は、名前を大文字と小文字を区別せずに探す、この型のメソッドです。見つからなければ、新しいヘッダーを末尾に足して終わります。

```swift:line-numbers=75
        guard let index = headers.index(of: header.name) else {
            headers.append(header)
            return
        }
```
### 2. 同じ名前があれば、その位置を置き換える

見つかった位置にだけ、新しいヘッダーを入れ直します。並び順は変わらず、同じ名前のヘッダーは 1 つだけ残ります。

```swift:line-numbers=80
        headers.replaceSubrange(index...index, with: [header])
```
## ここがすごい

- **同じ名前を 1 つにまとめる**: 同じ名前を何度追加しても、ヘッダーは 1 つだけになります。
- **並び順を保つ**: 置き換えるときは、同じ位置に入れ直すので、他のヘッダーの順番は変わりません。
- **ガード節で分かりやすく**: 「見つからない場合」を先に処理して、残りを本流として読めます。

## まとめ

- 名前を大文字と小文字を区別せずに探す。
- 見つからなければ末尾に追加し、見つかればその位置を置き換える。
- こうすると、同じ名前のヘッダーは常に 1 つになる。
