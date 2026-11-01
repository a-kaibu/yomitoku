---
title: "同じ定義を二重に登録したときの例外を、入口と本体に分けて投げる"
description: "同じ型の定義を二重に登録したとき、DefinitionOverrideException を投げる overrideError と throwOverrideError。inline 関数から呼べるように、入口と本体を分けている。"
language: kotlin
project: "Koin"
repo: https://github.com/InsertKoinIO/koin
license: Apache-2.0
copyright: "Copyright 2017-Present the original author or authors."
commit: "d486a5e8748f90db43f939e227083f2bd2c47c12"
file: projects/core/koin-core/src/commonMain/kotlin/org/koin/core/module/Module.kt
lines: [198, 211]
function: "overrideError, throwOverrideError"
difficulty: 3
tags: [防御的プログラミング, エラー処理, 型システム]
format: 2
---

## ひとことで

`overrideError` と `throwOverrideError` は、Koin の中で **同じ定義（インスタンスの作り方）を二重に登録したとき** に、`DefinitionOverrideException` を投げるための関数です。

Koin では、モジュールに定義を並べて、それを使ってオブジェクトを取り出します。同じ型の定義を二重に登録すると、どちらを使うべきかが決まらないので、ここで例外にして知らせます。

## コード

```kotlin:line-numbers=198
internal fun overrideError(
    factory: InstanceFactory<*>,
    mapping: IndexKey,
) {
    throwOverrideError(factory, mapping)
}

@PublishedApi
internal fun throwOverrideError(
    factory: InstanceFactory<*>,
    mapping: IndexKey,
) {
    throw DefinitionOverrideException("Already existing definition for ${factory.beanDefinition} at $mapping")
}
```

## 前提知識

- **`inline` 関数と `@PublishedApi`**: `inline` 関数は、呼び出し先に中身が展開されます。その中から呼べる関数は、外から見える必要があり、そのための印が `@PublishedApi` です。
- **`InstanceFactory`**: Koin で、オブジェクトを作る方法をまとめた型です。定義（`beanDefinition`）を持っています。
- **`IndexKey`**: 定義を探すための鍵（キー）です。型や名前の組み合わせで決まります。
- **例外（Exception）**: 処理を途中で止めて、問題を知らせる仕組みです。`throw` で投げます。
- **`internal`**: 同じモジュールの中からだけ使える可視性の指定です。

## 何をしているか

### 1. 入口の関数

```kotlin:line-numbers=198
internal fun overrideError(
    factory: InstanceFactory<*>,
    mapping: IndexKey,
) {
    throwOverrideError(factory, mapping)
}
```

`overrideError` は、`inline` 関数の中から呼ばれる入口です。中身は、本体の `throwOverrideError` に処理を渡すだけです。

### 2. 本体の関数

```kotlin:line-numbers=206
internal fun throwOverrideError(
    factory: InstanceFactory<*>,
    mapping: IndexKey,
) {
    throw DefinitionOverrideException("Already existing definition for ${factory.beanDefinition} at $mapping")
}
```

`throwOverrideError` が、実際に `DefinitionOverrideException` を投げます。メッセージには、すでにある定義と、登録しようとした場所が入ります。

## ここがすごい

- **入口と本体を分けて、公開する範囲を狭める**: `inline` 関数は外から見える必要がありますが、例外を投げる処理の中身は外に見せる必要がありません。入口だけを `@PublishedApi` で公開し、本体は `internal` のままにしています。
- **メッセージに原因が入る**: 「どの定義が」「どこで」重複したかが、メッセージに入るので、設定の誤りをすぐ直せます。
- **例外の型で意味を表す**: 専用の `DefinitionOverrideException` を投げるので、呼び出し側は、この種類の問題だけを区別して扱えます。
- **二重登録を黙って受け入れない**: 上書きの動作を暗黙に行わず、必ず例外にすることで、設定の意図しない変更を防いでいます。

## まとめ

- `inline` 関数から呼ぶ処理は、入口だけを公開し、本体は隠すと、公開する範囲を最小にできる。
- 同じ定義の二重登録は、メッセージに場所を含めた専用の例外で知らせると、直しやすい。
- 黙って上書きしない設計は、設定の誤りを早く見つける助けになる。
