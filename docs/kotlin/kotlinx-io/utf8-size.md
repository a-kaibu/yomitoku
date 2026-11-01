---
title: "文字列を変換せずに UTF-8 のバイト数を数える"
description: "文字列を実際にバイト列へ変換せず、UTF-8 で書いたときのバイト数だけを数える関数。1〜4 バイトの文字の区分と、不正なサロゲートの扱いを 1 文字ずつ判定する。"
language: kotlin
project: "kotlinx-io"
repo: https://github.com/Kotlin/kotlinx-io
license: Apache-2.0
copyright: "Copyright 2017-2023 JetBrains s.r.o. and respective authors and developers."
commit: "cf40e5ba7cd99ba812177d597a9f6ce0570545b1"
file: core/common/src/Utf8.kt
lines: [88, 123]
function: "String.utf8Size"
difficulty: 3
tags: [入出力, 文字列処理, Unicode]
format: 2
---

## ひとことで

文字列を UTF-8 のバイト列にすると、何バイトになるでしょうか。英字は 1 バイトですが、日本語の文字は 3 バイト、絵文字は 4 バイトになります。

`utf8Size` は、**実際に変換せずに、そのバイト数だけを数える** 関数です。バイト配列を用意する前に、必要な大きさを知りたいときに使います。

## コード


::: code-group

```kotlin:line-numbers=88 [日本語訳]
internal fun String.utf8Size(startIndex: Int = 0, endIndex: Int = length): Long {
    checkBounds(length, startIndex, endIndex)

    var result = 0L
    var i = startIndex
    while (i < endIndex) {
        val c = this[i].code

        if (c < 0x80) {
            // 1 バイトで書ける 7 ビットの文字
            result++
            i++
        } else if (c < 0x800) {
            // 2 バイトで書ける 11 ビットの文字
            result += 2
            i++
        } else if (c < 0xd800 || c > 0xdfff) {
            // 3 バイトで書ける 16 ビットの文字
            result += 3
            i++
        } else {
            val low = if (i + 1 < endIndex) this[i + 1].code else 0
            if (c > 0xdbff || low < 0xdc00 || low > 0xdfff) {
                // 不正なサロゲートで、'?' になる
                result++
                i++
            } else {
                // 4 バイトで書ける 21 ビットの文字
                result += 4
                i += 2
            }
        }
    }

    return result
}
```

```kotlin:line-numbers=88 [原文]
internal fun String.utf8Size(startIndex: Int = 0, endIndex: Int = length): Long {
    checkBounds(length, startIndex, endIndex)

    var result = 0L
    var i = startIndex
    while (i < endIndex) {
        val c = this[i].code

        if (c < 0x80) {
            // A 7-bit character with 1 byte.
            result++
            i++
        } else if (c < 0x800) {
            // An 11-bit character with 2 bytes.
            result += 2
            i++
        } else if (c < 0xd800 || c > 0xdfff) {
            // A 16-bit character with 3 bytes.
            result += 3
            i++
        } else {
            val low = if (i + 1 < endIndex) this[i + 1].code else 0
            if (c > 0xdbff || low < 0xdc00 || low > 0xdfff) {
                // A malformed surrogate, which yields '?'.
                result++
                i++
            } else {
                // A 21-bit character with 4 bytes.
                result += 4
                i += 2
            }
        }
    }

    return result
}
```

:::

## 前提知識

- **UTF-8**: 文字を 1 から 4 バイトで表す可変長の文字コードです。ASCII の文字は 1 バイトで、それ以外は長くなります。
- **`Char` と `code`**: Kotlin の `Char` は、UTF-16 の 1 単位（16 ビット）です。`code` で、その数値を取り出せます。
- **サロゲートペア**: 16 ビットに収まらない文字（多くの絵文字など）は、2 つの `Char`（上位と下位のサロゲート）で表されます。`0xd800` から `0xdbff` が上位、`0xdc00` から `0xdfff` が下位です。
- **`checkBounds`**: 範囲が文字列の中に収まるかを確かめる内部の関数です。
- **`Long`**: 64 ビットの整数です。バイト数は大きくなることがあるので、`Long` で数えます。

## 何をしているか

### 1. 7 ビットの文字は 1 バイト

```kotlin:line-numbers=96
        if (c < 0x80) {
```

0x80 より小さい文字は、ASCII の 1 バイトの文字です。1 増やして、次の文字へ進みます。

### 2. 11 ビットまでは 2 バイト

```kotlin:line-numbers=100
        } else if (c < 0x800) {
```

0x800 より小さい文字は 2 バイトで書けます。

### 3. サロゲートでなければ 3 バイト

```kotlin:line-numbers=104
        } else if (c < 0xd800 || c > 0xdfff) {
```

サロゲートの範囲（`0xd800` から `0xdfff`）の外なら、3 バイトになります。日本語の文字の多くは、ここに入ります。

### 4. サロゲートなら、後ろと合わせて 4 バイト

```kotlin:line-numbers=110
            if (c > 0xdbff || low < 0xdc00 || low > 0xdfff) {
```

上位のサロゲートの後ろに、正しい下位のサロゲートが続いていれば、2 文字で 4 バイトになり、`i` を 2 つ進めます。正しくない組み合わせなら、'?' 1 文字（1 バイト）として数えます。

## ここがすごい

- **変換せずに数える**: 実際にバイト配列を作らないので、メモリを使わずに大きさだけ分かります。
- **文字の範囲で場合分けする**: 文字の数値の範囲を順に見ていくので、判定が 1 回の比較で済みます。
- **不正な入力も落ちない**: 対になっていないサロゲートは、実際の変換でも '?' になります。数える側も同じ規則にそろえているので、数と結果が一致します。
- **サロゲートペアを 1 単位で扱う**: 2 文字を 1 つの文字として読むので、4 バイトを正しく数えられます。

## まとめ

- UTF-8 のバイト数は、文字の数値の範囲で 1、2、3、4 のどれかに決まる。
- 変換せずに数えると、バイト配列を作る前に大きさを知れる。
- 不正なサロゲートは、実際の変換と同じ '?' 1 バイトとして数える。
