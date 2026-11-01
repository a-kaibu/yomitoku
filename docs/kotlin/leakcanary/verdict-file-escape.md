---
title: "改行を 1 行に収めて読み戻す escaped と unescaped"
description: "人の入力を、タブ区切りのファイル 1 行に収めるため、改行やタブなどを \\n のような書き方に変える。読み戻すときは 1 回の走査で元に戻し、途中の書き方を誤読しないようにする。"
language: kotlin
project: "LeakCanary"
repo: https://github.com/square/leakcanary
license: Apache-2.0
copyright: "Copyright 2015 Square, Inc."
commit: "eb60b0be53732aa016c79b7774b497770ad1e4f3"
file: shark/shark-dive/shark-dive-core/src/main/java/shark/dive/VerdictFile.kt
lines: [126, 156]
function: "String.escaped / String.unescaped"
difficulty: 3
tags: [入出力, 文字列処理, 防御的プログラミング]
format: 2
---

## ひとことで

LeakCanary（Android のメモリリーク検出ライブラリ）は、解析の判定結果を **タブ区切りのファイル** に書き出します。1 件の理由は、1 行に収まっていなければなりません。しかし、人が書いた理由には、改行やタブが入ることがあります。

`escaped` は、その文字を **`\n`、`\r`、`\t` などの書き方に変えて** 1 行にします。`unescaped` は、読み戻すときに、その書き方を元の文字に戻します。

## コード


::: code-group

```kotlin:line-numbers=126 [日本語訳]
private fun String.escaped(): String = replace("\\", "\\\\")
  .replace("\n", "\\n")
  .replace("\r", "\\r")
  .replace("\t", "\\t")

/**
 * 逆に戻す。ペアを 1 つずつ戻すと、`\\n`（エスケープされたバックスラッシュと `n`）を改行と読んでしまうので、
 * 1 回の走査で行う。
 */
private fun String.unescaped(): String {
  val unescaped = StringBuilder(length)
  var index = 0
  while (index < length) {
    val character = this[index]
    if (character != '\\' || index == lastIndex) {
      unescaped.append(character)
      index++
      continue
    }
    when (val escaped = this[index + 1]) {
      'n' -> unescaped.append('\n')
      'r' -> unescaped.append('\r')
      't' -> unescaped.append('\t')
      '\\' -> unescaped.append('\\')
      // このアプリが書かないエスケープなので、人が入力したバックスラッシュと、その後に続く文字として扱う
      else -> unescaped.append('\\').append(escaped)
    }
    index += 2
  }
  return unescaped.toString()
}
```

```kotlin:line-numbers=126 [原文]
private fun String.escaped(): String = replace("\\", "\\\\")
  .replace("\n", "\\n")
  .replace("\r", "\\r")
  .replace("\t", "\\t")

/**
 * And back, in one pass, because the pairs undone one at a time would read `\\n` — an escaped backslash
 * followed by an `n` — as a newline.
 */
private fun String.unescaped(): String {
  val unescaped = StringBuilder(length)
  var index = 0
  while (index < length) {
    val character = this[index]
    if (character != '\\' || index == lastIndex) {
      unescaped.append(character)
      index++
      continue
    }
    when (val escaped = this[index + 1]) {
      'n' -> unescaped.append('\n')
      'r' -> unescaped.append('\r')
      't' -> unescaped.append('\t')
      '\\' -> unescaped.append('\\')
      // Not an escape this app writes, so it is a backslash someone typed and whatever they typed after it.
      else -> unescaped.append('\\').append(escaped)
    }
    index += 2
  }
  return unescaped.toString()
}
```

:::

## 前提知識

- **タブ区切りのファイル**: 1 行が 1 件のデータで、項目をタブ文字で区切る形式です。改行が入ると、行が途中で切れてしまいます。
- **エスケープ**: 特別な意味を持つ文字を、別の書き方で表すことです。ここでは、バックスラッシュ（`\`）の後ろに文字を続けて、改行などを表します。
- **`StringBuilder`**: 文字列を少しずつ組み立てる入れ物です。
- **`when (val x = ...)`**: 値を変数に入れながら、その値で分岐する書き方です。
- **`lastIndex`**: 文字列の最後の位置です。

## 何をしているか

### 1. 書き出すとき: バックスラッシュを先に変える

```kotlin:line-numbers=127
  .replace("\n", "\\n")
```

改行を `\n` という 2 文字にします。順番に `replace` をつなぐので、最初にバックスラッシュ自身を `\\` に変えています。そうしないと、後で付けた `\` まで二重に変わってしまいます。

### 2. 読み戻すとき: 1 文字ずつ見る

```kotlin:line-numbers=140
    if (character != '\\' || index == lastIndex) {
```

バックスラッシュでなければ、そのまま書きます。最後の文字がバックスラッシュなら、続く文字がないので、そのまま書きます。

```kotlin:line-numbers=145
    when (val escaped = this[index + 1]) {
```

バックスラッシュなら、その次の文字を見て、対応する元の文字に戻します。戻したら、2 文字分進みます。

### 3. 知らない書き方は、そのまま残す

```kotlin:line-numbers=151
      else -> unescaped.append('\\').append(escaped)
```

このアプリが書かない書き方は、バックスラッシュと文字の両方を、そのまま残します。人が入力した文字を壊さないためです。

## ここがすごい

- **1 回の走査で読み戻す**: `\\n` を、1 つずつ置き換える方法で戻すと、`\\` が `\` になった後に `\n` と見なされ、改行になってしまいます。1 文字ずつ読めば、その誤読は起きません。
- **順番の工夫**: 書き出すときは、バックスラッシュを最初に変えます。こうすることで、後から付けた書き方が二重に変わることがありません。
- **知らない書き方を壊さない**: 対応していない書き方でも、捨てずに残します。読み戻しは、書き出しの逆で、情報を失いません。
- **同じ規則を 2 か所に**: 書く関数と読む関数で、同じ 4 種類の書き方を使います。この対応がずれると、データが壊れます。

## まとめ

- 改行を含む文字列を 1 行のファイルに入れるには、改行を `\n` などの書き方に変える。
- 書き出しではバックスラッシュを最初に変え、読み戻しでは 1 回の走査で元に戻す。
- 知らない書き方は捨てず、そのまま残すと、人が入力した内容を失わない。
