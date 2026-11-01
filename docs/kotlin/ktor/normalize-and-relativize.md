---
title: "余計な .. を消して先頭のフォルダをそろえる normalizeAndRelativize"
description: "パスの中の . と .. を整理し、先頭に残る .. を取り除いて相対パスにそろえる normalizeAndRelativize。基準の外に出る部分を、見かけだけでも消すための前処理。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2021 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-utils/jvm/src/io/ktor/util/NioPath.kt
lines: [36, 43]
function: "Path.normalizeAndRelativize"
difficulty: 3
tags: [ファイル, セキュリティ, 防御的プログラミング]
format: 2
---

## ひとことで

`normalizeAndRelativize()` は、パスの中の `.`（今のフォルダ）と `..`（ひとつ上のフォルダ）を整理して、**先頭に残った `..` を取り除いた相対パス** を返す関数です。

`combineSafe` の前処理として使われています。パスを整理してから判定するので、判定の対象がそろいます。

## コード

```kotlin:line-numbers=36
public fun Path.normalizeAndRelativize(): Path =
    root?.relativize(this)?.normalize()?.dropLeadingTopDirs() ?: normalize().dropLeadingTopDirs()

private fun Path.dropLeadingTopDirs(): Path {
    val startIndex = indexOfFirst { it.toString() != ".." }
    if (startIndex <= 0) return this
    return subpath(startIndex, nameCount)
}
```

## 前提知識

- **`Path`**: ファイルの場所を表す型です。ファイルの中身ではなく、道順の文字列としての位置を扱います。
- **`root`**: パスの一番上（ルート）の部分です。絶対パスなら `/` などがここに入ります。相対パスならルートはありません。
- **`relativize`**: ある場所から見た相対的な道順を作るメソッドです。
- **`normalize`**: `.` や `..` を取り除いて、パスを簡単にするメソッドです。
- **`?.` と `?:`**: `?.` は左側が `null` なら何もせず `null` を返します。`?:` は左側が `null` のときに右側を使います。

## 何をしているか

### 1. ルートがあれば相対化してから整理する

```kotlin:line-numbers=37
    root?.relativize(this)?.normalize()?.dropLeadingTopDirs() ?: normalize().dropLeadingTopDirs()
```

ルートがあるパスなら、まずルートからの相対パスにしてから `normalize` で整理します。ルートがなければ、そのまま整理します。どちらの場合も、最後に `dropLeadingTopDirs` で先頭の `..` を取り除きます。

### 2. 先頭の `..` を探す

```kotlin:line-numbers=40
    val startIndex = indexOfFirst { it.toString() != ".." }
```

`..` 以外の最初の要素の位置を探します。

### 3. 先頭の `..` を捨てる

```kotlin:line-numbers=41
    if (startIndex <= 0) return this
    return subpath(startIndex, nameCount)
```

先頭に `..` がなければ、そのまま返します。あれば、`..` 以外の要素から後ろを切り出して返します。

## ここがすごい

- **整理と切り取りを分けている**: `normalize` で見た目を整え、`dropLeadingTopDirs` で先頭だけを切ります。役割が 2 段に分かれているので、どちらも単純です。
- **ルートの有無を分けて扱う**: 絶対パスと相対パスで、相対化の手順を変えています。どちらの入力にも同じ結果の形でそろえられます。
- **`startIndex <= 0` で早く返す**: 先頭に `..` がない、つまり切る必要がない場合は、新しいパスを作らずに元のパスを返します。
- **安全の一歩目にすぎない**: ドキュメントにある通り、この関数は「冗長な `.` と `..`」を取り除くためのものです。外に出る入力を拒否するのは、次の `combineSafe` の役目です。役割を分けて読むと理解しやすくなります。

## まとめ

- `normalizeAndRelativize` は、`.` と `..` を整理し、先頭に残る `..` を取り除く。
- ルートの有無で手順を変え、どちらの入力も相対パスの形にそろえる。
- 安全な連結の前処理として使われ、拒否の判定は `combineSafe` が行う。
