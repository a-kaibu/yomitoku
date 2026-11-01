---
title: "前後の引用符が対になっているときだけ、それを外す"
description: "文字列の前と後ろが両方とも二重引用符のときだけ、その引用符を外す clearQuotes。片方だけの場合や 1 文字だけの場合は、そのまま返す。"
language: kotlin
project: "Koin"
repo: https://github.com/InsertKoinIO/koin
license: Apache-2.0
copyright: "Copyright 2017-Present the original author or authors."
commit: "d486a5e8748f90db43f939e227083f2bd2c47c12"
file: projects/core/koin-core/src/commonMain/kotlin/org/koin/ext/StringExt.kt
lines: [18, 27]
function: "String.clearQuotes"
difficulty: 1
tags: [文字列処理, 防御的プログラミング]
format: 2
---

## ひとことで

`clearQuotes` は、文字列の **両端が二重引用符（`"`）で囲まれているときだけ、その引用符を取り除く** 関数です。`"hello"` は `hello` になり、`hello` や `"hello` はそのままです。

Koin は、設定の値を文字列で受け取ることがあり、その値が引用符で囲まれて届くことがあります。そのため、引用符の付いた値も、付いていない値も、同じように扱えるように、この関数で整えています。

## コード

```kotlin:line-numbers=18
fun String.clearQuotes(): String {
    val quoteChar = '"'
    return when {
        this.length <= 1 -> this
        this.first() == quoteChar && this.last() == quoteChar -> {
            this.substring(1, this.lastIndex)
        }
        else -> this
    }
}
```

## 前提知識

- **二重引用符（`"`）**: 文字列の両端を囲むための記号です。Kotlin では `"..."` の形で文字列を書きます。
- **`length`、`first()`、`last()`、`lastIndex`**: 文字列の長さ、先頭の文字、末尾の文字、最後の位置（長さ - 1）を表します。
- **`substring(開始, 終了)`**: 文字列の一部を取り出します。開始は含み、終了は含みません。
- **`when` の条件**: 上から順に条件を調べ、最初に当てはまった分岐の値を返します。条件のない `when` は、`if` の連なりと同じ意味です。
- **`val` の定数**: 文字を `quoteChar` という名前で持つと、引用符の意味が読み手に伝わります。

## 何をしているか

### 1. 1 文字以下なら、そのまま返す

```kotlin:line-numbers=21
        this.length <= 1 -> this
```

1 文字しかない文字列は、両端が引用符でも、外すと中身がなくなってしまいます。そのため、その場合はそのまま返します。

### 2. 両端が引用符なら、中身だけを取り出す

```kotlin:line-numbers=22
        this.first() == quoteChar && this.last() == quoteChar -> {
            this.substring(1, this.lastIndex)
        }
```

先頭と末尾の両方が引用符のときだけ、`substring(1, lastIndex)` で、その間の文字列を取り出します。`lastIndex` は、末尾の位置なので、そこは含まれません。

### 3. それ以外は、そのまま返す

```kotlin:line-numbers=25
        else -> this
```

片方だけ引用符が付いている場合や、引用符がまったく付いていない場合は、何も変えません。

## ここがすごい

- **対になっているときだけ外す**: 片方だけの引用符は、値の一部かもしれないので、外しません。「両端が揃っている」という条件で、誤って中身を壊さないようにしています。
- **短い文字列を先に除外する**: 1 文字の場合を最初に見ることで、`substring` の範囲が不正になる場面を避けています。
- **`lastIndex` を使う**: 末尾の位置を `length - 1` と書かずに `lastIndex` と書くと、意味が読み取りやすくなります。
- **元の文字列を変えない**: 新しい文字列を返すだけで、呼び出し元の値は変わりません。

## まとめ

- 引用符を外すときは、両端が揃っているかを確かめてから行う。
- 1 文字しかない場合は、外すと中身がなくなるので、そのまま返す。
- 添字の境界は `lastIndex` を使うと、読みやすく間違えにくい。
