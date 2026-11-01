---
title: "英字だけを素早く小文字にし、それ以外は標準の変換に任せる"
description: "1 文字を小文字にする toLowerCasePreservingASCII。A から Z は足し算で直接変え、ASCII のほかの文字はそのまま、それ以外だけ標準の変換を使う。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2021 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-utils/common/src/io/ktor/util/Text.kt
lines: [97, 101]
function: "toLowerCasePreservingASCII"
difficulty: 2
tags: [文字列処理, 最適化, 可読性]
format: 2
---

## ひとことで

`toLowerCasePreservingASCII` は、1 文字を **小文字に変換する** 関数です。ただし、変換の仕方を 3 つに分けています。英大文字（`A` から `Z`）は決まった数を足して直し、それ以外の ASCII の文字は触らず、ASCII の範囲の外の文字だけ標準の変換に任せます。

Ktor は、HTTP のヘッダー名やドメイン名など、大文字と小文字を区別しない文字列を毎回扱います。その中でも、ほとんどが英字なので、英字だけは速く、確実に変換できるようにしています。

## コード

```kotlin:line-numbers=97
private fun toLowerCasePreservingASCII(ch: Char): Char = when (ch) {
    in 'A'..'Z' -> ch + 32
    in '\u0000'..'\u007f' -> ch
    else -> ch.lowercaseChar()
}
```

## 前提知識

- **ASCII**: 英数字や記号など、128 種類の基本的な文字の規格です。`\u0000` から `\u007f` の範囲にあたります。
- **文字コードの差**: 英大文字と英小文字は、文字コードで 32 ずつ離れています。たとえば `A` は 65、`a` は 97 です。そのため、32 を足すと小文字になります。
- **`Char` と `Int` の計算**: Kotlin では、`Char` に `Int` を足すと、その分だけずれた `Char` になります。`ch + 32` がこれにあたります。
- **`lowercaseChar()`**: 標準ライブラリの、文字を小文字にする関数です。言語ごとの細かい規則も扱えます。
- **`when (ch) { in 範囲 -> ... }`**: 文字が範囲に入るかで分岐する書き方です。上から順に調べられます。

## 何をしているか

### 1. 英大文字は 32 を足す

```kotlin:line-numbers=98
    in 'A'..'Z' -> ch + 32
```

`A` から `Z` の範囲にある文字なら、32 を足すだけで小文字になります。標準の変換を呼ぶよりも、ずっと少ない計算で済みます。

### 2. ASCII の残りの文字はそのまま

```kotlin:line-numbers=99
    in '\u0000'..'\u007f' -> ch
```

英字以外の ASCII の文字（数字、記号、小文字など）は、小文字にしても変わらないので、そのまま返します。

### 3. ASCII 以外は標準の変換

```kotlin:line-numbers=100
    else -> ch.lowercaseChar()
```

それ以外の文字（ギリシャ文字やキリル文字など）は、標準の `lowercaseChar()` に任せます。ASCII の外には、英字と違う規則の文字が多いからです。

## ここがすごい

- **よくある場合を先に速く処理する**: 変換の対象の多くは英字です。その場合は、標準の変換を呼ばずに、足し算 1 回で済みます。
- **ASCII の範囲を明確に分ける**: 「ASCII の中は決まった規則」「ASCII の外は標準の規則」と線を引いています。どの文字がどちらに入るのかが、`when` の範囲で読み取れます。
- **結果が環境によらない**: ASCII の英字だけは、言語の設定に左右されない固定の規則で変わります。HTTP の名前のように、どの環境でも同じ結果が必要な場面に向いています。
- **1 文字ずつの関数**: 文字列全体の変換は、この関数を 1 文字ずつ呼んで組み立てます。関数が小さいので、規則が追いやすくなっています。

## まとめ

- 変換の対象がほとんど英字なら、英字だけを速い方法で処理し、残りを標準の変換に任せると効率がよい。
- ASCII の範囲を明確に分けると、結果が環境によって変わらない部分と、標準の規則に従う部分を分けられる。
- 文字コードの差を使った変換は、短く速く書けるが、範囲の境界を正しく指定することが大切である。
