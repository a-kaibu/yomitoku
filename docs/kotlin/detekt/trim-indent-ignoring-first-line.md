---
title: "最初の行はそのままにして、残りの行だけインデントを揃える"
description: "複数行の文字列で、最初の行は崩さず、最初の行以外だけ余分なインデントを取り除く trimIndentIgnoringFirstLine。改行がなければそのまま返す。"
language: kotlin
project: "detekt"
repo: https://github.com/detekt/detekt
license: Apache-2.0
copyright: "Copyright 2016-2024 Artur Bosch and detekt contributors"
commit: "0887fcccf93842244ba851e970aa99c7da31ffbc"
file: detekt-rules-style/src/main/kotlin/dev/detekt/rules/style/ForbiddenComment.kt
lines: [185, 191]
function: "String.trimIndentIgnoringFirstLine"
difficulty: 2
tags: [文字列処理, イディオム, 防御的プログラミング]
format: 2
---

## ひとことで

`trimIndentIgnoringFirstLine` は、複数行の文字列の **最初の行以外のインデント（字下げ）だけを揃えて、最初の行はそのままにする** 関数です。改行がない文字列は、何もせずに返します。

Kotlin には、`trimIndent()` という、すべての行のインデントを揃える標準の関数があります。しかし、文字列の最初の行が、開始の引用符のすぐ後ろに続いている場合は、その行のインデントを正しく判断できません。この関数は、その場合のために、最初の行を別に扱っています。

## コード

```kotlin:line-numbers=185
private fun String.trimIndentIgnoringFirstLine(): String =
    if ('\n' !in this) {
        this
    } else {
        val lines = this.lineSequence()
        lines.first() + "\n" + lines.drop(1).joinToString("\n").trimIndent()
    }
```

## 前提知識

- **複数行の文字列（生文字列）**: Kotlin では `"""` で囲むと、改行をそのまま含められる文字列が書けます。
- **インデント（字下げ）**: 行の先頭に付けられた空白です。文章の構造を見やすくするために、ソースコードの中で付けられます。
- **`trimIndent()`**: 行ごとの共通のインデントを取り除く標準関数です。最も短いインデントの量を基準にします。
- **`lineSequence()`**: 文字列を行ごとに、遅れて評価される列（シーケンス）として扱う関数です。
- **`first()` と `drop(1)`**: `first()` は先頭の要素を取り出し、`drop(1)` は先頭の 1 つを除いた残りを作ります。
- **`joinToString("\n")`**: 要素を改行で連結して、1 つの文字列にします。

## 何をしているか

### 1. 改行がなければ、そのまま返す

```kotlin:line-numbers=186
    if ('\n' !in this) {
        this
```

改行がない文字列は、整える行がありません。そのまま返します。

### 2. 最初の行と残りの行を分ける

```kotlin:line-numbers=189
        val lines = this.lineSequence()
```

文字列を行ごとに分けて、`lines` に入れます。

### 3. 最初の行はそのまま、残りの行だけ整える

```kotlin:line-numbers=190
        lines.first() + "\n" + lines.drop(1).joinToString("\n").trimIndent()
```

最初の行はそのまま付け、残りの行だけをまとめて改行でつないでから、`trimIndent()` でインデントを揃えます。最初の行を `trimIndent()` の対象から外しているのが、この関数の目的です。

## ここがすごい

- **例外の 1 行を別扱いにする**: 最初の行は、引用符の直後から続くので、インデントの量の計算から外すと正しく揃います。標準の `trimIndent()` では、この 1 行が混ざって結果が崩れることがあります。
- **改行がなければ何もしない**: 1 行だけの文字列に、余計な処理をしません。よくある短い文字列の場合は、すぐに戻る作りです。
- **遅延評価で行を扱う**: `lineSequence()` を使うと、行の分割を必要なときだけ行えます。
- **式として書かれている**: `if` の結果が、そのまま関数の戻り値です。分岐が 2 つだけなので、読むだけで意味が決まります。

## まとめ

- 複数行の文字列では、最初の行とそれ以降の行を分けて扱うと、字下げが正しく揃う。
- 改行がない文字列は、整える必要がないのでそのまま返す。
- 標準の関数で足りない場合は、小さな関数で前後の扱いを分けると、意図がはっきりする。
