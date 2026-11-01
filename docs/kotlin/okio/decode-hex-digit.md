---
title: "1 文字の 16 進数を値に直す decodeHexDigitIgnoreWhitespace"
description: "16 進数の 1 文字を、0 から 15 の値に変換する decodeHexDigitIgnoreWhitespace。空白は -1 として印を付けて呼び出し側に任せ、知らない文字は例外で止める。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "Copyright (C) 2018 Square, Inc."
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/internal/ByteString.kt
lines: [376, 384]
function: "decodeHexDigitIgnoreWhitespace"
difficulty: 2
tags: [文字列処理, 防御的プログラミング, ビット演算]
format: 2
---

## ひとことで

`decodeHexDigitIgnoreWhitespace()` は、16 進数の **1 文字** を、その値（0 から 15）に変える関数です。空白や改行に当たる文字は、値の代わりに `-1` を返して、読み飛ばせるようにします。知らない文字なら、例外で止めます。

前の記事の `decodeHexIgnoreWhitespace` が、1 文字ずつこの関数を呼んでいます。

## コード

```kotlin:line-numbers=376
private fun decodeHexDigitIgnoreWhitespace(c: Char): Int {
  return when (c) {
    in '0'..'9' -> c - '0'
    in 'a'..'f' -> c - 'a' + 10
    in 'A'..'F' -> c - 'A' + 10
    ' ', '\r', '\n', '\t' -> -1
    else -> throw IllegalArgumentException("Unexpected hex digit: $c")
  }
}
```

## 前提知識

- **文字の値を数字にする**: `'0'` のような文字は、コンピュータの中では番号（文字コード）で表されています。`'9' - '0'` を計算すると、差の `9` が得られます。
- **`when (c)` と範囲**: `in '0'..'9'` は、その範囲の文字に当てはまるかを調べる書き方です。範囲に入った最初の枝の値が使われます。
- **`Char` どうしの引き算**: 2 つの文字を引くと、その差の `Int` が得られます。`c - 'a' + 10` は、「a からの差に 10 を足す」という意味です。
- **`-1` の役割**: 0 から 15 の値と重ならない数です。呼び出し側は「`-1` なら読み飛ばす」と判断できます。
- **`IllegalArgumentException`**: 引数の値が不正なときに投げる例外です。

## 何をしているか

### 数字を値にする

```kotlin:line-numbers=378
    in '0'..'9' -> c - '0'
```

`'0'` から `'9'` は、そのまま 0 から 9 の値になります。

```kotlin:line-numbers=380
    in 'A'..'F' -> c - 'A' + 10
```

大文字の `A` から `F` は、10 から 15 の値になります。小文字の `a` から `f` の枝と同じ形です。大文字と小文字を、別々の枝で受け止めています。

### 空白は印で知らせる

```kotlin:line-numbers=381
    ' ', '\r', '\n', '\t' -> -1
```

空白、改行、タブは、値を持たないので `-1` を返します。呼び出し側は、その値を見て読み飛ばします。

### 知らない文字は例外

```kotlin:line-numbers=382
    else -> throw IllegalArgumentException("Unexpected hex digit: $c")
```

16 進数でも空白でもない文字は、例外で止めます。間違った文字を、黙って 0 にしないようにしています。

## ここがすごい

- **1 つの `when` で全部を決める**: 数字、大文字、小文字、空白、それ以外を、1 か所の分岐で分けています。読めば、受け入れる文字の一覧がそのまま分かります。
- **文字のずれを使った計算**: 文字コードの差を使うので、表を書かなくても値が求まります。`A` と `a` の枝を分けておくことで、大文字と小文字の両方を、同じ値に変換できます。
- **空白の扱いを呼び出し側に委ねる**: `-1` という印を返すだけにして、読み飛ばす判断は呼び出し側に任せています。この関数は、1 文字の変換だけに集中しています。
- **不正な入力を見逃さない**: 知らない文字は必ず例外になるので、壊れたデータを読み続けることがありません。

## まとめ

- `decodeHexDigitIgnoreWhitespace` は、16 進数の 1 文字を 0 から 15 の値に変える。
- 空白は `-1` で知らせ、読み飛ばすかどうかは呼び出し側が決める。
- 16 進数でも空白でもない文字は、例外で止めて間違いを見逃さない。
