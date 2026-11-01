---
title: "@Json で付けた名前がなければ、宣言された名前を使う"
description: "JSON のキー名を決める jsonName。@Json アノテーションが付いていればその名前を、なければクラスの中の宣言名を使う。null 許容の拡張関数で書かれている。"
language: kotlin
project: "Moshi"
repo: https://github.com/square/moshi
license: Apache-2.0
copyright: "Copyright (C) 2014 Square, Inc."
commit: "889013ec2edb8d8034902662a1dc8c4f3b3f8111"
file: moshi/src/main/java/com/squareup/moshi/internal/Util.kt
lines: [89, 93]
function: "Json?.jsonName"
difficulty: 1
tags: [型システム, イディオム, 防御的プログラミング]
format: 2
---

## ひとことで

`jsonName` は、JSON のキーに使う名前を決める関数です。クラスのプロパティに `@Json(name = "user_name")` のように名前が付いていれば、その名前を使い、付いていなければ、プロパティ本来の名前をそのまま使います。

Moshi は、Kotlin や Java のクラスを JSON に変換するライブラリです。プロパティ名と JSON のキー名を一致させる必要はないので、この関数で「どちらの名前を使うか」を 1 か所にまとめています。

## コード

```kotlin:line-numbers=89
internal fun Json?.jsonName(declaredName: String): String {
  if (this == null) return declaredName
  val annotationName: String = name
  return if (Json.UNSET_NAME == annotationName) declaredName else annotationName
}
```

## 前提知識

- **アノテーション**: `@Json` のように、クラスやプロパティに付けるメタデータです。プログラムの動きに、追加の情報を伝えるために使います。
- **`Json?` の拡張関数**: 「`Json` 型の値、または `null`」に対して呼べる関数です。`this` が `null` になることがあり、その場合の扱いを関数の中で決めています。
- **`this == null`**: 拡張関数の中で、`this` が `null` かどうかを調べます。`null` の場合はすぐに戻る書き方です。
- **`Json.UNSET_NAME`**: 名前が指定されていないことを表す、Moshi が用意している特別な値です。アノテーションを付けたけれど、名前を書かなかった場合に使われます。
- **`if` 式**: `if` は値を返す式です。`return if (...) A else B` の形で、条件によって違う値を返せます。

## 何をしているか

### 1. アノテーションがなければ、宣言された名前を使う

```kotlin:line-numbers=90
  if (this == null) return declaredName
```

`@Json` が付いていなければ、`this` は `null` です。その場合は、クラスの中で宣言された名前（`declaredName`）をそのまま JSON のキー名にします。

### 2. 名前が書かれていなければ、宣言された名前を使う

```kotlin:line-numbers=91
  val annotationName: String = name
```

`@Json` が付いていても、名前を書いていなければ、`name` は特別な値 `UNSET_NAME` になっています。このときも、宣言された名前を使います。

### 3. 名前が書かれていれば、その名前を使う

```kotlin:line-numbers=92
  return if (Json.UNSET_NAME == annotationName) declaredName else annotationName
```

名前が書かれていれば、その名前を JSON のキー名にします。この 1 行で、「書かれていない」と「書かれている」の 2 つの場合を切り替えています。

## ここがすごい

- **`null` を正常な入力として受け取る**: `Json?` の拡張関数にしたので、呼び出し側はアノテーションがあるかどうかを確かめずに、そのまま呼べます。「付いていない」場合の扱いが、関数の中の 1 行に集まっています。
- **既定の値をアノテーションに頼らない**: 名前を書かなかった場合を、特別な値 `UNSET_NAME` で表しています。`null` と「空の文字列」のどちらでもなく、「名前が未指定」という意味を明確に区別できます。
- **役割が 1 つの関数に集まる**: JSON のキー名を決める規則を、この関数だけに持たせています。規則を変えるときも、変える場所は 1 つで済みます。
- **短くて読みやすい**: 関数全体が数行で、どの場合にどの名前になるかが、上から順に読めばそのまま分かります。

## まとめ

- 拡張関数の受け取り側を `null` 許容にすると、「付いていない」場合の処理を呼び出し側に書かなくてよい。
- 名前が未指定かどうかは、特別な値で表すと、空文字との違いが明確になる。
- JSON の名前を決める規則は 1 か所にまとめておくと、変更の影響が分かりやすい。
