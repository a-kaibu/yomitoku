---
title: "英小文字だけを素早く大文字にする、その注意点"
description: "1 文字を大文字にする toUpperCasePreservingASCII。a から z は 32 を引いて直すが、ASCII 以外の文字は大文字ではなく小文字の変換を使っている点に注意。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2021 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-utils/common/src/io/ktor/util/Text.kt
lines: [103, 107]
function: "toUpperCasePreservingASCII"
difficulty: 2
tags: [文字列処理, 最適化, 防御的プログラミング]
format: 2
---

## ひとことで

`toUpperCasePreservingASCII` は、1 文字を **大文字に変換する** 関数です。英小文字（`a` から `z`）は、32 を引いて大文字にします。ASCII のほかの文字はそのまま返します。

同じファイルにある `toLowerCasePreservingASCII` と対になる関数です。ただし、ASCII の外の文字の扱いに、名前からは予想しにくい点があります。この記事では、その点も見ていきます。

## コード

```kotlin:line-numbers=103
private fun toUpperCasePreservingASCII(ch: Char): Char = when (ch) {
    in 'a'..'z' -> ch - 32
    in '\u0000'..'\u007f' -> ch
    else -> ch.lowercaseChar()
}
```

## 前提知識

- **ASCII と英小文字**: `a` は 97、`z` は 122 です。`A` は 65、`Z` は 90 です。
- **`Char` から `Int` を引く**: `ch - 32` は、`Char` を 32 だけずらした `Char` を返します。小文字から大文字へは、この差を引きます。
- **`lowercaseChar()` と `uppercaseChar()`**: 標準ライブラリで、文字を小文字、または大文字にする関数です。
- **`when` の範囲指定**: `in 'a'..'z'` のように、文字が範囲に入るかで分岐します。

## 何をしているか

### 1. 英小文字は 32 を引く

```kotlin:line-numbers=104
    in 'a'..'z' -> ch - 32
```

`a` から `z` の範囲なら、32 を引いて大文字にします。

### 2. ASCII の残りの文字はそのまま

```kotlin:line-numbers=105
    in '\u0000'..'\u007f' -> ch
```

英字以外の ASCII の文字は、大文字にしても変わらないので、そのまま返します。

### 3. ASCII 以外は、小文字の変換

```kotlin:line-numbers=106
    else -> ch.lowercaseChar()
```

ASCII の外の文字は、`lowercaseChar()` で変換されます。大文字にする `uppercaseChar()` ではありません。そのため、ASCII の外の大文字は、この関数を通すと小文字になります。

## ここがすごい

- **英字の変換を速く、確実にする**: 大文字への変換の多くは英字です。足し引き 1 回で済み、結果も環境に左右されません。
- **対になる関数と形を揃える**: 小文字版と同じ 3 段階の `when` になっているので、一方を読めば、もう一方も同じ形で読めます。
- **ASCII の範囲の境界を明示する**: 変換しない範囲を `\u0000` から `\u007f` と書いて、ASCII の範囲を一目で分かるようにしています。

### 注意点: ASCII の外の大文字が小文字になる

この関数の名前は「大文字に変換する」ですが、ASCII の外の文字には `lowercaseChar()` が使われています。たとえば、ASCII の外にある大文字を渡すと、小文字が返ります。この関数が使われている場所（予約語の判定など）では、ASCII の外の文字がほとんど現れないため、問題になりにくい作りです。ただし、名前と動きが食い違う点は、読むときに覚えておく価値があります。

## まとめ

- 英字だけを足し引きで変換すると、速く、環境に左右されない結果になる。
- 対になる関数は、同じ形に揃えると読み比べやすい。
- 関数の名前と実際の動きが違う場合は、範囲外の文字の扱いを必ず確かめる。
