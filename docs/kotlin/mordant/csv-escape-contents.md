---
title: "表の中身を CSV に変えるときの引用符の扱い"
description: "表の内容を CSV の文字列に変換する contentToCsv。区切り文字や引用符を、設定に応じて二重にするかエスケープ文字を付けるかを切り替える。"
language: kotlin
project: "Mordant"
repo: https://github.com/ajalt/mordant
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "2c588d7ccece0ea5c117f5174b18fd85cb017d74"
file: mordant/src/commonMain/kotlin/com/github/ajalt/mordant/table/TableCsv.kt
lines: [44, 73]
function: "Table.contentToCsv"
difficulty: 3
tags: [文字列処理, 防御的プログラミング, 正規表現]
format: 2
---

## ひとことで

`contentToCsv()` は、Mordant の表（Table）の中身を **CSV（カンマ区切りのテキスト）** に変換する関数です。CSV では、区切り文字や引用符が値の中に含まれると、そのままでは表が壊れます。そのため、どんな文字をどう書き換えるかを、設定に応じて切り替えます。

この記事では、セルの中の引用符と、区切り文字の扱いを中心に読みます。

## コード

```kotlin:line-numbers=44
fun Table.contentToCsv(
    delimiter: Char = ',',
    quoteChar: Char = '"',
    escapeChar: Char? = null,
    doubleQuote: Boolean = false,
    lineTerminator: String = "\n",
    quoting: CsvQuoting = CsvQuoting.MINIMAL,
): String = buildString {
    val rows = getContentRows()
    val escapable = Regex("[$delimiter$lineTerminator]")

    for (row in rows) {
        row.joinTo(this, ",") { cell ->
            val escapesEscaped = escapeChar?.let { cell.replace(it.toString(), "$it$it") } ?: cell

            require(doubleQuote || escapeChar != null || quoteChar !in cell) { "Content requires escaping, but no escapeChar set" }

            val quotesEscaped = escapesEscaped.replace(
                quoteChar.toString(),
                if (doubleQuote && quoting != CsvQuoting.NONE) "$quoteChar$quoteChar" else "$escapeChar$quoteChar"
            )

            val allEscaped = when (quoting) {
                CsvQuoting.NONE -> {
                    require(escapeChar != null || !escapable.containsMatchIn(cell)) { "Content requires escaping, but no escapeChar set" }
                    escapable.replace(quotesEscaped) { "$escapeChar${it.value}" }
                }

                else -> quotesEscaped
            }
```

## 前提知識

- **`Table.contentToCsv`**: `Table` という型に後から足された関数です。表の行とセルを、順番に文字列へ変換します。
- **`buildString { ... }`**: 文字列を組み立てるための箱を作り、その中で書き込みを行ってから、完成した文字列を返す関数です。
- **引用符（quote）**: CSV で値を囲む記号です。値の中にも同じ記号があれば、2 つ重ねるか、エスケープ文字を前に付けて区別します。
- **エスケープ文字（escape）**: 特別な意味を持つ文字を、ただの文字として書くための印です。
- **`Regex`**: 正規表現で文字を探す型です。`containsMatchIn` は一致があるかを、`replace` は一致した部分を置き換えます。

## 何をしているか

### 1. 区切り文字と改行を正規表現にまとめる

```kotlin:line-numbers=53
    val escapable = Regex("[$delimiter$lineTerminator]")
```

区切り文字と改行文字のどちらかに当たる文字を、1 つの正規表現にまとめます。この正規表現で、エスケープが必要な場所を探します。

### 2. 引用符をどう書くかを決める

```kotlin:line-numbers=61
            val quotesEscaped = escapesEscaped.replace(
                quoteChar.toString(),
                if (doubleQuote && quoting != CsvQuoting.NONE) "$quoteChar$quoteChar" else "$escapeChar$quoteChar"
            )
```

値の中の引用符を、`doubleQuote` の設定に応じて書き換えます。二重にする方式なら `""` にし、そうでなければエスケープ文字を前に付けます。

### 3. 引用なしの形式では区切り文字を守る

```kotlin:line-numbers=66
            val allEscaped = when (quoting) {
```

引用の方式によって処理を分けます。

```kotlin:line-numbers=67
                CsvQuoting.NONE -> {
```

引用をまったく付けない方式では、区切り文字と改行の前にエスケープ文字を付けます。

```kotlin:line-numbers=68
                    require(escapeChar != null || !escapable.containsMatchIn(cell)) { "Content requires escaping, but no escapeChar set" }
```

エスケープが必要なのに、エスケープ文字が指定されていなければ、例外で止めます。

```kotlin:line-numbers=69
                    escapable.replace(quotesEscaped) { "$escapeChar${it.value}" }
```

正規表現に一致した区切り文字や改行を、エスケープ文字付きに置き換えます。

## ここがすごい

- **方式を `when` で切り替える**: 引用なし、引用あり、の 2 つの方式の違いを、1 か所の `when` にまとめています。どの場合にどの処理が走るかが一目で分かります。
- **前提が崩れたら早めに止める**: エスケープ文字がないのに、エスケープが必要な内容だったときは、`require` で例外にします。壊れた CSV を黙って出さない作りです。
- **正規表現を一度だけ作る**: 区切り文字の正規表現は、表の変換の最初で 1 回だけ作られます。行とセルのたびに作り直さないので、大きな表でも効率的です。
- **置き換えを 1 回の走査で済ませる**: `replace` に関数を渡して、一致した部分ごとに書き換えています。文字列を何度もつなぎ直すより、無駄が少なくなります。

## まとめ

- `contentToCsv` は、表の中身を CSV の文字列に変え、引用符と区切り文字を方式に応じて書き換える。
- 引用なしの方式では、区切り文字と改行にエスケープ文字を付ける。
- エスケープが必要なのに方法がなければ、例外で止めて壊れた出力を防ぐ。
