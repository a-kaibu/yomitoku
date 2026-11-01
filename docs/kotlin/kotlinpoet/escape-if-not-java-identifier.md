---
title: "Java の識別子として使えない名前だけを囲む"
description: "名前の先頭や中の文字が、Java の識別子の規則に合わないときだけ、バッククォートで囲む KotlinPoet の関数。すでに囲まれた名前は二重に囲まない。"
language: kotlin
project: "KotlinPoet"
repo: https://github.com/square/kotlinpoet
license: Apache-2.0
copyright: "\"Copyright (C) 2015 Square, Inc.\""
commit: "537e8fac8fdecff22aad801a33557aa0d46b5730"
file: kotlinpoet/src/commonMain/kotlin/com/squareup/kotlinpoet/Util.kt
lines: [361, 370]
function: "String.escapeIfNotJavaIdentifier"
difficulty: 1
tags: [コンパイラ, 文字列処理]
format: 2
---

## ひとことで

Kotlin は、Java と同じ規則で名前の文字を決めています。名前は、英字や `_` などで始まり、続く文字は数字も使えます。しかし、ハイフン（`-`）や空白は使えません。

`escapeIfNotJavaIdentifier` は、名前がその規則に合わないときだけ、バッククォートで囲みます。たとえば `my-name` は `` `my-name` `` になり、`name` はそのままです。

## コード

```kotlin:line-numbers=361
private fun String.escapeIfNotJavaIdentifier(): String {
  return if (
    (!first().isJavaIdentifierStart() || drop(1).any { !it.isJavaIdentifierPart() }) &&
      !alreadyEscaped()
  ) {
    "`$this`"
  } else {
    this
  }
}
```

## 前提知識

- **Java の識別子**: 変数や関数の名前として使える文字の規則です。先頭は英字、`_`、`$` などで、続く文字には数字も使えます。
- **`isJavaIdentifierStart` と `isJavaIdentifierPart`**: 1 文字がその規則の「先頭に使える」「途中に使える」かを調べる関数です。ここでは、プラットフォームごとに用意された関数を使います。
- **`first()` と `drop(1)`**: 最初の 1 文字と、2 文字目以降を取り出す関数です。
- **`any`**: 条件に当てはまるものが 1 つでもあれば真になる関数です。
- **`alreadyEscaped()`**: 名前がすでに囲まれているかを調べる、同じファイルの関数です。

## 何をしているか

### 1. 先頭か途中に、使えない文字があるかを確かめる

```kotlin:line-numbers=363
    (!first().isJavaIdentifierStart() || drop(1).any { !it.isJavaIdentifierPart() }) &&
```

先頭の 1 文字が識別子の先頭に使えない、または 2 文字目以降に識別子の途中に使えない文字があれば、囲む候補になります。

### 2. まだ囲まれていなければ囲む

```kotlin:line-numbers=364
      !alreadyEscaped()
```

すでに囲まれている名前を、もう一度囲まないようにします。囲んでいないものだけを対象にします。

```kotlin:line-numbers=366
    "`$this`"
```

条件に当てはまれば、名前の前後にバッククォートを付けて返します。

## ここがすごい

- **囲むかどうかを 1 つの条件で決める**: 「使えない文字がある」と「まだ囲んでいない」を `&&` でつないで、囲むかどうかを 1 回の判定にしています。
- **二重に囲まない**: `alreadyEscaped()` を先に確かめるので、チェーンの途中で何度呼ばれても、バッククォートが増えません。
- **文字の規則は 1 か所に**: 名前の規則の判定を、この関数と 2 つの期待された関数に集めています。プラットフォームごとの差は、それらの `expect` 関数で吸収します。
- **`any` で途中の文字を調べる**: 先頭だけでなく、途中の文字も 1 つずつ確かめます。短く書けて、読むと条件がはっきりします。

## まとめ

- 名前が識別子の規則に合わないときだけ、バッククォートで囲む。
- 囲んでいるかを先に確かめると、同じ名前を何度処理しても壊れない。
- 文字の判定はプラットフォーム依存なので、`expect` 関数に任せる。
