---
title: "文字番号を文字列に戻す、サロゲートペアの作り方"
description: "コードポイント（文字の番号）を文字列にする codepointToString。BMP の文字はそのまま 1 文字に、それより大きい文字は 2 つの代理文字（サロゲートペア）に分けて作る。"
language: kotlin
project: "Mordant"
repo: https://github.com/ajalt/mordant
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "2c588d7ccece0ea5c117f5174b18fd85cb017d74"
file: mordant/src/commonMain/kotlin/com/github/ajalt/mordant/internal/Utf8.kt
lines: [40, 54]
function: "codepointToString"
difficulty: 2
tags: [文字列処理, ビット演算]
format: 2
---

## ひとことで

`codepointToString` は、文字の番号（コードポイント）を受け取って、**その文字を表す `String` を返す** 関数です。

Kotlin（JVM）の文字列は、内部では 16 ビットの `Char` を並べて作られています。そのため、16 ビットに収まる文字はそのまま 1 つの `Char` にでき、収まらない文字は **2 つの `Char` の組み合わせ** で表す必要があります。この関数は、その 2 つの場合を分けて処理しています。

## コード

```kotlin:line-numbers=40
internal fun codepointToString(codePoint: Int): String {
    return when (codePoint) {
        in 0..0xFFFF -> {
            Char(codePoint).toString()
        }
        in 0x10000..0x10FFFF -> {
            val highSurrogate = Char(((codePoint - 0x10000) shr 10) or 0xD800)
            val lowSurrogate = Char(((codePoint - 0x10000) and 0x3FF) or 0xDC00)
            highSurrogate.toString() + lowSurrogate.toString()
        }
        else -> {
            throw IllegalArgumentException("Invalid code point: $codePoint")
        }
    }
}
```

## 前提知識

- **コードポイントの範囲**: Unicode の文字番号は 0 から 0x10FFFF までです。0 から 0xFFFF までを BMP（基本多言語面）と呼び、日本語の文字の大半はここに入ります。
- **サロゲートペア**: 0xFFFF を超える文字（絵文字や一部の漢字など）は、2 つの 16 ビットの値で表します。前の値を上位サロゲート（0xD800 から 0xDBFF）、後の値を下位サロゲート（0xDC00 から 0xDFFF）と呼びます。
- **`Char(code: Int)`**: 数値から 1 つの `Char` を作ります。
- **`when (値) { in 範囲 -> ... }`**: 値がその範囲に入るかで分岐する書き方です。
- **`shr` と `and`**: `shr` は右にビットをずらし、`and` は下位ビットだけを取り出す演算です。

## 何をしているか

### 1. 16 ビットに収まる文字

```kotlin:line-numbers=42
        in 0..0xFFFF -> {
            Char(codePoint).toString()
        }
```

0 から 0xFFFF の範囲なら、その数を 1 つの `Char` にして文字列にするだけです。日本語の「あ」（0x3042）はこの場合です。

### 2. 16 ビットを超える文字

```kotlin:line-numbers=45
        in 0x10000..0x10FFFF -> {
            val highSurrogate = Char(((codePoint - 0x10000) shr 10) or 0xD800)
            val lowSurrogate = Char(((codePoint - 0x10000) and 0x3FF) or 0xDC00)
            highSurrogate.toString() + lowSurrogate.toString()
        }
```

まず `codePoint - 0x10000` で、0x10000 からの差を求めます。その値は 20 ビットに収まります。

- 上位 10 ビットを `shr 10` で取り出し、`or 0xD800` で上位サロゲートにします。
- 下位 10 ビットを `and 0x3FF` で取り出し、`or 0xDC00` で下位サロゲートにします。

たとえば 😀（コードポイント 0x1F600）の場合は、差が 0xF600 になります。上位は `0xF600 shr 10 = 0x3D` で、`0xD83D` になります。下位は `0xF600 and 0x3FF = 0x200` で、`0xDE00` になります。結果は `😀` という 2 つの `Char` の並びです。

### 3. 範囲外はエラー

```kotlin:line-numbers=50
        else -> {
            throw IllegalArgumentException("Invalid code point: $codePoint")
        }
```

0 より小さい値や 0x10FFFF を超える値は、文字として表せないので例外にします。

## ここがすごい

- **番号を計算で分けている**: サロゲートペアの仕組みを、表を引くのではなく、ビットのずらしと `or` だけで作っています。規則が単純なので、数行で書けます。
- **範囲で場合分けしている**: `when` の範囲指定が、「1 文字で足りるか、2 文字必要か、そもそも無効か」をそのまま表しています。読むときも、この 3 つを順に確認すれば分かります。
- **例外メッセージに値を入れている**: 無効な値を渡されたとき、どの値が悪かったのかがすぐ分かります。

## まとめ

- 16 ビットに収まる文字は 1 つの `Char` で表せる。
- それより大きい文字は、差を取って 10 ビットずつに分け、上位と下位のサロゲートにする。
- 範囲外の値は、例外で早めに知らせる。
