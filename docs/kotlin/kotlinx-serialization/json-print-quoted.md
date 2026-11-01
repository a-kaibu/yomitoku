---
title: "JSON の文字列を引用符で囲み、必要な文字だけを逃がす"
description: "JSON の文字列を書き出す printQuoted。制御文字や引用符などを、バックスラッシュで始まる書き方に置き換えてから、全体を引用符で囲む。変換の要らない部分は、まとめて書き出す。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "\"Copyright 2017-2019 JetBrains s.r.o.\""
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: formats/json/commonMain/src/kotlinx/serialization/json/internal/StringOps.kt
lines: [50, 65]
function: "StringBuilder.printQuoted"
difficulty: 3
tags: [入出力, 文字列処理, 最適化]
format: 2
---

## ひとことで

JSON の文字列は、ダブルクォート（`"`）で囲みます。中に `"` や改行などの文字があると、そのままでは形式が壊れてしまいます。そこで、そうした文字を **バックスラッシュ（`\`）で始まる書き方** に置き換えてから書き出します。

`printQuoted` は、その一連の処理を行う関数です。たとえば `a"b` は `"a\"b"` と書かれ、改行は `\n` になります。

## コード


::: code-group

```kotlin:line-numbers=50 [日本語訳]
internal fun StringBuilder.printQuoted(value: String) {
    append(STRING)
    var lastPos = 0
    for (i in value.indices) {
        val c = value[i].code
        if (c < ESCAPE_STRINGS.size && ESCAPE_STRINGS[c] != null) {
            append(value, lastPos, i) // ここまでの部分を先に書き出す
            append(ESCAPE_STRINGS[c])
            lastPos = i + 1
        }
    }

    if (lastPos != 0) append(value, lastPos, value.length)
    else append(value)
    append(STRING)
}
```

```kotlin:line-numbers=50 [原文]
internal fun StringBuilder.printQuoted(value: String) {
    append(STRING)
    var lastPos = 0
    for (i in value.indices) {
        val c = value[i].code
        if (c < ESCAPE_STRINGS.size && ESCAPE_STRINGS[c] != null) {
            append(value, lastPos, i) // flush prev
            append(ESCAPE_STRINGS[c])
            lastPos = i + 1
        }
    }

    if (lastPos != 0) append(value, lastPos, value.length)
    else append(value)
    append(STRING)
}
```

:::

## 前提知識

- **`STRING`**: 引用符（`"`）を表す定数です。文字列の始まりと終わりに書きます。
- **`ESCAPE_STRINGS`**: 文字の番号（0 から 92 まで）ごとに、置き換えた文字列を入れた表です。置き換えが要らない文字は `null` です。
- **`StringBuilder`**: 文字列を少しずつ組み立てる入れ物です。`append` で後ろに足していきます。
- **`append(value, start, end)`**: 文字列の `start` から `end` の前までを追加します。
- **バックスラッシュのエスケープ**: `\"` は引用符、`\\` はバックスラッシュ、`\n` は改行を表す書き方です。

## 何をしているか

### 1. 逃がす文字を見つけたら、その前までを書き出す

```kotlin:line-numbers=55
        if (c < ESCAPE_STRINGS.size && ESCAPE_STRINGS[c] != null) {
```

文字の番号が表の範囲内で、置き換えが必要なら、その文字を見つけたことになります。

```kotlin:line-numbers=57
            append(ESCAPE_STRINGS[c])
```

その文字の前までの部分は、先に書き出しておきます。そのあと、置き換えた書き方を追加します。`lastPos` を、その文字の次の位置に進めます。

### 2. 残りの部分を書く

```kotlin:line-numbers=62
    if (lastPos != 0) append(value, lastPos, value.length)
    else append(value)
```

最後に見つかった位置から先を書きます。1 つも逃がす文字がなければ、文字列全体をそのまま書きます。

### 3. 全体を引用符で囲む

最初と最後に `STRING` を書いて、引用符で囲みます。

## ここがすごい

- **変換が要らない部分はまとめて書く**: 1 文字ずつ書き直すのではなく、逃がす文字の間の塊をまとめて追加します。文字列が長くても、追加の回数が少なくて済みます。
- **表で判定する**: 文字の番号を使って、表から置き換えの文字列を 1 回の参照で取り出します。`if` の連続よりも速く、規則も 1 か所にまとまっています。
- **表の大きさを限る**: 表の大きさは 93 で、ちょうどバックスラッシュの番号までです。それより大きい文字は、置き換えの対象にならないので、範囲を確かめるだけで済みます。
- **空の場合も同じ書き方**: 逃がす文字が 1 つもないときは、`lastPos` が 0 のままなので、文字列全体を 1 回で書きます。特別な分岐を書かずに済みます。

## まとめ

- JSON の文字列は、逃がす文字を置き換えてから引用符で囲む。
- 変換の要らない部分は、まとめて書くと速い。
- 置き換えの規則は、番号で引く表にまとめると分かりやすい。
