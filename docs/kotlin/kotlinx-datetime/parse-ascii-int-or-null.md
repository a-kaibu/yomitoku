---
title: "数字の文字列を 1 文字ずつ整数にする、溢れ検出つきの parse"
description: "文字列の一部分を 1 桁ずつ数値にしていく parseAsciiIntOrNull。各桁を足すたびに負になったかを確かめ、Int に収まらない数を null で知らせる。"
language: kotlin
project: "kotlinx-datetime"
repo: https://github.com/Kotlin/kotlinx-datetime
license: Apache-2.0
copyright: "Copyright 2023 JetBrains s.r.o. and contributors."
commit: "00831dc5ab0aa9df7f383e9f92591339d9e55c28"
file: core/common/src/internal/format/parser/NumberConsumer.kt
lines: [171, 179]
function: "CharSequence.parseAsciiIntOrNull"
difficulty: 2
tags: [文字列処理, パース, 数値計算]
format: 2
---

## ひとことで

`parseAsciiIntOrNull` は、文字列の **指定した範囲だけ** を、10 進数の整数として読み取る関数です。読んだ結果が `Int` に収まらないときは、例外ではなく `null` を返します。

たとえば `"2024-06-01"` の `"2024"` の部分だけを読みたいとき、文字列を分けずに、開始位置と終了位置で範囲を指定して読めます。kotlinx-datetime が日付や時刻を読むときの、内部の小さな部品です。

## コード

```kotlin:line-numbers=171
private fun CharSequence.parseAsciiIntOrNull(start: Int, end: Int): Int? {
    var result = 0
    for (i in start until end) {
        val digit = this[i]
        result = result * 10 + digit.asciiDigitToInt()
        if (result < 0) return null
    }
    return result
}
```

## 前提知識

- **`CharSequence`**: 文字列を読むための共通の型です。`String` もこれに含まれます。`this[i]` で `i` 番目の文字を取り出せます。
- **`start` と `end`**: 読む範囲を表す位置です。`start` は含み、`end` は含みません。`end - start` が桁数になります。
- **ASCII の数字**: `'0'` から `'9'` の文字です。`digit.asciiDigitToInt()` は `this - '0'` と同じで、文字 `'7'` を数値の 7 にします。
- **整数の溢れ（オーバーフロー）**: `Int` は 32 ビットの整数で、最大値は `2147483647` です。それを超える計算をすると、値は負の数に折り返されます。
- **`null` で失敗を表す**: 「数として読めない」「大きすぎる」といった失敗を、戻り値の型 `Int?` で表します。呼び出す側は `null` かどうかを確かめて処理を分けます。

## 何をしているか

### 1. 1 桁ずつ積み上げる

```kotlin:line-numbers=173
    for (i in start until end) {
        val digit = this[i]
        result = result * 10 + digit.asciiDigitToInt()
```

左から順に 1 文字ずつ読み、今までの結果を 10 倍して、新しい桁を足します。`"123"` なら、1、12、123 と値が増えていきます。10 進数の読み方と同じ計算です。

### 2. 負になったら、溢れたとみなして止める

```kotlin:line-numbers=176
        if (result < 0) return null
```

`Int` の計算が溢れると、値は負に折り返されます。途中で負になったら、大きすぎる数だったと判断して、すぐ `null` を返します。桁数の多い数字を読んでも、無駄に最後まで計算しません。

### 3. 最後まで読めたら結果を返す

```kotlin:line-numbers=178
    return result
```

範囲の全部の文字を読み終えたら、積み上げた値をそのまま返します。範囲が空（`start == end`）なら、ループは回らず `0` を返します。

## ここがすごい

- **溢れを計算の途中で見つける**: 読み終わってから値の範囲を調べるのではなく、1 桁足すたびに負かどうかを確かめます。`Long` などに広げずに、`Int` の中だけで判定できる軽い作りです。
- **範囲指定で文字列を切らない**: 部分文字列を作らずに、位置だけで読みます。日付や時刻のように、長い文字列の中の決まった場所から数を読むときに、余計なメモリを使いません。
- **失敗を型で表す**: 失敗を例外にせず `null` にすることで、呼び出し側が「読めなかった」場合を普通の分岐として扱えます。

### 注意点: 桁数が多いと、負にならずに折り返すことがある

この関数は、桁数の上限を自分では確かめていません。`10` 桁の数字だと、値が負にならないまま折り返すことがあります。たとえば `"4294967300"` は、9 桁目までは正しく読めますが、10 桁目を足したときに値が `4` に折り返され、`null` ではなく `4` を返します。`"12345678901"` は負になるので、正しく `null` になります。

そのため、この関数の安全性は、呼び出し側が桁数を制限していることに頼っています。上の `UnsignedIntConsumer` では、`maxLength` で桁数の上限を確かめてから呼んでいます。

## まとめ

- 文字列の範囲を位置で指定し、1 桁ずつ `10` 倍して足すと、10 進数の文字列を整数にできる。
- 途中で負になったら溢れたとみなして `null` を返すと、大きすぎる数を早めに弾ける。
- ただし、負にならずに折り返す場合があるので、桁数の上限は呼び出し側で確かめておく必要がある。
