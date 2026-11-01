---
title: "URL のパス部分を / で連結する joinPath"
description: "URL のパスの各部分を / でつなげる joinPath。部分が 1 つで空なら、ルートを表す \"/\" を返す。空のリストは空の文字列にする。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2026 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-http/common/src/io/ktor/http/URLBuilder.kt
lines: [327, 335]
function: "List<String>.joinPath"
difficulty: 2
tags: [ネットワーク, 文字列処理, 防御的プログラミング]
format: 2
---

## ひとことで

`joinPath()` は、URL のパスを作るために、部分の列を **`/` でつなげる** 関数です。たとえば `["api", "users"]` は `api/users` になります。ただし、部分が 1 つだけでそれが空なら、URL のルートを表す `/` だけを返します。

Ktor（Kotlin 製の Web サーバーとクライアントのフレームワーク）の URL を組み立てる部分で使われています。

## コード

```kotlin:line-numbers=327
private fun List<String>.joinPath(): String {
    if (isEmpty()) return ""
    if (size == 1) {
        if (first().isEmpty()) return "/"
        return first()
    }

    return joinToString("/")
}
```

## 前提知識

- **URL のパス**: `https://example.com/api/users` の `/api/users` の部分です。`/` で区切られた部分の列として扱えます。
- **ルートのパス**: `https://example.com` のように、パスが何もないときは `/` と同じ意味になります。
- **`joinToString("/")`**: 列の要素の間に `/` を入れて、1 つの文字列にする関数です。
- **`first()`**: 列の先頭の要素を返す関数です。
- **早めの `return`**: 特別な場合を先に処理して、その場で関数を終える書き方です。

## 何をしているか

### 1. 空のリストは空の文字列

```kotlin:line-numbers=328
    if (isEmpty()) return ""
```

部分が 1 つもなければ、パスも空です。

### 2. 1 つだけのときは特別扱い

```kotlin:line-numbers=329
    if (size == 1) {
```

部分が 1 つだけのときは、つなげる必要がありません。その部分をそのまま使うか、特別な場合を処理します。

```kotlin:line-numbers=330
        if (first().isEmpty()) return "/"
```

その 1 つが空文字なら、パスはルートの `/` になります。URL の最後の `/` を表すための処理です。

```kotlin:line-numbers=331
        return first()
```

空でなければ、その部分をそのまま返します。

### 3. 2 つ以上なら / でつなげる

```kotlin:line-numbers=334
    return joinToString("/")
```

部分が 2 つ以上あれば、間に `/` を入れてつなげます。

## ここがすごい

- **特別な場合を先に片付ける**: 空、1 つ、2 つ以上、と場合を分けて、最後の一般的な場合は 1 行で済ませています。
- **ルートの扱いが明確**: 「何もない」と「空の部分 1 つ」を区別して、後者はルートの `/` にしています。URL として意味のある結果になります。
- **先頭の `/` は付けない**: 結果には先頭の `/` が含まれません。パスの組み立てを行う側が、必要に応じて `/` を付ける前提の設計です。
- **例外を投げない**: 空のリストや空の部分でも、必ず文字列を返します。URL を組み立てる途中で止まらない作りです。

## まとめ

- `joinPath` は、パスの部分を `/` でつなげ、部分がなければ空、空の部分 1 つならルートの `/` を返す。
- 特別な場合を先に返し、一般的な場合を 1 行で書いている。
- 結果の先頭に `/` は付かず、組み立ての側で必要に応じて補う。
