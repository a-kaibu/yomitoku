---
title: "保存しておいた工場を、呼ばれるたびに使う"
description: "swift-log の LoggingSystem.factory が、bootstrap で登録されたハンドラの工場を、ラベルとメタデータを受け取るクロージャとして返す計算プロパティ。"
language: swift
project: "Swift Log"
repo: https://github.com/apple/swift-log
license: Apache-2.0
copyright: "Copyright (c) 2018-2019 Apple Inc. and the Swift Logging API project authors"
commit: "d0f784af9ea2bc75e557c3d2bb628a68248605f3"
file: Sources/Logging/LoggingSystem.swift
lines: [98, 102]
function: "LoggingSystem.factory"
difficulty: 2
tags: [設計パターン, クロージャ]
format: 2
---
## ひとことで

ログの出力先（ハンドラ）は、プログラムの最初に 1 回だけ決めます。その後は、どこからでも同じ決め方でハンドラを作りたいものです。この計算プロパティは、登録された工場を包んだクロージャを返します。

## コード

```swift:line-numbers=98
    internal static var factory: (String, Logger.MetadataProvider?) -> any LogHandler {
        { label, metadataProvider in
            self._factory.underlying(label, metadataProvider)
        }
    }
```

## 前提知識

- **工場（factory）**: 必要なときに、新しい値を作って返す関数です。ここでは、ラベルを受け取って `LogHandler` を作ります。
- **`static var`**: 型に属する、ほかの場所からも同じ値が見える変数です。
- **計算プロパティ**: 値を保存せず、読むたびに値を求める書き方です。
- **`self._factory.underlying`**: 登録された工場の中身を取り出す内部の呼び出しです。

## 何をしているか

### 1. 工場を呼ぶクロージャを作る

返すのは、関数の値（クロージャ）です。呼ばれたときに、ラベルとメタデータを受け取ります。

```swift:line-numbers=99
        { label, metadataProvider in
            self._factory.underlying(label, metadataProvider)
        }
```
### 2. 登録された工場へ、そのまま渡す

受け取った引数を、登録された工場（`underlying`）へ渡します。登録の中身は、この計算プロパティからは分かりません。

```swift:line-numbers=100
            self._factory.underlying(label, metadataProvider)
```
## ここがすごい

- **登録と利用を分ける**: 呼ぶ側は、工場の中身を知らずに、ハンドラを作れます。
- **差し替えに強い**: 登録された工場を入れ替えても、呼ぶ側のコードは変わりません。
- **毎回同じ経路**: どこから呼んでも、同じ工場を通るので、設定がずれません。

## まとめ

- 登録された工場を、クロージャとして返す。
- 呼ばれたら、ラベルとメタデータを工場へ渡す。
- 呼ぶ側は、工場の中身を知らずにハンドラを作れる。
