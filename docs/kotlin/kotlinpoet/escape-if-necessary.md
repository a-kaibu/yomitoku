---
title: "名前を Kotlin の識別子として使えるように整える"
description: "生成するコードで使う名前が、そのまま識別子として使えるかを順に確かめ、必要なときだけバッククォートで囲む KotlinPoet の関数。最後に、失敗していないかを検査する。"
language: kotlin
project: "KotlinPoet"
repo: https://github.com/square/kotlinpoet
license: Apache-2.0
copyright: "\"Copyright (C) 2015 Square, Inc.\""
commit: "537e8fac8fdecff22aad801a33557aa0d46b5730"
file: kotlinpoet/src/commonMain/kotlin/com/squareup/kotlinpoet/Util.kt
lines: [300, 305]
function: "String.escapeIfNecessary"
difficulty: 2
tags: [コンパイラ, 文字列処理, 防御的プログラミング]
format: 2
---

## ひとことで

KotlinPoet は、Kotlin のコードを **プログラムから生成する** ライブラリです。生成するクラス名や関数名に、キーワードや空白など、そのままでは識別子として使えない文字が入ることがあります。

`escapeIfNecessary` は、名前が **そのままで使えるか** を確かめ、必要なときだけバッククォート（`` ` ``）で囲みます。たとえば `class` は `` `class` `` に、`my name` は `` `my name` `` になります。

## コード

```kotlin:line-numbers=300
internal fun String.escapeIfNecessary(validate: Boolean = true): String =
  escapeIfNotJavaIdentifier()
    .escapeIfKeyword()
    .escapeIfHasAllowedCharacters()
    .escapeIfAllCharactersAreUnderscore()
    .apply { if (validate) failIfEscapeInvalid() }
```

## 前提知識

- **バッククォート**: Kotlin で、キーワードや空白を含む名前を、そのまま識別子として書くための囲みです。
- **キーワード**: `class`、`fun`、`val` のように、言語が決まった意味で使う単語です。
- **拡張関数**: `String.escapeIfNecessary` のように、既存の型に新しい関数を足す仕組みです。
- **`apply`**: 対象のオブジェクトを `this` にして、ブロックを実行し、そのオブジェクト自身を返す関数です。
- **`validate`**: `true` のとき、最後に、名前が正しく書けなかったときの検査を行うかを表す引数です。

## 何をしているか

### 1. 識別子として始められるかを確かめる

```kotlin:line-numbers=301
  escapeIfNotJavaIdentifier()
```

名前の先頭や中身に、Java の識別子として使えない文字があるかを見て、あればバッククォートで囲みます。

### 2. キーワードかどうかを確かめる

```kotlin:line-numbers=302
    .escapeIfKeyword()
```

名前がキーワードと同じなら、囲みます。`class` を変数名に使いたい場合が、これに当たります。

### 3. 許されていない文字と、すべてがアンダースコアかを確かめる

```kotlin:line-numbers=303
    .escapeIfHasAllowedCharacters()
    .escapeIfAllCharactersAreUnderscore()
```

Kotlin で許されない文字を含むときや、名前が `_` だけのときに、囲みます。

### 4. 最後に検査する

```kotlin:line-numbers=305
    .apply { if (validate) failIfEscapeInvalid() }
```

`validate` が真なら、囲んだ結果が正しいかを検査します。失敗していれば、例外で知らせます。

## ここがすごい

- **検査を順に積み重ねる**: 1 つの関数が 1 つの条件だけを担当します。条件を足したり外したりしやすく、読んだときに何を調べているか分かります。
- **同じ形の関数が並ぶ**: 各段階は「値を受け取って、必要なら囲んで返す」という同じ型なので、チェーン（`.` で続けて書くこと）でつなげられます。
- **囲み直しを防ぐ**: 途中の関数は、すでに囲まれた名前を二重に囲まないよう確かめています。だから、どの順で呼んでも、結果が壊れません。
- **最後の検査で失敗を見つける**: 生成したコードが壊れたまま出力されないよう、最後に確かめます。問題があれば、コードを作る段階で気づけます。

## まとめ

- 生成する名前は、必要なときだけバッククォートで囲む。
- 検査を小さな関数に分けて、チェーンでつなぐと読みやすい。
- 最後に、生成結果が正しいかを確かめると、壊れたコードを出さずに済む。
