---
title: "JSON の逃がし方を文字の番号で引ける表"
description: "制御文字、引用符、バックスラッシュを、JSON の書き方の文字列に対応させた表。文字の番号を添字にすると、置き換えの文字列を 1 回の参照で取り出せる。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "\"Copyright 2017-2019 JetBrains s.r.o.\""
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: formats/json/commonMain/src/kotlinx/serialization/json/internal/StringOps.kt
lines: [15, 31]
function: "ESCAPE_STRINGS"
difficulty: 2
tags: [入出力, 文字列処理, 最適化]
format: 2
---

## ひとことで

JSON の文字列に `"` や改行を書くときは、`\"` や `\n` のように、**バックスラッシュで始まる書き方** にします。`ESCAPE_STRINGS` は、その置き換えの文字列を **文字の番号（0 から 92）を添字にして引ける表** です。

表には、制御文字（0 から 31 の文字）と、引用符、バックスラッシュが入っています。表に入っていない文字は、そのまま書けばよいので、表の中身は `null` のままです。

## コード

```kotlin:line-numbers=15
@JsonFriendModuleApi
public val ESCAPE_STRINGS: Array<String?> = arrayOfNulls<String>(93).apply {
    for (c in 0..0x1f) {
        val c1 = toHexChar(c shr 12)
        val c2 = toHexChar(c shr 8)
        val c3 = toHexChar(c shr 4)
        val c4 = toHexChar(c)
        this[c] = "\\u$c1$c2$c3$c4"
    }
    this['"'.code] = "\\\""
    this['\\'.code] = "\\\\"
    this['\t'.code] = "\\t"
    this['\b'.code] = "\\b"
    this['\n'.code] = "\\n"
    this['\r'.code] = "\\r"
    this[0x0c] = "\\f"
}
```

## 前提知識

- **`Array<String?>`**: 文字列か `null` を入れられる配列です。`arrayOfNulls` で、最初は全部 `null` にします。
- **`apply { ... }`**: 作った配列を `this` にして、ブロックで中身を埋めてから、その配列を返します。
- **制御文字**: 改行やタブなど、画面に文字として出ない 0 から 31 の文字です。JSON では、必ず逃がして書く必要があります。
- **`toHexChar`**: 0 から 15 を 16 進数の 1 文字にする関数です。`\uXXXX` の 4 桁を作るのに使います。
- **`@JsonFriendModuleApi`**: この表を、同じライブラリの別のモジュールから使うことを示す印です。

## 何をしているか

### 1. 制御文字は、4 桁の \u 表記にする

```kotlin:line-numbers=22
        this[c] = "\\u$c1$c2$c3$c4"
```

0 から 31 の文字は、`\u0000` から `\u001f` の形で書きます。4 桁の各桁を `toHexChar` で作って、文字列を組み立てます。

### 2. 短く書ける文字は、専用の書き方にする

表の後半で、短い書き方の文字を設定しています。たとえば、引用符は `\"`、改行は `\n`、タブは `\t` です。`\u000a` より短く、読みやすい書き方を優先しています。

### 3. 表の大きさは 93

`arrayOfNulls<String>(93)` の 93 は、バックスラッシュの番号（92）までを入れるための大きさです。表の外の番号は、逃がす必要がない文字として扱われます。

## ここがすごい

- **番号で一瞬で引ける**: 文字の番号を添字にするので、「逃がす必要があるか」と「何に置き換えるか」が、どちらも 1 回の配列の参照で分かります。
- **作るのは 1 回だけ**: 表はライブラリの読み込み時に 1 回作られ、その後は読むだけです。毎回、文字列を作り直す必要がありません。
- **規則が 1 か所にまとまる**: JSON の文字列の規則が、この表の中身だけで決まります。仕様を変えるときも、ここを直せば済みます。
- **表が null で「逃がさない」を表す**: 置き換えが要らない文字は `null` のままにして、「ない」を明確にしています。

## まとめ

- JSON の逃がし方は、文字の番号を添字にした表で引けるようにする。
- 制御文字は \u の 4 桁、よく使う文字は短い書き方にする。
- 表の大きさを必要な範囲に合わせると、範囲外の判定が単純になる。
