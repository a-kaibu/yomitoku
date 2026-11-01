---
title: "true と false だけを Boolean にする厳密な変換"
description: "文字列が「true」か「false」（大文字小文字は問わない）のときだけ Boolean の値にし、それ以外はすべて null を返す変換。yes や 1 などは受け付けない。"
language: kotlin
project: "kotlinx.serialization"
repo: https://github.com/Kotlin/kotlinx.serialization
license: Apache-2.0
copyright: "\"Copyright 2017-2019 JetBrains s.r.o.\""
commit: "6f6a2e66c3dbf4a34e86a030368ecb0f7a734d22"
file: formats/json/commonMain/src/kotlinx/serialization/json/internal/StringOps.kt
lines: [71, 75]
function: "String.toBooleanStrictOrNull"
difficulty: 1
tags: [型システム, 文字列処理, 防御的プログラミング]
format: 2
---

## ひとことで

文字列を真偽値（`Boolean`）に変えるとき、`"yes"` や `"1"` を真にしてよいかは、決めておく必要があります。`toBooleanStrictOrNull` は、**`true` と `false` だけ** を受け付けます。大文字小文字は問いませんが、それ以外は `null` を返します。

「厳密（Strict）」という名前は、ほかの書き方を勝手に解釈しないことを表しています。

## コード

```kotlin:line-numbers=71
internal fun String.toBooleanStrictOrNull(): Boolean? = when {
    this.equals("true", ignoreCase = true) -> true
    this.equals("false", ignoreCase = true) -> false
    else -> null
}
```

## 前提知識

- **`Boolean?`**: 真（`true`）か偽（`false`）か、あるいは値がない（`null`）を表す型です。
- **`when` 式（条件なし）**: 各分岐に書いた条件を、上から順に調べます。最初に当てはまった値を返します。
- **`equals(..., ignoreCase = true)`**: 大文字小文字を区別せずに、文字列が同じかを比べる書き方です。
- **拡張関数**: `String.toBooleanStrictOrNull` は、`String` に新しい関数を足したものです。

## 何をしているか

### 1. true と書かれていれば true

```kotlin:line-numbers=72
    this.equals("true", ignoreCase = true) -> true
```

`TRUE` や `True` も含めて、`true` と読める文字列は `true` にします。

### 2. false と書かれていれば false

```kotlin:line-numbers=73
    this.equals("false", ignoreCase = true) -> false
```

同じように、`FALSE` なども `false` にします。

### 3. それ以外は null

```kotlin:line-numbers=74
    else -> null
```

`"yes"`、`"1"`、空の文字列などは、どちらにも当てはまらないので `null` を返します。値がないことを、呼び出し側に伝えます。

## ここがすごい

- **曖昧な値を受け付けない**: `"yes"` や `"1"` を真として扱うと、データの読み間違いが起きやすくなります。受け付ける値を 2 つに絞って、誤解を防いでいます。
- **`null` で失敗を表す**: 変換できないときに例外を投げず、`null` を返します。呼び出し側は、`null` かどうかで処理を分けられます。
- **大文字小文字の差だけは許す**: JSON の `true` や `false` は小文字ですが、人が書いた値には大文字もあります。その差だけは受け入れています。
- **条件を上から並べるだけ**: `when` の 3 行で、すべての場合が一目で分かります。

## まとめ

- 文字列から真偽値にする変換では、受け付ける値を明確に決める。
- 変換できないときは例外ではなく `null` で知らせる。
- 大文字小文字など、意味の変わらない違いだけを許すと、扱いやすく誤解も少ない。
