---
title: "二重に囲まないためのバッククォート判定"
description: "Kotlin の予約語や使えない文字を含む名前を、バッククォートで囲む前に、すでに囲まれていないかを確かめる alreadyEscaped。コード生成で同じ囲みを重ねないための小さな関数。"
language: kotlin
project: "KotlinPoet"
repo: https://github.com/square/kotlinpoet
license: Apache-2.0
copyright: "Copyright (C) 2015 Square, Inc."
commit: "537e8fac8fdecff22aad801a33557aa0d46b5730"
file: kotlinpoet/src/commonMain/kotlin/com/squareup/kotlinpoet/Util.kt
lines: [351, 356]
function: "String.alreadyEscaped / escapeIfKeyword"
difficulty: 2
tags: [文字列処理, イディオム, 防御的プログラミング]
format: 2
---

## ひとことで

`alreadyEscaped()` は、名前がすでに **バッククォート（`）で囲まれているか** を調べる関数です。KotlinPoet（Kotlin のコードを作るライブラリ）は、予約語など、そのままでは使えない名前をバッククォートで囲みます。そのとき、すでに囲まれた名前をもう一度囲んでしまわないように、この判定を使います。

## コード

```kotlin:line-numbers=351
private fun String.alreadyEscaped() = startsWith("`") && endsWith("`")

private fun String.escapeIfKeyword() = if (isKeyword && !alreadyEscaped()) "`$this`" else this

private fun String.escapeIfHasAllowedCharacters() =
  if (hasAllowedCharacters && !alreadyEscaped()) "`$this`" else this
```

## 前提知識

- **バッククォート（`）**: Kotlin では、予約語や空白を含む名前も、バッククォートで囲むと識別子として使えます。たとえば `` `class` `` は、`class` という名前の変数を表せます。
- **予約語（キーワード）**: `class` や `fun` のように、言語の文法で特別な意味を持つ単語です。そのままでは名前に使えません。
- **`startsWith` と `endsWith`**: 文字列が特定の文字で始まり、特定の文字で終わるかを調べるメソッドです。
- **式本体の関数**: `= ...` の形で、戻り値を 1 行で書く関数です。
- **`&&`**: 両方が真のときだけ真になる論理演算です。

## 何をしているか

### 囲まれているかを判定する

```kotlin:line-numbers=351
private fun String.alreadyEscaped() = startsWith("`") && endsWith("`")
```

先頭が `` ` `` で、末尾も `` ` `` なら、すでに囲まれていると判断します。両方を確かめるので、片方だけに偶然バッククォートがあるような名前は、囲まれているとはみなしません。

### 予約語の名前だけ囲む

```kotlin:line-numbers=353
private fun String.escapeIfKeyword() = if (isKeyword && !alreadyEscaped()) "`$this`" else this
```

予約語であり、かつまだ囲まれていないときだけ、バッククォートで囲みます。`!alreadyEscaped()` の否定が、二重の囲みを防いでいます。

### 許される文字だけの名前も同じ考え方

```kotlin:line-numbers=355
private fun String.escapeIfHasAllowedCharacters() =
  if (hasAllowedCharacters && !alreadyEscaped()) "`$this`" else this
```

予約語ではなくても、使える文字だけでできていない名前は、囲みが必要です。その場合にも、同じ判定を使って二重に囲まないようにしています。

## ここがすごい

- **判定が 1 か所にまとまる**: 「囲まれているか」の判定を 1 つの関数に分けたので、囲む関数はどれも同じ条件を使えます。条件を変えるときも、直す場所は 1 つで済みます。
- **否定の使い方が明快**: 「予約語であり、かつ囲まれていない」という条件を、読みやすく並べています。
- **式本体の関数で短く書ける**: 1 行で済むので、判定の役割が一目で分かります。
- **端の文字だけで判定する理由**: バッククォートは名前の前後に付くものなので、先頭と末尾だけを見れば十分に判定できます。中身を全部調べる必要はありません。

## まとめ

- `alreadyEscaped` は、名前の先頭と末尾がバッククォートかどうかで、囲み済みかを判定する。
- 予約語や使えない文字の囲みの前に必ず確かめて、二重の囲みを防ぐ。
- 判定を 1 つの関数にまとめると、囲む条件の変更が 1 か所で済む。
