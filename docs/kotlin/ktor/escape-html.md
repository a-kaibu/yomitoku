---
title: "HTML の特別な文字を実体参照に置き換える escapeHTML"
description: "文字列に含まれる ' \" & < > を HTML の実体参照に置き換える escapeHTML。1 回の走査で作り直すので、置き換えた結果がさらに書き換えられることがない。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2021 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-utils/common/src/io/ktor/util/Text.kt
lines: [12, 28]
function: "String.escapeHTML"
difficulty: 2
tags: [セキュリティ, 文字列処理, 防御的プログラミング]
format: 2
---

## ひとことで

`escapeHTML()` は、文字列の中の **HTML で特別な意味を持つ文字** を、実体参照（`&lt;` のような書き方）に置き換える関数です。`<` や `&` がそのまま HTML に入ると、表示が壊れたり、意図しないタグとして解釈されたりします。

Ktor（Kotlin 製の Web フレームワーク）で、利用者が入力した文字列をそのままページに出すときの安全策として使えます。

## コード

```kotlin:line-numbers=12
public fun String.escapeHTML(): String {
    val text = this@escapeHTML
    if (text.isEmpty()) return text

    return buildString(length) {
        for (element in text) {
            when (element) {
                '\'' -> append("&#x27;")
                '\"' -> append("&quot;")
                '&' -> append("&amp;")
                '<' -> append("&lt;")
                '>' -> append("&gt;")
                else -> append(element)
            }
        }
    }
}
```

## 前提知識

- **実体参照**: HTML で、特別な文字を別の書き方で表すものです。`&lt;` は `<`、`&amp;` は `&`、`&quot;` は `"` を表します。
- **HTML の特別な文字**: `<` と `>` はタグの始まりと終わり、`&` は実体参照の始まり、`"` と `'` は属性の値を囲む記号です。
- **`buildString`**: 文字列を組み立てるための箱を作り、その中で書き込んでから、完成した文字列を返す関数です。
- **`when` 式**: 文字ごとに、置き換えるかどうかを決めます。
- **`append`**: 箱の末尾に文字や文字列を足します。

## 何をしているか

### 1. 空なら何もしない

```kotlin:line-numbers=14
    if (text.isEmpty()) return text
```

空の文字列には置き換えるものがないので、そのまま返します。

### 2. 箱を用意して 1 文字ずつ見る

```kotlin:line-numbers=16
    return buildString(length) {
```

もとの文字列と同じ長さの箱を用意します。特別な文字は、実体参照で長くなるので、少し大きくなる余地もあります。

### 3. 特別な文字だけ置き換える

```kotlin:line-numbers=19
                '\'' -> append("&#x27;")
```

`'` は `&#x27;` に置き換えます。

```kotlin:line-numbers=20
                '\"' -> append("&quot;")
```

`"` は `&quot;` に置き換えます。

```kotlin:line-numbers=21
                '&' -> append("&amp;")
```

`&` は `&amp;` に置き換えます。

```kotlin:line-numbers=24
                else -> append(element)
```

それ以外の文字は、そのまま書きます。

## ここがすごい

- **1 回の走査で完結する**: 文字を 1 つずつ見て、1 回だけ書き出します。`&` を `&amp;` に変えたあとで、`&lt;` を作るような二重の置き換えが起きません。もし順番に `replace` を重ねると、置き換えた結果の `&` がまた書き換えられてしまいます。
- **置き換えの表が一目で分かる**: 5 つの文字と、その置き換え先が `when` の枝として並んでいます。どの文字が対象かが、そのまま読めます。
- **空の場合を先に返す**: 余計な処理を避けるため、空の文字列はすぐに返します。
- **箱の大きさを指定**: `buildString(length)` と、初めに大きさを決めておくことで、途中の作り直しを減らしています。

## まとめ

- `escapeHTML` は、`' " & < >` を実体参照に置き換え、ほかの文字はそのまま残す。
- 1 回の走査で作り直すので、置き換えた結果が再び書き換えられることがない。
- 利用者の入力をページに出すときの、基本の安全策として使える。
