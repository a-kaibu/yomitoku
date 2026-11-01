---
title: "空白を飛ばした先が、区切りか文字列の終わりかを確かめる"
description: "ヘッダーの値を読むとき、位置から先の空白を飛ばし、次が区切りの記号か文字列の終わりかを調べる nextIsDelimiterOrEnd。"
language: kotlin
project: "Ktor"
repo: https://github.com/ktorio/ktor
license: Apache-2.0
copyright: "Copyright 2014-2021 JetBrains s.r.o and contributors. Use of this source code is governed by the Apache 2.0 license."
commit: "b7809b1eb47ec68cbb9c78a52a23880caca710cd"
file: ktor-http/common/src/io/ktor/http/HttpHeaderValueParser.kt
lines: [235, 242]
function: "String.nextIsDelimiterOrEnd"
difficulty: 2
tags: [パース, 文字列処理, 防御的プログラミング]
format: 2
---

## ひとことで

`nextIsDelimiterOrEnd` は、HTTP のヘッダーの値を 1 文字ずつ読んでいる途中で、**空白を飛ばした先が「区切りの記号」か「文字列の終わり」かを調べる** 関数です。区切りの記号は、`;`（セミコロン）と `,`（カンマ）です。

Ktor は、`Content-Type: text/html; charset=utf-8` のようなヘッダーを、区切りの記号で分けて読みます。引用符で囲まれた値の終わりが、本当に値の終わりかを確かめるときに、この関数を使っています。

## コード

```kotlin:line-numbers=235
private fun String.nextIsDelimiterOrEnd(start: Int): Boolean {
    var position = start + 1
    loop@ while (position < length && get(position) == ' ') {
        position += 1
    }

    return position == length || get(position) == ';' || get(position) == ','
}
```

## 前提知識

- **ヘッダーの区切り**: HTTP のヘッダーでは、`;` が「パラメーターの区切り」、`,` が「値の区切り」として使われます。
- **`String.get(位置)`**: 文字列の指定した位置の文字を取り出します。`this[位置]` と同じ意味です。
- **`while` と条件**: 条件が成り立つあいだ、同じ処理をくり返す書き方です。
- **ラベル（`loop@`）**: くり返しに名前を付けて、後から `break@loop` などで指定できるようにする書き方です。この関数では、名前を使う場所がありません。
- **文字列の終わり**: `position == length` は、位置が文字列の長さに達したことを表します。

## 何をしているか

### 1. 位置を 1 つ進める

```kotlin:line-numbers=236
    var position = start + 1
```

引数 `start` の 1 つ後ろから調べ始めます。`start` の文字そのものは、呼び出し側が確かめ済みです。

### 2. 空白を飛ばす

```kotlin:line-numbers=237
    loop@ while (position < length && get(position) == ' ') {
        position += 1
    }
```

文字列の終わりに達していなければ、今の位置の文字が空白かを確かめます。空白なら、位置を 1 つ進めます。空白が続くあいだ、くり返します。

### 3. 区切りか終わりかを判定する

```kotlin:line-numbers=241
    return position == length || get(position) == ';' || get(position) == ','
```

位置が文字列の終わりに達しているか、今の位置の文字が `;` か `,` なら、`true` を返します。どれでもなければ、`false` です。

## ここがすごい

- **空白を気にせず判定できる**: 区切りの前に空白が何個あっても、正しく判定できます。ヘッダーは人が書くことがあり、空白の量はまちまちなので、この処理が必要です。
- **終わりを先に確かめる**: `position < length` を先に書いているので、位置が文字列の外に出ることがありません。`get` を呼ぶ前に、範囲を確かめる順番になっています。
- **判定が 1 行にまとまる**: 「終わりか」「セミコロンか」「カンマか」の 3 つが、1 つの式で書かれています。読めば、どれが区切りとみなされるかがすぐ分かります。
- **ラベルは未使用**: `loop@` のラベルは、この中では `break` や `continue` で参照されていません。読むときには、書き残しの名残だと理解すれば十分です。

## まとめ

- 区切りの判定の前に、空白を飛ばす処理を入れると、人が書いたヘッダーにも対応できる。
- 範囲の確認を、文字を取り出す前に行うと、境界の外に出る事故を防げる。
- 判定の条件は、読み手がすぐ分かるように 1 つの式にまとめると、仕様の確認が楽になる。
