---
title: "JSON の中の null を、奥まで全部取り除く"
description: "circe の Json.deepDropNullValues。JSON の値を畳み込む Folder を作り、オブジェクトと配列の中の null を、入れ子の奥まで取り除く。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/Json.scala"
lines: [213, 230]
format: 2
function: "Json.deepDropNullValues"
difficulty: 2
tags: [再帰, データ構造, 関数型]
---

## ひとことで

circe は、JSON を Scala の値として扱うライブラリです。`deepDropNullValues` は、JSON の中にある `null` を、オブジェクトと配列の奥まで取り除きます。`dropNullValues` と違い、入れ子の中まで一度に掃除します。

## コード

```scala:line-numbers=213
  def deepDropNullValues: Json = {
    val folder = new Json.Folder[Json] {
      def onNull: Json = Json.Null
      def onBoolean(value: Boolean): Json = Json.fromBoolean(value)
      def onNumber(value: JsonNumber): Json = Json.fromJsonNumber(value)
      def onString(value: String): Json = Json.fromString(value)
      def onArray(value: Vector[Json]): Json =
        Json.fromValues(value.collect {
          case v if !v.isNull => v.foldWith(this)
        })
      def onObject(value: JsonObject): Json =
        Json.fromJsonObject(
          value.filter { case (_, v) => !v.isNull }.mapValues(_.foldWith(this))
        )
    }

    this.foldWith(folder)
  }
```

## 前提知識

- JSON の値には、`null`、真偽値、数値、文字列、配列、オブジェクトがあります。オブジェクトは「キーと値の組」の集まりです。
- `Json` は、それらの値を表す型です。`isNull` で `null` かどうかを調べられます。
- `Json.Folder[X]` は、JSON の種類ごとに処理を書くための部品です。`onNull` や `onArray` など、種類ごとのメソッドを持ちます。
- `foldWith` は、JSON の値に `Folder` を当てて、結果の型 `X` を作る操作です。入れ子の値にも、同じ `Folder` を再帰的に当てられます。
- `this` は、いま呼び出している JSON の値そのものを指します。

## 何をしているか

### 1. 種類ごとに、新しい JSON を作る Folder を用意する

`Folder[Json]` は、JSON を読み込んで、同じ種類の新しい `Json` を返す部品です。`null` 以外の値は、そのまま作り直します。

```scala:line-numbers=214
    val folder = new Json.Folder[Json] {
      def onNull: Json = Json.Null
      def onBoolean(value: Boolean): Json = Json.fromBoolean(value)
      def onNumber(value: JsonNumber): Json = Json.fromJsonNumber(value)
      def onString(value: String): Json = Json.fromString(value)
```

### 2. 配列とオブジェクトでは、`null` を除いてから奥まで進む

配列では、`null` の要素を `collect` で捨てた上で、残った要素に同じ `Folder` を当てます。オブジェクトでも同じです。キーの値が `null` なら除き、残った値に `Folder` を当てます。

```scala:line-numbers=219
      def onArray(value: Vector[Json]): Json =
        Json.fromValues(value.collect {
          case v if !v.isNull => v.foldWith(this)
        })
      def onObject(value: JsonObject): Json =
        Json.fromJsonObject(
          value.filter { case (_, v) => !v.isNull }.mapValues(_.foldWith(this))
        )
```

### 3. ルートの値に Folder を当てて終わる

最後に、呼び出された値 `this` に `Folder` を当てます。この 1 回の呼び出しで、入れ子の全体が処理されます。

```scala:line-numbers=229
    this.foldWith(folder)
```

## ここがすごい

- 「どの種類の JSON か」ごとの処理を `Folder` に 1 箇所にまとめています。入れ子の深さを気にせず、同じ `Folder` が自分自身を当てて奥へ進みます。
- 配列とオブジェクトのどちらでも、`null` を除く条件（`!v.isNull`）が同じ形で書かれています。
- `dropNullValues` は 1 段目しか処理しません。`deepDropNullValues` は入れ子の奥まで同じ規則で処理するので、判断の基準が一貫します。
- `Folder` を使うと、JSON の種類を `match` で場合分けしなくても、種類に応じた処理を割り当てられます。

## まとめ

- `deepDropNullValues` は、JSON の入れ子の中の `null` を、オブジェクトと配列の奥まで取り除きます。
- 種類ごとの処理は `Folder` にまとめ、`foldWith` で再帰的に適用します。
- 1 段だけ掃除したいときは `dropNullValues`、奥まで掃除したいときは `deepDropNullValues` を使います。
