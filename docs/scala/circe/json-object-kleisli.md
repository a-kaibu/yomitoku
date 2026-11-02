---
title: "キーから値を探す関数を、Kleisli の箱に入れて返す"
description: "circe の JsonObject.kleisli。キーを受け取り Option[Json] を返す関数を、Kleisli[Option, String, Json] の箱にする。ほかの処理と合成しやすくなる。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/JsonObject.scala"
lines: [95, 95]
format: 2
function: "JsonObject.kleisli"
difficulty: 1
tags: [関数型, 型システム, API設計]
---

## ひとことで

circe の `JsonObject` は、JSON のオブジェクトを表す型です。`kleisli` は、キーを受け取って値を探す操作を、`Kleisli` という箱に入れて返します。この箱にすると、他の `Kleisli` の処理と、順番につなげやすくなります。

## コード

```scala:line-numbers=95
  final def kleisli: Kleisli[Option, String, Json] = Kleisli(apply(_))
```

## 前提知識

- `Kleisli[F, A, B]` は、`A` を受け取って `F[B]` を返す関数を包んだ箱です。cats のデータ型の一つです。
- `Option` は、値があるかないかを表す型です。ここでは、キーに対応する値がないかもしれないので、`Option[Json]` で返します。
- `apply(key)` は、キーに対応する値を `Option[Json]` で取り出すメソッドです。
- `Kleisli(apply(_))` の `_` は、受け取ったキーを指す省略形です。`key => apply(key)` と同じ意味です。
- 関数を箱に入れると、`andThen` や `compose` などでつなげられるようになります。

## 何をしているか

### 1. キーから値を探す関数を、`Kleisli` の箱に入れる

`apply` をキーを受け取る関数として使い、`Kleisli` に包みます。箱の中身は、`String => Option[Json]` の関数です。

```scala:line-numbers=95
  final def kleisli: Kleisli[Option, String, Json] = Kleisli(apply(_))
```

## ここがすごい

- 「キーを受け取って値を返す」という関数の形を、型の箱で表しています。ほかの `Kleisli` と同じ部品として使えます。
- 値が見つからない場合を `Option` で表すので、キーがないときの処理を、型が強制します。
- メソッド一つで、既存の `apply` を別の形に変えられます。新しい処理を書かずに、組み合わせの部品にできます。
- 例えば、キーの一覧を取り出す処理と、この箱をつなげると、「キーを順番にたどって値を取る」流れが組み立てられます。

## まとめ

- `kleisli` は、`apply` をキーから値への関数として `Kleisli` に包みます。
- 戻り値の型は `Kleisli[Option, String, Json]` で、値がないことを `Option` で表します。
- 関数を箱にするので、他の `Kleisli` と組み合わせやすくなります。
