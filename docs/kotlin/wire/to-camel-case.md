---
title: "アンダースコアで区切った名前を CamelCase にする"
description: "card_id のようなアンダースコア区切りの名前を、CardId のような先頭大文字の形に変える toCamelCase。区切りごとに先頭だけを大文字にして、つなげる。"
language: kotlin
project: "Wire"
repo: https://github.com/square/wire
license: Apache-2.0
copyright: "Copyright (C) 2018 Square, Inc."
commit: "8182e8d58173a9e3a3fd9d81a36864a9d2e42754"
file: wire-kotlin-generator/src/main/java/com/squareup/wire/kotlin/KotlinGenerator.kt
lines: [3196, 3198]
function: "KotlinGenerator.toCamelCase"
difficulty: 1
tags: [文字列処理, イディオム, 可読性]
format: 2
---

## ひとことで

`toCamelCase()` は、`card_id` のように **アンダースコアで区切られた名前** を、`CardId` のように、単語ごとに先頭を大文字にしてつなげる関数です。

Wire（Protocol Buffers のコードを Kotlin に変換するツール）が、`.proto` ファイルの名前から Kotlin のクラス名を作るときに使っています。たとえば `oneof` の名前を、sealed class のクラス名にするときです。

## コード

```kotlin:line-numbers=3196
  private fun String.toCamelCase(): String = split("_").joinToString("") { part ->
    part.replaceFirstChar { it.uppercaseChar() }
  }
```

## 前提知識

- **`split("_")`**: 文字列を `_` で区切って、部分の列（リスト）にする関数です。`card_id` は `["card", "id"]` になります。
- **`joinToString("")`**: 列の要素を、区切りなしでつなげて 1 つの文字列にする関数です。
- **`replaceFirstChar`**: 文字列の先頭の 1 文字だけを、関数で変換する関数です。空の文字列では何もしません。
- **`uppercaseChar()`**: 文字を大文字にします。
- **ラムダの `part ->`**: 列の各要素を、名前を付けて受け取る書き方です。

## 何をしているか

### 1. アンダースコアで分ける

```kotlin:line-numbers=3196
  private fun String.toCamelCase(): String = split("_").joinToString("") { part ->
```

まず `_` で文字列を区切ります。区切った部分ごとに、後の処理を行い、それを区切りなしでつなげます。

### 2. 各部分の先頭を大文字にする

```kotlin:line-numbers=3197
    part.replaceFirstChar { it.uppercaseChar() }
```

各部分の先頭の 1 文字だけを大文字にします。残りの文字は、もとのまま残ります。`card` は `Card`、`id` は `Id` になります。

## ここがすごい

- **区切りと結合を対にする**: 分ける処理と、つなげる処理が、1 行の中で対になっています。どこで区切り、どうつなぐかが一目で分かります。
- **残りの文字を変えない**: 先頭だけを大文字にするので、もとの名前の大文字の並びは保たれます。`ABC_def` のような名前も、`ABCDef` になります。
- **空の部分も落とさない**: `a__b` のように `_` が連続すると、空の部分が生まれます。その部分はつなげると何も足さないので、結果は `AB` になります。例外にはなりません。
- **1 行のラムダで完結**: 区切り、変換、結合が、1 つの式にまとまっています。コード生成の中で何度呼ばれても、読みやすい形です。

## まとめ

- `toCamelCase` は、`_` で区切った各部分の先頭を大文字にして、区切りなしでつなげる。
- 先頭以外の文字は変えず、空の部分は結果に何も足さない。
- Wire は、この関数で `.proto` の名前から Kotlin のクラス名を作る。
