---
title: "1 バイトずつ読んで UTF-8 の 1 文字を組み立てる"
description: "1 バイトずつ読みながら、先頭バイトの形から文字の長さを決め、続くバイトの下位 6 ビットを足して 1 つのコードポイントにする readBytesAsUtf8。"
language: kotlin
project: "Mordant"
repo: https://github.com/ajalt/mordant
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "2c588d7ccece0ea5c117f5174b18fd85cb017d74"
file: mordant/src/commonMain/kotlin/com/github/ajalt/mordant/internal/Utf8.kt
lines: [4, 37]
function: "readBytesAsUtf8"
difficulty: 2
tags: [文字列処理, ビット演算, パース]
format: 2
---

## ひとことで

`readBytesAsUtf8` は、1 バイトずつ読める入力から **UTF-8 で書かれた 1 文字ぶんを読み取り、その文字の番号（コードポイント）を返す** 関数です。

UTF-8 では、1 文字が 1 バイトから 4 バイトで表されます。最初のバイトの上位ビットを見ると、その文字が何バイトなのかが分かります。この関数は、その性質をそのまま使って、必要なぶんだけバイトを読み進めます。

## コード


::: code-group

```kotlin:line-numbers=4 [日本語訳]
internal fun readBytesAsUtf8(readByte: () -> Int?): Int? {
    val byte = readByte() ?: return null
    val byteLength: Int
    var codepoint: Int
    when {
        byte and 0b1000_0000 == 0x00 -> {
            return byte // 1 バイトの文字
        }

        byte and 0b1110_0000 == 0b1100_0000 -> {
            codepoint = byte and 0b11111
            byteLength = 2
        }

        byte and 0b1111_0000 == 0b1110_0000 -> {
            codepoint = byte and 0b1111
            byteLength = 3
        }

        byte and 0b1111_1000 == 0b1111_0000 -> {
            codepoint = byte and 0b111
            byteLength = 4
        }

        else -> error("Invalid UTF-8 byte")
    }

    repeat(byteLength - 1) {
        val next = readByte() ?: return null
        if (next and 0b1100_0000 != 0b1000_0000) error("Invalid UTF-8 byte")
        codepoint = codepoint shl 6 or (next and 0b0011_1111)
    }
    return codepoint
}
```

```kotlin:line-numbers=4 [原文]
internal fun readBytesAsUtf8(readByte: () -> Int?): Int? {
    val byte = readByte() ?: return null
    val byteLength: Int
    var codepoint: Int
    when {
        byte and 0b1000_0000 == 0x00 -> {
            return byte // 1-byte character
        }

        byte and 0b1110_0000 == 0b1100_0000 -> {
            codepoint = byte and 0b11111
            byteLength = 2
        }

        byte and 0b1111_0000 == 0b1110_0000 -> {
            codepoint = byte and 0b1111
            byteLength = 3
        }

        byte and 0b1111_1000 == 0b1111_0000 -> {
            codepoint = byte and 0b111
            byteLength = 4
        }

        else -> error("Invalid UTF-8 byte")
    }

    repeat(byteLength - 1) {
        val next = readByte() ?: return null
        if (next and 0b1100_0000 != 0b1000_0000) error("Invalid UTF-8 byte")
        codepoint = codepoint shl 6 or (next and 0b0011_1111)
    }
    return codepoint
}
```

:::

## 前提知識

- **UTF-8**: 世界中の文字を 1 バイトから 4 バイトで表す文字コードです。ASCII（英数字など）は 1 バイトで、日本語の多くは 3 バイトで表されます。
- **コードポイント**: 文字 1 つに割り当てられた番号です。たとえば「あ」は 0x3042 です。
- **ビット演算**: `and`（両方 1 のビットだけ残す）、`or`（どちらかが 1 なら 1）、`shl`（ビットを左にずらす）を使います。Kotlin では `and` や `shl` のような名前付きの演算を、中置の関数として書けます。
- **`readByte: () -> Int?`**: 引数として渡された「1 バイト読む関数」です。入力の終わりに達すると `null` を返します。この関数は入力の仕組みを知らず、ただ読む関数を呼ぶだけです。
- **`repeat(n) { ... }`**: `{ }` の中を `n` 回くり返す標準関数です。

## 何をしているか

### 1. 先頭バイトで文字の長さを決める

先頭のバイトの上位ビットで、何バイトの文字かを判定します。次は 2 バイトの文字かを調べる分岐です。

```kotlin:line-numbers=13
        byte and 0b1110_0000 == 0b1100_0000 -> {
            codepoint = byte and 0b11111
            byteLength = 2
        }
```

- `0xxxxxxx` なら 1 バイト。そのまま返します。
- `110xxxxx` なら 2 バイト。下位 5 ビットを取り出します。
- `1110xxxx` なら 3 バイト。下位 4 ビットを取り出します。
- `11110xxx` なら 4 バイト。下位 3 ビットを取り出します。
- それ以外（続きのバイトが先頭に来た場合など）は、エラーにします。

`when` の条件の `byte and 0b1110_0000 == 0b1100_0000` は、上位 3 ビットだけを取り出して、その値が `110` かどうかを調べています。

### 2. 続きのバイトを足す

```kotlin:line-numbers=31
    repeat(byteLength - 1) {
        val next = readByte() ?: return null
        if (next and 0b1100_0000 != 0b1000_0000) error("Invalid UTF-8 byte")
        codepoint = codepoint shl 6 or (next and 0b0011_1111)
    }
```

続きのバイトは必ず `10xxxxxx` の形です。それを確かめたら、下位 6 ビットを取り出して、今の値を 6 ビット左にずらしてから `or` で足します。2 バイトの文字なら 1 回、4 バイトなら 3 回くり返します。

### 3. 途中で入力が切れたら null

```kotlin:line-numbers=32
        val next = readByte() ?: return null
```

`readByte()` が `null` を返したら、文字の途中で入力が終わったことになるので、`return null` で何も返さずに終わります。

## ここがすごい

- **先頭バイトだけで長さが分かる**: 文字の長さを書いた別の情報は要りません。先頭の数ビットを見るだけで、読むべきバイト数が決まります。ストリームから 1 文字ずつ読む処理に向いた作りです。
- **1 バイトずつ読むので、入力の形を選ばない**: 引数は「1 バイト読む関数」だけです。ファイル、ソケット、端末の入力など、どの入力でも同じ関数で扱えます。
- **ビット操作だけで組み立てる**: 文字列を作ってから変換するのではなく、数値のまま積み上げています。計算が軽く、余計なメモリを使いません。
- **不正な入力は早めに気づく**: 続きのバイトの形が違えば、すぐにエラーにします。ただし、この関数は「過剰な長さで書かれた文字」（たとえば 1 バイトで表せる文字を 2 バイトで書いたもの）までは検査していません。厳密な検査が必要な場合は、別途確認が必要です。

## まとめ

- UTF-8 の先頭バイトの上位ビットを見れば、文字の長さが分かる。
- 続きのバイトは `10xxxxxx` の形なので、下位 6 ビットを左にずらしながら足していくと、文字の番号が組み上がる。
- 入力の終わりは `null` で表し、途中で切れた場合もそのまま `null` を返す。
