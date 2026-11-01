---
title: "SQL の中に、文字列をそのまま書き込む方法"
description: "SQL の文に文字列を直接書き込む appendStringLiteral。前後を引用符で囲み、中の一重引用符を二つに重ねて、SQL の文字列の形を壊さないようにする。"
language: kotlin
project: "Exposed"
repo: https://github.com/JetBrains/Exposed
license: Apache-2.0
copyright: "Copyright 2000-2025 JetBrains s.r.o."
commit: "cb643693947c86745cf45414dd9dfb07249c82bc"
file: exposed-core/src/main/kotlin/org/jetbrains/exposed/v1/core/vendors/VendorDialect.kt
lines: [142, 144]
function: "QueryBuilder.appendStringLiteral"
difficulty: 2
tags: [防御的プログラミング, 文字列処理, データ構造]
format: 2
---

## ひとことで

`appendStringLiteral` は、SQL の文を組み立てる途中で、**文字列の値を SQL の文字列リテラル（`'...'` の形）として書き込む** 関数です。中に一重引用符（`'`）があっても、SQL の文の形が壊れないように、重ねて書きます。

Exposed は、Kotlin の型安全な書き方から SQL の文を組み立てます。ほとんどの値は、後で説明する「パラメーター」として渡されますが、データベースによっては、パラメーターを受け付けない場所があります。その場合にこの関数が使われます。

## コード

```kotlin:line-numbers=142
internal fun QueryBuilder.appendStringLiteral(value: String) {
    append("'", value.escapeSingleQuotes(), "'")
}
```

## 前提知識

- **SQL の文字列リテラル**: SQL で文字列を書くときの形です。`'hello'` のように、一重引用符で囲みます。
- **一重引用符の重ね書き**: SQL では、文字列の中に `'` を書きたいとき、`''` と 2 つ並べます。たとえば `O'Reilly` は、`'O''Reilly'` と書きます。
- **パラメーター（バインド）**: SQL の文とは別に、値をデータベースに渡す仕組みです。値は SQL の文の一部として解釈されません。
- **`QueryBuilder`**: Exposed が SQL の文を少しずつ組み立てるための道具です。`append` で文字を書き足し、`registerArgument` で値を登録します。
- **拡張関数**: 既存の型に後から関数を足す書き方です。`QueryBuilder.appendStringLiteral` は、`QueryBuilder` の機能として使えます。

## 何をしているか

### 1. 中の一重引用符を重ねる

```kotlin:line-numbers=143
    append("'", value.escapeSingleQuotes(), "'")
```

まず、`value.escapeSingleQuotes()` で、値の中の `'` を `''` に置き換えます。そのあと、前後を `'` で囲んで、SQL に書き足します。`append` は、複数の文字列を順に書き足す `QueryBuilder` の関数です。

### 2. 結果の形

値が `O'Reilly` なら、書き込まれるのは `'O''Reilly'` です。データベースは、これを 1 つの文字列として読み、途中の `''` を 1 つの `'` として扱います。

## ここがすごい

- **値を SQL の一部に変えない**: 値の中の引用符を重ねることで、値が SQL の文の区切りとして読まれるのを防ぎます。これは、いわゆる SQL インジェクションを防ぐための基本的な対策の 1 つです。
- **処理を 1 か所にまとめる**: 引用符の置き換えは `escapeSingleQuotes` に任せ、この関数は「囲んで書き足す」だけを担当しています。役割が分かれているので、読みやすく直しやすい作りです。
- **パラメーターが使えない場面の受け皿**: 理想はパラメーターとして渡すことですが、それができない場面のために、安全に文字列リテラルを作る手段を用意しています。

### 注意点: この方法だけでは防げないことがある

一重引用符を重ねる方法は、標準的な SQL の文字列の書き方に合わせたものです。データベースによっては、バックスラッシュ（`\`）が特別な意味を持つ場合があり、その場合はこの置き換えだけでは不十分です。そのため、Exposed では、できるだけパラメーターを使う方向で設計されています。

## まとめ

- 値を SQL の文字列として書くときは、中の引用符を重ねてから前後を囲む。
- 一重引用符の重ね書きは、値が SQL の区切りとして読まれるのを防ぐ。
- 方言によって特別な文字が違うので、可能な限りパラメーターで値を渡す。
