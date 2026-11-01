---
title: "空白でない最初の文字の位置を探す"
description: "文字列の指定した範囲で、ASCII の空白（タブ、改行、改ページ、復帰、空白）ではない最初の文字の位置を返す indexOfFirstNonAsciiWhitespace。すべて空白なら範囲の終わりを返す。"
language: kotlin
project: "OkHttp"
repo: https://github.com/square/okhttp
license: Apache-2.0
copyright: "Copyright (C) 2021 Square, Inc."
commit: "16fb6aef3aee1c4645fc8d24af01f8a4dc128ebf"
file: okhttp/src/commonJvmAndroid/kotlin/okhttp3/internal/-UtilCommon.kt
lines: [107, 118]
function: "String.indexOfFirstNonAsciiWhitespace"
difficulty: 1
tags: [文字列処理, パース, イディオム]
format: 2
---

## ひとことで

`indexOfFirstNonAsciiWhitespace()` は、文字列の指定した範囲の中で、**ASCII の空白ではない最初の文字の位置** を返す関数です。前の空白をすべて飛ばして、最初の「中身」がどこから始まるかを教えてくれます。

OkHttp（HTTP クライアントのライブラリ）の中で、URL を解析するときや、文字列の前後の空白を取り除く `trimSubstring` の中で使われています。

## コード

```kotlin:line-numbers=107
internal fun String.indexOfFirstNonAsciiWhitespace(
  startIndex: Int = 0,
  endIndex: Int = length,
): Int {
  for (i in startIndex until endIndex) {
    when (this[i]) {
      '\t', '\n', '\u000C', '\r', ' ' -> Unit
      else -> return i
    }
  }
  return endIndex
}
```

## 前提知識

- **ASCII の空白**: 半角の空白、タブ、改行（`\n`）、復帰（`\r`）、改ページ（`\u000C`）の 5 種類です。
- **範囲の指定**: `startIndex` から `endIndex` の手前までを、探す範囲にします。既定では、文字列の最初から最後までです。
- **`for (i in startIndex until endIndex)`**: 範囲の中の位置を、順に取り出す繰り返しです。
- **`when` と `Unit`**: `Unit` は「何もしない」を表す値です。空白の枝では何もせず、次の文字へ進みます。
- **`return`**: 関数の結果を返し、そこで処理を終えます。

## 何をしているか

### 1. 空白の文字を読み飛ばす

```kotlin:line-numbers=112
    when (this[i]) {
      '\t', '\n', '\u000C', '\r', ' ' -> Unit
```

空白に当たる 5 種類の文字は、`Unit` を返して何もしません。`for` のループは、そのまま次の位置へ進みます。

### 2. 空白でない文字が出たら、その位置を返す

```kotlin:line-numbers=114
      else -> return i
```

空白以外の文字が現れたら、その位置 `i` を返して、関数を終えます。

### 3. すべて空白なら、範囲の終わり

```kotlin:line-numbers=117
  return endIndex
```

ループが最後まで終わったら、範囲のすべてが空白だったということです。範囲の終わりを返します。「見つからなかった」ことを、範囲の外の位置で表しています。

## ここがすごい

- **空白だけを読み飛ばす**: 条件を `when` の枝にまとめているので、どの文字が空白扱いかが、1 か所で読めます。
- **`Unit` の使い方**: 何もしない枝に `Unit` を置くことで、空白の場合は「次へ進む」、そうでなければ「返す」が、同じ形で並びます。
- **範囲の終わりを不在の印にする**: 見つからないときに `-1` ではなく範囲の終わりを返すので、呼び出し側は「ここから先は空白だけ」と読めます。
- **指定範囲に限定**: 文字列全体を調べず、指定された範囲だけを見るので、部分的な文字列の処理にそのまま使えます。

## まとめ

- `indexOfFirstNonAsciiWhitespace` は、範囲の中で ASCII の空白ではない最初の文字の位置を返す。
- 空白の枝では `Unit` を返して次へ進み、それ以外の文字で `return` する。
- すべて空白なら、範囲の終わりを返して「空白だけ」であることを表す。
