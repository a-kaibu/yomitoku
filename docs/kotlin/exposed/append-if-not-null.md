---
title: "値があるときだけ、文字列を末尾に足す"
description: "StringBuilder に、2 つ目の値が null でないときだけ、前の文字列と組にして書き足す appendIfNotNull。apply で自分自身を返し、続けて書けるようにしている。"
language: kotlin
project: "Exposed"
repo: https://github.com/JetBrains/Exposed
license: Apache-2.0
copyright: "Copyright 2000-2025 JetBrains s.r.o."
commit: "cb643693947c86745cf45414dd9dfb07249c82bc"
file: exposed-core/src/main/kotlin/org/jetbrains/exposed/v1/core/Schema.kt
lines: [65, 69]
function: "StringBuilder.appendIfNotNull"
difficulty: 1
tags: [文字列処理, イディオム, 防御的プログラミング]
format: 2
---

## ひとことで

`appendIfNotNull` は、SQL の文を組み立てる `StringBuilder` に、**値があるときだけ文字列を書き足す** 拡張関数です。値が `null` なら、何も書き足しません。

Exposed は、スキーマを作るときに、表領域の指定などの省略できる部分を持っています。指定がある場合だけ、その句を SQL に付けたいので、この関数で書き足しの判断をまとめています。

## コード

```kotlin:line-numbers=65
internal fun StringBuilder.appendIfNotNull(str1: String, str2: Any?) = apply {
    if (str2 != null) {
        this.append("$str1 $str2")
    }
}
```

## 前提知識

- **`StringBuilder`**: 文字列を少しずつ組み立てるための、変更できる文字列です。`append` で末尾に書き足します。
- **`apply`**: 値の中で処理をして、最後にその値自身を返す標準の関数です。`apply { ... }` と書くと、中では `this` がその値を指します。
- **`null`**: 値がないことを表します。`str2 != null` は、値があるかを調べる式です。
- **文字列テンプレート**: `"$str1 $str2"` のように、変数の値を文字列に埋め込みます。
- **拡張関数**: 既存の `StringBuilder` に、後から関数を足す書き方です。

## 何をしているか

### 1. 値があるかを確かめる

```kotlin:line-numbers=66
    if (str2 != null) {
```

2 つ目の値（`str2`）が `null` でないかを調べます。`null` なら、何もしません。

### 2. 句を書き足す

```kotlin:line-numbers=67
        this.append("$str1 $str2")
```

値があれば、前の文字列（`str1`）と、値を空白でつないで末尾に書き足します。`this` は、呼び出した `StringBuilder` 自身です。

### 3. 自分自身を返す

```kotlin:line-numbers=65
internal fun StringBuilder.appendIfNotNull(str1: String, str2: Any?) = apply {
```

`apply` で囲んでいるので、関数の戻り値は `StringBuilder` 自身です。そのため、呼び出し側は `appendIfNotNull(...)` の後ろに、さらに別の処理を続けて書けます。

## ここがすごい

- **書くかどうかの判断を 1 か所に集める**: `null` のときは書かない、という判断が関数の中にあるので、呼び出し側の `if` が不要になります。省略できる句を、いくつも並べやすくなります。
- **`apply` で続けて書ける**: 戻り値が自分自身なので、連鎖して呼び出せます。SQL の句を、順に並べるような書き方に向いています。
- **型は `Any?` で受け取る**: 2 つ目の値は、どんな型でも受け取れます。文字列に変換するのは、`"$str2"` の部分で自動的に行われます。
- **意味が名前で伝わる**: `appendIfNotNull` という名前から、「値があるときだけ書く」という意味が読み取れます。

## まとめ

- 省略できる句は、値の有無で書くかどうかを決めると、組み立ての処理が簡単になる。
- `apply` を使うと、書き足した後も同じ対象に続けて処理できる。
- 関数の名前で振る舞いを伝えると、呼び出し側で意図が読み取りやすくなる。
