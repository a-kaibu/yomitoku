---
title: "英単語の複数形を、後から足した規則から順に試す"
description: "GRDB が英単語の複数形を作るときに使う関数。登録された正規表現の規則を、後から足したものから順に試し、最初に一致した規則の置き換えを使う。どれも一致しなければ元の語を返す。"
language: swift
project: "GRDB"
repo: https://github.com/groue/GRDB.swift
license: MIT
copyright: "Copyright (C) 2015-2025 Gwendal Roué"
commit: "92a554cd0d5e8d67cb18993c6054e73fe42c066c"
file: GRDB/Utils/Inflections.swift
lines: [195, 208]
function: "Inflections.inflectWord(_:with:)"
difficulty: 2
tags: [文字列処理, 正規表現, 設計パターン]
format: 2
---
## ひとことで

GRDB は、テーブル名やクラス名などを、英単語の単数形と複数形で相互に変換する機能を持ちます。たとえば `player` は `players`、`city` は `cities` です。
この関数は、1 つの単語に、登録された複数形の規則を当てはめます。規則は正規表現と置き換えの組で、**後から登録したものを先に試す** のがポイントです。

## コード

```swift:line-numbers=195
    private func inflectWord(_ string: String, with rules: [(NSRegularExpression, String)]) -> String {
        if string.isEmpty {
            return string
        }
        let range = NSRange(string.startIndex..<string.endIndex, in: string)
        for (reg, template) in rules.reversed() {
            let result = NSMutableString(string: string)
            let matchCount = reg.replaceMatches(in: result, options: [], range: range, withTemplate: template)
            if matchCount > 0 {
                return String(result)
            }
        }
        return string
    }
```

## 前提知識

- **正規表現**: 文字列のパターンを表す書き方です。`y$` は「`y` で終わる」という意味です。
- **`NSRegularExpression`**: Foundation の正規表現の型です。`replaceMatches` で、一致した部分を置き換えます。
- **置き換えのテンプレート**: 一致した部分を、別の文字列に置き換えるための書き方です。
- **`rules.reversed()`**: 規則の並びを逆順にして読む書き方です。配列を作り直さずに済みます。

## 何をしているか

### 1. 空の単語は、何もしない

空の単語には、規則を当てはめる意味がありません。そのまま返します。

```swift:line-numbers=196
        if string.isEmpty {
            return string
        }
```
### 2. 規則を、後から登録したものから順に読む

規則の配列を逆順にして、先頭から試します。登録した順の逆になるので、後から足した規則が先に試されます。

```swift:line-numbers=199
        let range = NSRange(string.startIndex..<string.endIndex, in: string)
        for (reg, template) in rules.reversed() {
```
### 3. 一致した最初の規則で置き換えて返す

各規則について、一致した箇所を置き換えた結果を作ります。一致した箇所が 1 つでもあれば、その結果を返して終わります。

```swift:line-numbers=201
            let result = NSMutableString(string: string)
            let matchCount = reg.replaceMatches(in: result, options: [], range: range, withTemplate: template)
            if matchCount > 0 {
                return String(result)
            }
```
### 4. どれも一致しなければ、元の単語のまま返す

すべての規則が一致しなかったときは、単語を変えずに返します。

```swift:line-numbers=207
        return string
```
例として、規則に `$` を `s` に置き換える規則（先に登録）と、`y$` を `ies` に置き換える規則（後に登録）があるとします。`city` は、後の規則から試されて `cities` になります。`player` は `y$` に一致しないので、`$` の規則で `players` になります。

## ここがすごい

- **例外を後から足せる**: 一般の規則（末尾に `s` を付ける）を先に登録し、特別な規則（`y` を `ies` に変える）を後から足せます。後から足した方が優先されるので、例外を書き加えるだけで済みます。
- **一致したら、すぐ返す**: 最初に一致した規則で決まるので、残りの規則は試しません。
- **元の文字列を壊さない**: 置き換えは、新しい `NSMutableString` にだけ行います。入力の文字列は変わりません。

## まとめ

- 複数形の変換は、正規表現の規則を並べ、最初に一致したものを使う。
- 後から登録した規則を先に試すと、例外を後から追加できる。
- どれも一致しなければ、元の単語をそのまま返す。
