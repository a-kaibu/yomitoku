---
title: "値をコピーして、一部だけ書き換えた新しい値を作る"
description: "構造体の値を変更せず、コピーに対して一部だけ書き換えた新しい値を返す GRDB の Refinable.with(_:)。"
language: swift
project: "GRDB"
repo: https://github.com/groue/GRDB.swift
license: MIT
copyright: "Copyright (C) 2015-2025 Gwendal Roué"
commit: "92a554cd0d5e8d67cb18993c6054e73fe42c066c"
file: GRDB/Utils/Refinable.swift
lines: [31, 35]
function: "with(_:)"
difficulty: 1
tags: [イディオム, API設計]
format: 2
---
## ひとことで

構造体などの値を、元の値を変えずに、一部だけ書き換えた新しい値を作ります。`player.with { $0.score = 100 }` のように書くと、スコアだけが違う新しいプレイヤーが返ります。

## コード

```swift:line-numbers=31
    func with(_ update: (inout Self) throws -> Void) rethrows -> Self {
        var result = self
        try update(&result)
        return result
    }
```

## 前提知識

- **値型（構造体）**: 代入すると、中身がコピーされる型です。コピーを変えても、元の値は変わりません。
- **`inout`**: 引数を、呼び出し側の変数として書き換えられる指定です。`&result` のように書いて渡します。
- **`rethrows`**: 渡された関数がエラーを投げたときだけ、この関数もエラーを投げることを表します。
- **マーカープロトコル**: 中身の関数を持たず、「この型はこの機能を使ってよい」という印だけを表すプロトコルです。`Refinable` がこれにあたります。

## 何をしているか

### 1. 自分をコピーする

`var result = self` で、値型のコピーを作ります。元の `self` は、このあとも変わりません。

```swift:line-numbers=32
        var result = self
```
### 2. コピーに対して、変更を加える

渡された `update` の関数に、コピーを `inout` で渡します。関数の中で、必要な項目だけを書き換えます。

```swift:line-numbers=33
        try update(&result)
```
### 3. 変更したコピーを返す

書き換えが終わったコピーを、戻り値として返します。

```swift:line-numbers=34
        return result
```
## ここがすごい

- **元の値を守る**: 変更は、コピーに対してだけ行われます。元の値を使っている他の場所に、影響しません。
- **変更の内容をその場で書ける**: 新しい値を作る書き方を、一般の構文で書けます。項目の数が多くても、変えたいところだけを書けば済みます。
- **値型と相性がよい**: 値型は、コピーが安全に作れるので、この書き方が自然に成り立ちます。

## まとめ

- `with` は、自分のコピーを作り、クロージャで一部を書き換えて返す。
- 元の値は変わらないので、安全に使い回せる。
- 値型と組み合わせると、自然に書ける。
