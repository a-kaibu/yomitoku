---
title: "空白を飛ばして 16 進数の文字列をバイト列にする"
description: "16 進数の文字列を、空白や改行を飛ばしながら 2 桁ずつ読んでバイト列にする decodeHexIgnoreWhitespace。ラベル付きの continue で二重ループを抜け、途中で桁数が奇数なら例外で止める。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "Copyright (C) 2018 Square, Inc."
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/internal/ByteString.kt
lines: [350, 374]
function: "String.decodeHexIgnoreWhitespace"
difficulty: 3
tags: [文字列処理, 防御的プログラミング, ビット演算]
format: 2
---

## ひとことで

`decodeHexIgnoreWhitespace()` は、`4a 6f 6b` のように **空白や改行を挟んだ 16 進数の文字列** を、バイト（1 つの数字の組）の列に変換する関数です。空白は読み飛ばし、残った数字を 2 桁ずつ組にします。

Okio（入出力を扱うライブラリ）で、人が読みやすい形で書かれた 16 進数の文字列を、バイト列に戻すために使われています。

## コード

```kotlin:line-numbers=350
internal fun String.decodeHexIgnoreWhitespace(): ByteString {
  var i = 0
  var r = 0
  val result = ByteArray(length / 2)

  byte@while (i < length) {
    val d1 = decodeHexDigitIgnoreWhitespace(this[i++])
    if (d1 == -1) continue

    while (i < length) {
      val d2 = decodeHexDigitIgnoreWhitespace(this[i++])
      if (d2 == -1) continue

      result[r++] = ((d1 shl 4) + d2).toByte()
      continue@byte
    }

    throw IllegalArgumentException("Expected an even number of hex digits but was: ${r * 2 + 1}")
  }

  return when {
    r < result.size -> result.toByteString(0, r)
    else -> ByteString(result)
  }
}
```

## 前提知識

- **16 進数**: 0〜9 と a〜f（または A〜F）の 16 種類の数字で表す形です。1 桁で 0〜15 を表し、2 桁で 1 バイト（0〜255）を表します。
- **ラベル付きループ**: `byte@while` のように、ループに名前を付ける書き方です。`continue@byte` と書くと、その名前のループの次の回に進みます。
- **`continue` と `continue@byte`**: `continue` は、一番近いループの次の回に進みます。ラベルを付けると、入れ子の外側のループを指定できます。
- **`shl`**: ビットを左にずらす演算です。`d1 shl 4` は、16 倍する操作と同じ意味です。
- **`ByteString`**: バイト列を表す型です。`toByteString(0, r)` で、一部分だけを切り出して作れます。

## 何をしているか

### 1. 外側のループで 1 桁目を読む

```kotlin:line-numbers=355
  byte@while (i < length) {
```

ラベル `byte` の付いた外側のループです。1 つのバイトを作るたびに、ここに戻ってきます。

```kotlin:line-numbers=356
    val d1 = decodeHexDigitIgnoreWhitespace(this[i++])
```

文字を 1 つ読み、数字に変換します。空白なら `-1` が返ります。

```kotlin:line-numbers=357
    if (d1 == -1) continue
```

空白だった場合は、外側のループの次の回に進みます。空白はバイトの一部にならないので、そのまま読み飛ばします。

### 2. 内側のループで 2 桁目を読む

```kotlin:line-numbers=360
      val d2 = decodeHexDigitIgnoreWhitespace(this[i++])
```

1 桁目の次に、空白でない数字を探します。

```kotlin:line-numbers=363
      result[r++] = ((d1 shl 4) + d2).toByte()
```

1 桁目を上の 4 ビットに、2 桁目を下の 4 ビットにして、1 バイトにします。

```kotlin:line-numbers=364
      continue@byte
```

1 バイトができたので、ラベル付きの `continue` で外側のループの次の回へ直接進みます。内側のループを抜けるための `break` を、ここでは書いていません。

### 3. 途中で文字列が終わったら例外

```kotlin:line-numbers=367
    throw IllegalArgumentException("Expected an even number of hex digits but was: ${r * 2 + 1}")
```

内側のループを抜けたということは、数字が 1 つ余ったまま文字列が終わったということです。桁数が奇数なので、例外で止めます。

## ここがすごい

- **ラベルで直接飛ぶ**: 二重のループの中で、「1 バイトできたら外側へ」という動きを `continue@byte` の 1 語で表しています。フラグ変数を使うよりも、流れが明確です。
- **空白を検査の途中で飛ばす**: 1 桁目でも 2 桁目でも、空白は `-1` として扱い、`continue` で読み飛ばします。空白の扱いが、1 か所の関数に集まっています。
- **余分な領域を切り詰める**: 配列は `length / 2` で確保しますが、空白が多ければ使う数は少なくなります。最後に `r < result.size` を確かめて、必要な分だけを `ByteString` にします。
- **エラーメッセージに桁数を入れる**: `r * 2 + 1` で、読んだ数字の総数を出しています。どこまで読めたかが、利用者にすぐ分かります。

## まとめ

- `decodeHexIgnoreWhitespace` は、空白を読み飛ばしながら、16 進数を 2 桁ずつバイトに変える。
- ラベル付きの `continue` で、二重ループの中から外側の次の回へ直接進む。
- 桁数が奇数で終わったら例外にし、余った配列は切り詰めて返す。
