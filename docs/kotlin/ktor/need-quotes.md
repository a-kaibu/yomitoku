---
title: "ヘッダーの値を引用符で囲む必要があるかを調べる"
description: "HTTP のヘッダーに入れる値が、引用符で囲まれるべきかを判定する needQuotes。空の値、区切り記号を含む値は囲む必要があり、すでに囲まれている値は囲まない。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2026 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-http/common/src/io/ktor/http/HeaderValueWithParameters.kt
lines: [104, 113]
function: "String.needQuotes"
difficulty: 2
tags: [ネットワーク, 文字列処理, 防御的プログラミング]
format: 2
---

## ひとことで

`needQuotes()` は、HTTP のヘッダーに書く値を、**二重引用符（"）で囲む必要があるか** を調べる関数です。空の値や、区切り記号を含む値は囲む必要があります。すでに囲まれている値は、もう囲みません。

Ktor の中で、ヘッダーのパラメータの値を書くときに、`escapeIfNeeded` の判断として使われています。

## コード

```kotlin:line-numbers=104
private fun String.needQuotes(): Boolean {
    if (isEmpty()) return true
    if (isQuoted()) return false

    for (element in this) {
        if (element in HeaderFieldValueSeparators) return true
    }

    return false
}
```

## 前提知識

- **HTTP ヘッダー**: リクエストやレスポンスに付く「名前: 値」の形の情報です。値の中に区切り記号があると、ヘッダー全体の解釈が変わることがあります。
- **引用符で囲む**: 値の全体を `"` で囲むと、中の区切り記号を、ただの文字として扱えます。
- **`isQuoted()`**: 値がすでに引用符で囲まれていて、中の引用符も正しく書かれているかを判定する関数です。
- **`HeaderFieldValueSeparators`**: ヘッダーの値の中で、囲みが必要になる記号の集まりです。
- **`for (element in this)`**: 文字列の文字を、先頭から 1 文字ずつ取り出すループです。

## 何をしているか

### 1. 空の値は囲む

```kotlin:line-numbers=105
    if (isEmpty()) return true
```

空の値は、そのままでは値として読み取れないので、囲む必要があります。

### 2. すでに囲まれていれば不要

```kotlin:line-numbers=106
    if (isQuoted()) return false
```

すでに正しく囲まれていれば、二重に囲まないように、`false` を返します。

### 3. 区切り記号があれば囲む

```kotlin:line-numbers=108
    for (element in this) {
        if (element in HeaderFieldValueSeparators) return true
    }
```

文字を 1 つずつ調べ、区切り記号が 1 つでもあれば、囲む必要があると判断して `true` を返します。

```kotlin:line-numbers=112
    return false
```

どれにも当てはまらなければ、囲まずに済みます。

## ここがすごい

- **判定の順番が大切**: 空の値を先に扱い、次に「すでに囲まれているか」を確かめてから、中身を調べます。無駄な走査を避けつつ、正しい結論に着きます。
- **区切り記号は 1 文字ずつ**: 文字の集合と照合するだけなので、値が長くても、判定は素直です。
- **囲みの要否だけを判定**: この関数は、囲むかどうかを答えるだけで、実際に囲む処理は `quote()` が行います。役割が分かれています。
- **早く返す形**: 条件に当てはまった時点で `return` するので、流れがそのまま読めます。

## まとめ

- `needQuotes` は、ヘッダーの値に引用符が必要かを判定する。
- 空の値は必要、すでに囲まれていれば不要、区切り記号があれば必要、と順番に確かめる。
- 実際に囲む処理は別の関数に任せ、この関数は判定だけを行う。
