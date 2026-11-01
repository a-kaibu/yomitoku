---
title: "配列を URL にするとき、キーの書き方を 4 通りから選ぶ"
description: "Alamofire で配列をクエリ文字列にするときの鍵の形を決める enum。角かっこの有無や添字の付け方を切り替え、さらに独自の書き方も閉包で渡せる。"
language: swift
project: "Alamofire"
repo: https://github.com/Alamofire/Alamofire
license: MIT
copyright: "Copyright (c) 2014-2018 Alamofire Software Foundation (http://alamofire.org/)"
commit: "6c2892ea5adb5a03fa81c510933dd782c5ddd9cb"
file: Source/Core/ParameterEncoding.swift
lines: [93, 104]
function: "URLEncoding.ArrayEncoding.encode(key:atIndex:)"
difficulty: 1
tags: [型システム, イディオム, ネットワーク]
format: 2
---
## ひとことで

Web の API によって、配列をクエリにするときの書き方は違います。`tags[]=a`、`tags=a`、`tags[0]=a` などです。
`ArrayEncoding` は、その書き方を選ぶための列挙型です。`encode(key:atIndex:)` は、選んだ書き方に従って、要素 1 つぶんのキーを作ります。

## コード

```swift:line-numbers=93
        func encode(key: String, atIndex index: Int) -> String {
            switch self {
            case .brackets:
                "\(key)[]"
            case .noBrackets:
                key
            case .indexInBrackets:
                "\(key)[\(index)]"
            case let .custom(encoding):
                encoding(key, index)
            }
        }
```

## 前提知識

- **`enum` の関連値**: `case custom(...)` のように、ケースに値を持たせられます。ここでは閉包（関数）を持たせています。
- **`@Sendable`**: 別のスレッドから安全に渡せることを示す印です。
- **文字列の補間 `"\(key)[]"`**: 変数を文字列の中に埋め込みます。
- **`switch self`**: 列挙型のどのケースかで、処理を分けます。

## 何をしているか

### 1. 角かっこ付き・なし・添字付き

`brackets` は `key[]`、`noBrackets` は `key`、`indexInBrackets` は `key[番号]` の形になります。

```swift:line-numbers=94
            switch self {
            case .brackets:
                "\(key)[]"
            case .noBrackets:
                key
            case .indexInBrackets:
                "\(key)[\(index)]"
```
### 2. 独自の書き方

`custom` の場合は、渡された閉包を呼んで、その結果をそのまま使います。

```swift:line-numbers=101
            case let .custom(encoding):
                encoding(key, index)
```
## ここがすごい

- **よく使う形を名前で選べる**: 呼び出し側は `.brackets` のように、目的の書き方を名前で指定できます。文字列を直接組み立てる必要がありません。
- **閉包で例外にも対応**: 列挙型に用意されていない書き方も、`custom` で閉包を渡せば表せます。仕様の違いを、コードを増やさずに吸収できます。
- **決まった形は 1 か所に**: 鍵の書き方のルールは、この関数だけにあります。配列を扱うほかの場所は、どの形を使うかを選ぶだけで済みます。

## まとめ

- 外部の仕様の違いは、列挙型のケースとして並べると、選択しやすくなる。
- 組み込みにない書き方は、閉包を渡せるようにしておくと柔軟になる。
- 文字列の組み立ては、1 か所にまとめると、仕様変更にも強い。
