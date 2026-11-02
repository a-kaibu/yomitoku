---
title: "None は JSON の null に、Some は中身の JSON にする"
description: "circe の Encoder.encodeOption。Option の値を JSON に変える。None は null、Some(v) は中身 v を、型 A の Encoder で変換した結果にする。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/Encoder.scala"
lines: [360, 365]
format: 2
function: "Encoder.encodeOption"
difficulty: 1
tags: [API設計, 型システム, 関数型]
---

## ひとことで

circe の `Encoder` は、Scala の値を JSON に変える仕組みです。`encodeOption` は、`Option[A]` の値を JSON に変えます。値がないとき（`None`）は JSON の `null` になり、値があるとき（`Some(v)`）は、中の値 `v` を JSON に変えた結果になります。

## コード

```scala:line-numbers=360
  implicit final def encodeOption[A](implicit e: Encoder[A]): Encoder[Option[A]] = new Encoder[Option[A]] {
    final def apply(a: Option[A]): Json = a match {
      case Some(v) => e(v)
      case None    => Json.Null
    }
  }
```

## 前提知識

- `Option[A]` は、値がある `Some(v)` か、値がない `None` のどちらかを持つ型です。
- `Json.Null` は、JSON の `null` を表す値です。
- `Encoder[A]` は、`A` の値を `Json` に変える関数の箱です。`e(v)` と書くと、その変換が行われます。
- `implicit` は、暗黙の引数として自動的に渡される約束です。`Encoder[A]` が、型ごとに自動で選ばれます。
- `new Encoder[Option[A]] { ... }` は、`Option[A]` 用の `Encoder` をその場で作る書き方です。

## 何をしているか

### 1. `Some(v)` のときは、中身を `Encoder` で変換する

`Some(v)` のときは、中の値 `v` を、型 `A` の `Encoder` である `e` で `Json` に変えます。

```scala:line-numbers=362
      case Some(v) => e(v)
```

### 2. `None` のときは、JSON の `null` にする

`None` のときは、`Json.Null` を返します。値がないことを、JSON の `null` で表します。

```scala:line-numbers=363
      case None    => Json.Null
```

## ここがすごい

- 値がない場合を、`null` という JSON の形で素直に表せます。JSON の仕様と、Scala の `Option` が一対一で対応します。
- `Encoder[A]` を暗黙に受け取るので、中身の型が何であっても、同じ仕組みで変換できます。
- 戻り値の型は `Encoder[Option[A]]` で、`Option` 用の変換器として型の上で保証されます。
- 変換の分岐は、`Some` と `None` の二つだけです。読み手は、二つの場合を見れば全体がわかります。

## まとめ

- `encodeOption` は、`Option[A]` を JSON に変えます。
- `None` は `null`、`Some(v)` は `v` を変換した JSON になります。
- 中身の変換は、型 `A` の `Encoder` に任されています。
