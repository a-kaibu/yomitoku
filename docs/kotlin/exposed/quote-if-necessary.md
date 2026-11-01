---
title: "名前が必要なときだけ引用符で囲む quoteIfNecessary"
description: "テーブル名や列名を SQL に書く前に、引用符で囲む必要があるかを判断する quoteIfNecessary。ドットで区切られた名前は、部分ごとに囲むかどうかを決める。"
language: kotlin
project: "Exposed"
repo: https://github.com/JetBrains/Exposed
license: Apache-2.0
copyright: "Copyright 2000-2025 JetBrains s.r.o."
commit: "cb643693947c86745cf45414dd9dfb07249c82bc"
file: exposed-core/src/main/kotlin/org/jetbrains/exposed/v1/core/statements/api/IdentifierManagerApi.kt
lines: [148, 154]
function: "IdentifierManagerApi.quoteIfNecessary"
difficulty: 2
tags: [文字列処理, API設計, 防御的プログラミング]
format: 2
---

## ひとことで

`quoteIfNecessary()` は、テーブル名や列名などの **識別子（名前）を SQL に書くときに、引用符で囲むかどうか** を決める関数です。囲む必要がない名前はそのまま、必要な名前だけを囲みます。

Exposed（Kotlin の SQL ライブラリ）が、SQL 文を組み立てるときに使っています。

## コード

```kotlin:line-numbers=148
    fun quoteIfNecessary(identity: String): String {
        return if (isDotPrefixedAndUnquoted(identity)) {
            identity.split('.').joinToString(".") { quoteTokenIfNecessary(it) }
        } else {
            quoteTokenIfNecessary(identity)
        }
    }
```

## 前提知識

- **識別子**: テーブル名や列名など、データベースの中の名前のことです。
- **引用符**: 名前を囲んで、特別な文字や予約語でも名前として扱えるようにする記号です。データベースによって、使う記号が違います。
- **ドット付きの名前**: `users.id` のように、テーブル名と列名をドットでつないだ名前です。
- **`split` と `joinToString`**: 文字列をドットで区切ってから、各部分を処理し、またドットでつなぎ直す組み合わせです。
- **`isDotPrefixedAndUnquoted`**: 名前にドットが含まれ、まだ引用符で囲まれていないかを判定する関数です。

## 何をしているか

### 1. ドットを含む名前か調べる

```kotlin:line-numbers=149
        return if (isDotPrefixedAndUnquoted(identity)) {
```

名前にドットが含まれていて、まだ囲まれていなければ、ドットで分けて扱う必要があります。

### 2. 部分ごとに囲むかを決める

```kotlin:line-numbers=150
            identity.split('.').joinToString(".") { quoteTokenIfNecessary(it) }
```

`users.id` なら、`users` と `id` をそれぞれ取り出し、必要なものだけを囲んでから、ドットでつなぎ直します。テーブル名は囲まず、列名だけ囲む、といった組み合わせも作れます。

### 3. それ以外は名前全体を判定する

```kotlin:line-numbers=152
            quoteTokenIfNecessary(identity)
```

ドットがない名前は、全体をひとまとまりとして判定します。

## ここがすごい

- **囲む範囲を部品ごとに決める**: ドット付きの名前を部分に分けることで、テーブル名と列名を別々に判断できます。全体を一度に囲んでしまう失敗を避けています。
- **囲まない名前は読みやすい**: 必要のない引用符を付けないので、生成される SQL が普通の形に近いまま保たれます。
- **判定の仕事を別の関数に任せる**: この関数は分け方だけを決め、「囲むかどうか」の判断は `quoteTokenIfNecessary` が行います。役割が分かれていて、読みやすい作りです。
- **すでに囲まれた名前は触らない**: 引用符で囲まれている名前は、二重に囲まれないよう、判定の段階で除外されます。

## まとめ

- `quoteIfNecessary` は、SQL に書く名前が引用符を必要とするときだけ、名前を囲む。
- ドットで区切られた名前は、テーブル名と列名を別々に判定してからつなぎ直す。
- 判定の詳細は `quoteTokenIfNecessary` に任せ、分け方だけをこの関数が決める。
