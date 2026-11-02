---
title: "一組だけの JSON オブジェクトを、最初から Map と Vector で作る"
description: "circe の JsonObject.singleton。キーと値が一組だけのオブジェクトを、MapAndVectorJsonObject の Map と並び順の Vector の両方に入れて作る。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/JsonObject.scala"
lines: [309, 309]
format: 2
function: "JsonObject.singleton"
difficulty: 1
tags: [データ構造, API設計, 関数型]
---

## ひとことで

circe の `JsonObject` は、JSON のオブジェクトを表す型です。`singleton` は、キーと値の組が一つだけのオブジェクトを作ります。内部では、前に見た `MapAndVectorJsonObject` を使い、`Map` と `Vector` の両方に、そのキーを入れます。

## コード

```scala:line-numbers=309
  final def singleton(key: String, value: Json): JsonObject = new MapAndVectorJsonObject(Map((key, value)), Vector(key))
```

## 前提知識

- `JsonObject` は、キーと値の組の集まりです。`singleton` は、その集まりが一つだけの場合を作ります。
- `Map((key, value))` は、一つの組だけを持つ `Map` を作ります。
- `Vector(key)` は、キーを一つだけ持つ並び順の列です。
- `MapAndVectorJsonObject` は、値を `Map`、キーの並びを `Vector` に分けて持つ内部の実装です。

## 何をしているか

### 1. 一組だけの `Map` と、そのキーだけの `Vector` を作る

値は `Map` に入れ、並び順は `Vector` に一つだけ入れます。この二つを `MapAndVectorJsonObject` に渡して、オブジェクトを作ります。

```scala:line-numbers=309
  final def singleton(key: String, value: Json): JsonObject = new MapAndVectorJsonObject(Map((key, value)), Vector(key))
```

## ここがすごい

- 一組だけのときも、他の大きさと同じ内部の形にそろえています。後の `add` や `remove` を、同じ仕組みで扱えます。
- 作り方を一箇所にまとめているので、`Map` と `Vector` が食い違うことがありません。
- `singleton` という名前で、一組だけという意図が伝わります。
- 大きさが一つのときの特別な型を用意せず、同じ実装で済ませる、という簡潔な設計です。

## まとめ

- `singleton` は、キーと値の組を一つだけ持つオブジェクトを作ります。
- 値は `Map`、並び順は `Vector` に入れ、`MapAndVectorJsonObject` として作ります。
- 大きさに関係なく、同じ内部の形で扱えるようにしています。
