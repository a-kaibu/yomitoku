---
title: "先頭の一文字だけを大文字か小文字にする capitalize"
description: "文字列の先頭の 1 文字だけを大文字（タイトルケース）か小文字に変える capitalize と decapitalize。中身の残りは変えず、すでに正しい文字には何もしない。"
language: kotlin
project: "SQLDelight"
repo: https://github.com/cashapp/sqldelight
license: Apache-2.0
copyright: "Copyright (C) 2016 Square, Inc."
commit: "6f07e30501cdf465a3e7a6fa3de4c68871d00965"
file: sqldelight-compiler/src/main/kotlin/app/cash/sqldelight/core/StringUtil.kt
lines: [3, 5]
function: "String.capitalize / String.decapitalize"
difficulty: 1
tags: [文字列処理, イディオム, 標準ライブラリ]
format: 2
---

## ひとことで

`capitalize()` と `decapitalize()` は、文字列の **先頭の 1 文字だけ** を大文字（タイトルケース）か小文字に変える関数です。残りの文字は変えません。

SQLDelight（SQL からコードを作るツール）の中で、名前の先頭の文字を整えるために使われる小さな関数です。

## コード

```kotlin:line-numbers=3
fun String.capitalize() = replaceFirstChar { if (it.isLowerCase()) it.titlecaseChar() else it }

fun String.decapitalize() = replaceFirstChar { if (it.isLowerCase()) it else it.lowercaseChar() }
```

## 前提知識

- **`replaceFirstChar`**: 文字列の先頭の 1 文字だけを、関数で変換する標準ライブラリの関数です。文字列が空なら何もしません。
- **`isLowerCase()`**: 文字が小文字かどうかを調べる関数です。
- **`titlecaseChar()`**: 文字をタイトルケース（先頭語向けの大文字）に変える関数です。多くの文字では大文字と同じになります。
- **`lowercaseChar()`**: 文字を小文字に変える関数です。
- **式本体の関数**: `=` の後ろに、戻り値を 1 行で書く形です。

## 何をしているか

### 先頭の文字を大文字にする

```kotlin:line-numbers=3
fun String.capitalize() = replaceFirstChar { if (it.isLowerCase()) it.titlecaseChar() else it }
```

先頭の文字が小文字のときだけ、タイトルケースに変えます。すでに大文字や記号なら、そのまま残します。「小文字のときだけ変える」という条件があるので、すでに正しい文字には何もしません。

### 先頭の文字を小文字にする

```kotlin:line-numbers=5
fun String.decapitalize() = replaceFirstChar { if (it.isLowerCase()) it else it.lowercaseChar() }
```

`capitalize` の反対です。先頭が小文字ならそのまま、そうでなければ小文字に変えます。条件の向きが逆になっていることに注目すると、対応がよく見えます。

## ここがすごい

- **変換を 1 か所に任せる**: 文字列の先頭だけを扱う処理を `replaceFirstChar` に任せているので、空の文字列でも例外になりません。
- **変換が必要なときだけ変える**: 条件で分けているので、すでに正しい文字は変わりません。同じ関数を何度適用しても、結果が変わらない形になっています。
- **対称な 2 つの関数**: `capitalize` と `decapitalize` は、条件の向きが逆なだけです。片方を読めば、もう片方もすぐ分かります。
- **短く、目的が明確**: 1 行で「先頭だけを整える」という意図が伝わります。ライブラリのコード生成で何度も呼ばれても、読み手が迷いません。

## まとめ

- `capitalize` は、先頭が小文字のときだけタイトルケースにし、残りは変えない。
- `decapitalize` は、先頭が小文字でなければ小文字に変える。
- `replaceFirstChar` に任せることで、空の文字列でも安全に扱える。
