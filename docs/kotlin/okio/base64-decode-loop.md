---
title: "4 文字を 3 バイトに戻す Base64 のデコードループ"
description: "Base64 の文字を 6 ビットの値に直し、4 文字ごとに 24 ビットを取り出して 3 バイトにする Okio のデコード処理の中心部分。文字の範囲ごとに値を計算する。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "\"Copyright (C) 2014 Square, Inc.\""
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/Base64.kt
lines: [49, 88]
function: "String.decodeBase64ToArray（デコードのループ部分）"
difficulty: 3
tags: [入出力, ビット演算, 文字列処理]
format: 2
---

## ひとことで

Base64 は、バイナリのデータ（画像や暗号の値など）を、英数字と記号だけの文字列に書き換える方式です。`decodeBase64ToArray` は、その文字列を **元のバイト列に戻す** 関数で、ここではその中心の繰り返し（ループ）を見ます。

基本の考え方は、**1 文字が 6 ビットの値を表し、4 文字ごとに 24 ビットをまとめて 3 バイトを取り出す** というものです。

## コード


::: code-group

```kotlin:line-numbers=49 [日本語訳]
    for (pos in 0 until limit) {
      val c = this[pos]

      val bits: Int
      if (c in 'A'..'Z') {
        // 文字  ASCII の値  値
        //  A    65    0
        //  Z    90    25 (ASCII - 65)
        bits = c.code - 65
      } else if (c in 'a'..'z') {
        // 文字  ASCII の値  値
        //  a    97    26
        //  z    122   51 (ASCII - 71)
        bits = c.code - 71
      } else if (c in '0'..'9') {
        // 文字  ASCII の値  値
        //  0    48    52
        //  9    57    61 (ASCII + 4)
        bits = c.code + 4
      } else if (c == '+' || c == '-') {
        bits = 62
      } else if (c == '/' || c == '_') {
        bits = 63
      } else if (c == '\n' || c == '\r' || c == ' ' || c == '\t') {
        continue
      } else {
        return null
      }

      // この文字の 6 ビットを word に足す
      word = word shl 6 or bits

      // 入力の 4 文字ごとに、24 ビットの出力がたまる。3 バイト出す
      inCount++
      if (inCount % 4 == 0) {
        out[outCount++] = (word shr 16).toByte()
        out[outCount++] = (word shr 8).toByte()
        out[outCount++] = word.toByte()
      }
    }
```

```kotlin:line-numbers=49 [原文]
  for (pos in 0 until limit) {
    val c = this[pos]

    val bits: Int
    if (c in 'A'..'Z') {
      // char ASCII value
      //  A    65    0
      //  Z    90    25 (ASCII - 65)
      bits = c.code - 65
    } else if (c in 'a'..'z') {
      // char ASCII value
      //  a    97    26
      //  z    122   51 (ASCII - 71)
      bits = c.code - 71
    } else if (c in '0'..'9') {
      // char ASCII value
      //  0    48    52
      //  9    57    61 (ASCII + 4)
      bits = c.code + 4
    } else if (c == '+' || c == '-') {
      bits = 62
    } else if (c == '/' || c == '_') {
      bits = 63
    } else if (c == '\n' || c == '\r' || c == ' ' || c == '\t') {
      continue
    } else {
      return null
    }

    // Append this char's 6 bits to the word.
    word = word shl 6 or bits

    // For every 4 chars of input, we accumulate 24 bits of output. Emit 3 bytes.
    inCount++
    if (inCount % 4 == 0) {
      out[outCount++] = (word shr 16).toByte()
      out[outCount++] = (word shr 8).toByte()
      out[outCount++] = word.toByte()
    }
  }
```

:::

## 前提知識

- **Base64**: 64 種類の文字（`A-Z`、`a-z`、`0-9`、`+`、`/`）だけで、バイナリを表す方式です。1 文字が 6 ビット（2 の 6 乗 = 64 通り）を表します。
- **ASCII**: 文字を数の番号に対応させた規格です。`'A'` は 65、`'a'` は 97、`'0'` は 48 です。
- **`word`**: 読んだ文字の 6 ビットを順に詰めていく変数です。`word shl 6 or bits` で、左に 6 ビットずらしてから新しい 6 ビットを足します。
- **`toByte()`**: 整数の下位 8 ビットを、バイトとして取り出す変換です。
- **`continue`**: ループの先頭に戻り、この文字を飛ばします。改行や空白は無視するためです。

## 何をしているか

### 1. 文字を 6 ビットの値に直す

文字ごとに範囲を調べ、値を求めます。`A` から `Z` は `65` を引いて 0 から 25、`0` から `9` は `+4` して 52 から 61 にします。`+` と `-` は 62、`/` と `_` は 63 です。

```kotlin:line-numbers=68
      } else if (c == '+' || c == '-') {
        bits = 62
      } else if (c == '/' || c == '_') {
        bits = 63
```

`-` と `_` は、URL で使える安全な形（`base64Url`）のための文字です。どちらも同じ値として扱います。

### 2. 6 ビットを word に詰める

求めた 6 ビットを `word` の下位に足します。

```kotlin:line-numbers=79
      word = word shl 6 or bits
```

### 3. 4 文字ごとに 3 バイトを取り出す

4 文字（24 ビット）たまったら、上の 8 ビットから順に 3 つのバイトを取り出します。

```kotlin:line-numbers=84
        out[outCount++] = (word shr 16).toByte()
        out[outCount++] = (word shr 8).toByte()
        out[outCount++] = word.toByte()
```

`shr` で、取りたい 8 ビットを下位へずらし、`toByte()` で下位 8 ビットだけを取り出しています。

## ここがすごい

- **空白や改行を無視する**: 長い Base64 はメールなどで途中に改行が入ります。それを飛ばして読めるので、整形された入力もそのまま扱えます。
- **表を計算で持つ**: 文字ごとの値を配列や表にせず、ASCII の番号の差で求めています。短く、速く書けます。
- **ビットを流す仕組み**: `word` にずっと足していき、4 文字たまったら取り出すという形で、ビットの境目を気にせずに済みます。
- **不正な文字は即座に失敗**: 知らない文字が来たら `null` を返して、データが壊れていることを知らせます。

## まとめ

- Base64 は 1 文字が 6 ビットなので、4 文字で 24 ビット、つまり 3 バイトになる。
- 文字の番号の差を使うと、表を持たずに値を求められる。
- 途中の空白は無視し、知らない文字は失敗として返す。
