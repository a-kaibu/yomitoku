---
title: "時差の文字列を解析して、失敗を例外にするか null にするか"
description: "時差の文字列を DateTimeFormatter で読む 2 つの関数。失敗を例外に変える parseWithFormat と、null で返す parseWithFormatOrNull の違いを見る。"
language: kotlin
project: "kotlinx-datetime"
repo: https://github.com/Kotlin/kotlinx-datetime
license: Apache-2.0
copyright: "Copyright 2019-2021 JetBrains s.r.o."
commit: "00831dc5ab0aa9df7f383e9f92591339d9e55c28"
file: core/jvm/src/UtcOffsetJvm.kt
lines: [103, 113]
function: "parseWithFormat, parseWithFormatOrNull"
difficulty: 2
tags: [パース, 防御的プログラミング, 日時]
format: 2
---

## ひとことで

`parseWithFormat` と `parseWithFormatOrNull` は、どちらも **時差（UTC オフセット）の文字列を、指定した書式で読み取る** 関数です。違いは、読めなかったときの扱いだけです。

- `parseWithFormat`: 読めなければ、kotlinx-datetime の例外（`DateTimeFormatException`）を投げます。
- `parseWithFormatOrNull`: 読めなければ、例外を投げずに `null` を返します。

呼び出し側が「必ず読めるはず」なら前者、「読めないこともある」なら後者を使います。同じ読み取りを、失敗の扱いだけ変えて 2 通りに書いた、よい例です。

## コード

```kotlin:line-numbers=103
private fun parseWithFormat(input: CharSequence, format: DateTimeFormatter) = try {
    format.parse(input, ZoneOffset::from).let(::UtcOffset)
} catch (e: DateTimeException) {
    throw DateTimeFormatException(e)
}

private fun parseWithFormatOrNull(input: CharSequence, format: DateTimeFormatter) = try {
    format.parse(input, ZoneOffset::from).let(::UtcOffset)
} catch (_: DateTimeException) {
    null
}
```

## 前提知識

- **`DateTimeFormatter`**: 日付や時刻の文字列を、書式に従って読み書きする Java の道具です。`+HHMM` のように、書式を文字列で指定できます。
- **`parse(input, ZoneOffset::from)`**: 文字列を読んで、`ZoneOffset`（時差）を取り出します。`ZoneOffset::from` は、読んだ結果から時差を作る関数への参照です。
- **`DateTimeException`**: Java の日付・時刻の処理で、読めなかったときなどに投げられる例外です。
- **`let(::UtcOffset)`**: 読んだ値を `UtcOffset` のコンストラクタに渡して、kotlinx-datetime の型に変える書き方です。
- **`try` 式**: `try` は値を返す式として使えます。最後に評価された値が、関数の戻り値になります。
- **`by lazy`**: 最初に使うときだけ初期化する、遅延初期化の書き方です。このファイルの `fourDigitsFormat` で使われています。

## 何をしているか

### 1. 読み取りを試みて、結果を UtcOffset にする

```kotlin:line-numbers=104
    format.parse(input, ZoneOffset::from).let(::UtcOffset)
```

書式に従って文字列を読み、時差の値を取り出して `UtcOffset` にします。2 つの関数で、この行はまったく同じです。違いは、失敗したときにどうするかだけです。

### 2. 失敗を例外として包み直す

```kotlin:line-numbers=105
} catch (e: DateTimeException) {
    throw DateTimeFormatException(e)
```

`parseWithFormat` は、Java の `DateTimeException` を kotlinx-datetime の `DateTimeFormatException` に包み直して、投げ直します。呼び出し側は、kotlinx-datetime の例外だけを扱えばよくなります。

### 3. 失敗を null にする

```kotlin:line-numbers=111
} catch (_: DateTimeException) {
    null
```

`parseWithFormatOrNull` は、同じ例外を受け取り、`null` を返します。`_` は、例外の値を使わないことを示す名前です。読めなかったという事実だけを返せば十分なので、例外の中身は捨てています。

## ここがすごい

- **同じ処理を 2 通りの失敗の扱いで書く**: 読み取りの部分を重複させても、失敗の扱いは 1 行だけ違います。読む人は、違いがどこにあるかをすぐ見つけられます。
- **例外の種類を揃えて外に出す**: Java の例外を、kotlinx-datetime の例外に包み直すことで、ライブラリの利用者が内部の実装を知らなくても使えます。
- **`_` で不要な値を明示する**: 使わない例外の名前を `_` にすると、「この値は意図して捨てている」と読み手に伝わります。
- **`try` を式として使う**: 関数の本体全体を `try` の式にしているので、`return` を書かずに結果を返せます。

## まとめ

- 読めないことを「ありえない失敗」とみなすなら例外に、「よくある失敗」とみなすなら `null` にする。
- 外部ライブラリの例外は、自分のライブラリの例外に包み直すと、利用者が扱いやすい。
- 使わない値は `_` で捨てる、と書くと、意図が読み手に伝わる。
