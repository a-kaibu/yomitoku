---
title: "大文字と小文字を区別しない文字列キーを、速く比べる"
description: "大文字と小文字を区別しない比較のための CaseInsensitiveString。小文字にした文字から作るハッシュ値を事前に計算し、比べるときはハッシュと内容の両方を使う。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2021 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-utils/common/src/io/ktor/util/Text.kt
lines: [109, 129]
function: "String.caseInsensitive, CaseInsensitiveString"
difficulty: 3
tags: [ハッシュ, 文字列処理, データ構造]
format: 2
---

## ひとことで

`CaseInsensitiveString` は、**大文字と小文字を区別せずに比べられる文字列** を表すクラスです。`"Content-Type"` と `"content-type"` は、このクラスの中では同じものとして扱われます。

Ktor は、HTTP のヘッダー名のように、大文字と小文字を区別しないキーを、`Map` などのコレクションで扱います。このクラスは、そのキーを入れたとき、比べるときの速さと正しさを両立させるために作られています。

## コード

```kotlin:line-numbers=109
internal fun String.caseInsensitive(): CaseInsensitiveString = CaseInsensitiveString(this)

internal class CaseInsensitiveString(val content: String) {
    private val hash: Int

    init {
        var temp = 0
        for (element in content) {
            temp = temp * 31 + element.lowercaseChar().code
        }

        hash = temp
    }

    override fun equals(other: Any?): Boolean =
        (other as? CaseInsensitiveString)?.content?.equals(content, ignoreCase = true) == true

    override fun hashCode(): Int = hash

    override fun toString(): String = content
}
```

## 前提知識

- **ハッシュ値**: 値から作られる整数の指紋です。`Map` や `Set` は、まずハッシュ値で候補を絞り、それから中身を比べます。
- **`hashCode()` と `equals()`**: `Map` で使うための 2 つの約束事です。「等しいものは、ハッシュ値も等しい」が必要です。
- **`lowercaseChar()` と `code`**: 文字を小文字にして、その文字コードの整数を取り出します。
- **`equals(other, ignoreCase = true)`**: 大文字と小文字を無視して、文字列を比べる標準の方法です。
- **`private val` と `init`**: `init` のブロックは、クラスの作成時に 1 回だけ実行されます。ここでハッシュ値を計算して、`hash` に入れています。
- **`as?`**: 安全なキャストで、型が違えば `null` になります。

## 何をしているか

### 1. 文字列を作る関数

```kotlin:line-numbers=109
internal fun String.caseInsensitive(): CaseInsensitiveString = CaseInsensitiveString(this)
```

文字列から、大文字と小文字を区別しないキーを作る拡張関数です。

### 2. 小文字のハッシュ値を作る

```kotlin:line-numbers=115
    var temp = 0
    for (element in content) {
        temp = temp * 31 + element.lowercaseChar().code
    }
```

作成時に、文字列の各文字を小文字にしてから、31 を掛けて足していきます。大文字と小文字の違いは、ハッシュ値に影響しません。その結果を `hash` に保存します。

### 3. 比較は、大文字と小文字を無視して行う

```kotlin:line-numbers=123
    override fun equals(other: Any?): Boolean =
        (other as? CaseInsensitiveString)?.content?.equals(content, ignoreCase = true) == true
```

相手が同じ種類のキーなら、中身を大文字と小文字を無視して比べます。相手が違う型なら、`null` になり `false` になります。

### 4. ハッシュ値を返す

```kotlin:line-numbers=126
    override fun hashCode(): Int = hash
```

作成時に計算しておいた値を返すだけなので、何度呼んでも軽く済みます。

## ここがすごい

- **ハッシュ値を作るときに、大文字と小文字を揃える**: 比べたときに等しい文字列は、必ず同じハッシュ値になります。これが守られていないと、`Map` でキーが見つからなくなってしまいます。
- **ハッシュ値は一度だけ計算する**: `hash` を作成時に決めておくので、`Map` で何度使っても、計算をやり直しません。
- **比べるときは内容も確かめる**: ハッシュ値が同じでも、中身が違うことはあります。そのため、`equals` では中身を比べて、正しさを保っています。
- **比較の規則を標準に任せる**: 大文字と小文字の無視は、標準の `equals(ignoreCase = true)` に任せています。ハッシュ値だけは自分で小文字を作るので、規則がずれないよう注意が必要です。

## まとめ

- 大文字と小文字を区別しないキーは、ハッシュ値の計算でも小文字に揃える必要がある。
- ハッシュ値は作成時に一度だけ計算すると、`Map` での使用が軽くなる。
- 等しさの判定は、ハッシュ値だけでなく中身も比べると、誤りを防げる。
