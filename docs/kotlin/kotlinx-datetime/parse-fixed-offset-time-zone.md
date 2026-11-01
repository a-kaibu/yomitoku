---
title: "UTC+09:00 のような文字列から、固定の時差を持つタイムゾーンを作る"
description: "UTC、Z、+09:00、GMT+09:00 などの書き方を見分け、固定の時差としてタイムゾーンにする parseFixedOffsetTimeZone。読めなければ null を返す。"
language: kotlin
project: "kotlinx-datetime"
repo: https://github.com/Kotlin/kotlinx-datetime
license: Apache-2.0
copyright: "Copyright 2019-2025 JetBrains s.r.o. and contributors."
commit: "00831dc5ab0aa9df7f383e9f92591339d9e55c28"
file: core/common/src/internal/tz/FixedOffsetTimeZoneDatabase.kt
lines: [32, 55]
function: "parseFixedOffsetTimeZone"
difficulty: 2
tags: [パース, 文字列処理, 日時]
format: 2
---

## ひとことで

`parseFixedOffsetTimeZone` は、タイムゾーンを表す文字列を読んで、**「世界の標準時からの固定のずれ（時差）」だけで決まるタイムゾーン** を作る関数です。

たとえば `"+09:00"` や `"UTC+09:00"` は、夏時間などの変更がない、決まった時差として扱えます。この関数は、その形の文字列を見分けて、対応するタイムゾーンを返します。見分けられない文字列の場合は、`null` を返して、次の候補に任せます。

kotlinx-datetime が、タイムゾーンの名前から正しい情報を探すときに使う、前の段階の処理です。

## コード

```kotlin:line-numbers=32
private fun <T> parseFixedOffsetTimeZone(
    id: String, onParsed: (TimeZone) -> T, onFailure: (String) -> T
): T? {
    fun parse(offset: String, prefix: String?): T = when (val parsedOffset = lenientOffsetFormat.parseOrNull(offset)) {
        null -> onFailure(offset)
        else -> if (prefix != null) {
            onParsed(FixedOffsetTimeZone.withSpecificPrefix(parsedOffset, prefix))
        } else {
            onParsed(parsedOffset.asTimeZone())
        }
    }
    return when {
        id == "UTC" -> onParsed(TimeZone.UTC)
        id == "Z" || id == "z" -> onParsed(UtcOffset.ZERO.asTimeZone())
        id.length == 1 -> null
        id.startsWith("+") || id.startsWith("-") -> parse(id, null)
        id == "GMT" || id == "UT" -> onParsed(FixedOffsetTimeZone.withSpecificName(UtcOffset.ZERO, id))
        id.startsWith("UTC+") || id.startsWith("GMT+") || id.startsWith("UTC-") || id.startsWith("GMT-") ->
            parse(id.substring(3), id.take(3))
        id.startsWith("UT+") || id.startsWith("UT-") ->
            parse(id.substring(2), "UT")
        else -> null
    }
}
```

## 前提知識

- **時差（UTC オフセット）**: 世界の標準時（UTC）との差です。日本は `+09:00` で、9 時間進んでいます。
- **タイムゾーン（TimeZone）**: 地域のルールをまとめたものです。時差が固定のものと、夏時間などで変わるものがあります。
- **`UtcOffset`**: 時差だけを表す型です。`asTimeZone()` で、その時差だけを持つタイムゾーンに変えられます。
- **`lenientOffsetFormat`**: 時差の文字列を、いろいろな書き方（`+9`、`+09:00` など）で読める、ゆるい形式の解析器です。この関数の外で定義されています。
- **ローカル関数**: 関数の中に書いた関数です。ここでは `parse` が、時差を読んでから結果を作る部分をまとめています。
- **ジェネリクス `T`**: 戻り値の型を呼び出し側が決められるようにした仕組みです。`onParsed` と `onFailure` が、同じ型 `T` の値を返すことで、成功と失敗を呼び出し側の好きな形で扱えます。

## 何をしているか

### 1. 特別な名前を先に見分ける

```kotlin:line-numbers=44
        id == "UTC" -> onParsed(TimeZone.UTC)
        id == "Z" || id == "z" -> onParsed(UtcOffset.ZERO.asTimeZone())
        id.length == 1 -> null
```

`"UTC"` は標準の UTC、`"Z"` と `"z"` は時差ゼロとして扱います。1 文字だけの名前は、ほかに意味がないので `null` にします。

### 2. 符号で始まる時差を読む

```kotlin:line-numbers=47
        id.startsWith("+") || id.startsWith("-") -> parse(id, null)
```

`+09:00` のように符号で始まるものは、そのまま時差として読みます。前に名前が付かないので、`prefix` は `null` です。

### 3. 名前の付いた時差を読む

```kotlin:line-numbers=49
        id.startsWith("UTC+") || id.startsWith("GMT+") || id.startsWith("UTC-") || id.startsWith("GMT-") ->
            parse(id.substring(3), id.take(3))
```

`UTC+09:00` のように、名前と時差が並ぶものは、最初の 3 文字を名前として取り出し、残りを時差として読みます。`id.substring(3)` が `+09:00`、`id.take(3)` が `UTC` です。結果のタイムゾーンには、この名前が付きます。

### 4. ローカル関数 parse の中身

```kotlin:line-numbers=35
    fun parse(offset: String, prefix: String?): T = when (val parsedOffset = lenientOffsetFormat.parseOrNull(offset)) {
        null -> onFailure(offset)
        else -> if (prefix != null) {
            onParsed(FixedOffsetTimeZone.withSpecificPrefix(parsedOffset, prefix))
        } else {
            onParsed(parsedOffset.asTimeZone())
        }
    }
```

時差として読めれば、`prefix` があるかどうかで作り方を変えます。読めなければ `onFailure` に、読めなかった文字列を渡します。

## ここがすごい

- **分岐の順番が意味を持つ**: `"UTC"` を先に見て、`"UTC+"` のような名前付きの形はその後に見ています。`id.length == 1` の判定も、`"Z"` より後にあるので、`"Z"` は正しく時差ゼロになります。上から順に見ていけば、曖昧な入力も決まった答えになります。
- **成功と失敗の扱いを呼び出し側に任せる**: `onParsed` と `onFailure` を引数で受け取り、戻り値の型 `T` で結果を表しています。同じ関数を「タイムゾーンそのもの」「`null`」など、用途に合わせて使い回せます。
- **名前と時差を分けて扱う**: 名前の部分は `substring` と `take` で切り出すだけで、解析はすべて時差の解析器に任せています。役割が分かれているので、読むときも書くときも迷いにくい作りです。
- **読めないものは早めに `null` にする**: どの条件にも当てはまらない文字列は、`else -> null` で終わります。例外を投げず、呼び出し側が次の探し方に進めるようになっています。

## まとめ

- タイムゾーンの文字列は、特別な名前、符号で始まる時差、名前付きの時差、の順に見分ける。
- 名前は文字列の先頭から切り出し、時差は時差の解析器にまかせる。
- 成功と失敗の扱いを関数の引数にすると、同じ解析処理を別の用途に使い回せる。
