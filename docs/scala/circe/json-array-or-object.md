---
title: "JSON の種類ごとに、一つの関数で場合分けする"
description: "circe の Json.arrayOrObject。配列とオブジェクトだけ専用の関数で処理し、それ以外（null、真偽値、数値、文字列）は、まとめて or の値を返す。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/Json.scala"
lines: [66, 77]
format: 2
function: "Json.arrayOrObject"
difficulty: 2
tags: [型システム, API設計, 関数型]
---

## ひとことで

circe の `Json` は、JSON の値を表す型です。`arrayOrObject` は、値が配列かオブジェクトなら、それぞれ専用の関数で処理します。それ以外（`null`、真偽値、数値、文字列）なら、まとめて `or` の値を返します。JSON の種類を、三つに分けて扱うための入り口です。

## コード

```scala:line-numbers=66
  final def arrayOrObject[X](
    or: => X,
    jsonArray: Vector[Json] => X,
    jsonObject: JsonObject => X
  ): X = this match {
    case JNull       => or
    case JBoolean(_) => or
    case JNumber(_)  => or
    case JString(_)  => or
    case JArray(a)   => jsonArray(a)
    case JObject(o)  => jsonObject(o)
  }
```

## 前提知識

- JSON の値は、`null`、真偽値、数値、文字列、配列、オブジェクトのどれかです。
- `JArray(a)` は配列、`JObject(o)` はオブジェクトを表す、`Json` の具体的な形です。`JNull` や `JString` などは、それ以外の型を表します。
- `X` は型パラメータで、返す値の型を呼び出し側が決めます。
- `or: => X` は名前渡しの引数です。使われるまで評価されないので、使わない種類のときは計算もされません。
- `this match { ... }` は、自分自身の種類によって処理を分ける書き方です。

## 何をしているか

### 1. `null` や値の種類は、すべて `or` を返す

真偽値、数値、文字列、`null` は、中身を見る必要がありません。どれも `or` という一つの値を返します。

```scala:line-numbers=71
    case JNull       => or
    case JBoolean(_) => or
    case JNumber(_)  => or
    case JString(_)  => or
```

### 2. 配列とオブジェクトは、それぞれの関数に中身を渡す

配列なら、中の `Vector[Json]` を `jsonArray` に渡します。オブジェクトなら、`JsonObject` を `jsonObject` に渡します。

```scala:line-numbers=75
    case JArray(a)   => jsonArray(a)
    case JObject(o)  => jsonObject(o)
```

## ここがすごい

- 呼び出し側は、三つの関数（`or`、`jsonArray`、`jsonObject`）を渡すだけで、すべての JSON の種類を扱えます。型の分岐を一箇所に集めています。
- `or` は名前渡しなので、配列やオブジェクトのときは、この値の計算が行われません。
- 戻り値の型 `X` は一つに統一されるので、どの種類の結果も同じ型で受け取れます。
- 種類を網羅する `match` になっているので、新しい種類が増えたら、コンパイラが分岐の書き忘れを教えてくれます。

## まとめ

- `arrayOrObject` は、配列とオブジェクトだけを専用の関数で処理し、それ以外は `or` にまとめます。
- 三つの関数を渡すと、結果は必ず同じ型 `X` になります。
- 名前渡しの `or` のおかげで、使われない計算は行われません。
