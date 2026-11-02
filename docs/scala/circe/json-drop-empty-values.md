---
title: "中身のない配列とオブジェクトのキーだけを取り除く"
description: "circe の Json.dropEmptyValues。オブジェクトの各キーのうち、値が空の配列や空のオブジェクトのものを取り除く。null や数値などはそのまま残す。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/Json.scala"
lines: [237, 241]
format: 2
function: "Json.dropEmptyValues"
difficulty: 1
tags: [データ構造, API設計, イテレータ]
---

## ひとことで

circe の `Json` は、JSON の値を表す型です。`dropEmptyValues` は、オブジェクトの中で、値が空の配列や空のオブジェクトになっているキーを取り除きます。`null` や数値、文字列などは、空ではないとみなして残します。

## コード

```scala:line-numbers=237
  def dropEmptyValues: Json = this.mapObject(_.filter {
    case (_, JArray(vec))  => vec.nonEmpty
    case (_, JObject(obj)) => obj.nonEmpty
    case _                 => true
  })
```

## 前提知識

- JSON のオブジェクトは、キーと値の組の集まりです。`{"tags": [], "name": "x"}` では、`tags` の値が空の配列です。
- `JArray(vec)` は配列、`JObject(obj)` はオブジェクトを表す、`Json` の具体的な形です。
- `nonEmpty` は、中身が一つ以上あるかを調べるメソッドです。
- `mapObject` は、オブジェクトの中身だけを変換して、新しい `Json` を作る操作です。
- `filter` の中の `case` は、キーと値の組に対して、残すかどうかを決める条件です。

## 何をしているか

### 1. 値が空の配列や空のオブジェクトなら、そのキーを取り除く

配列の場合は、要素が一つ以上あるとき（`vec.nonEmpty`）だけ残します。オブジェクトの場合も、同じように中身があるときだけ残します。

```scala:line-numbers=238
    case (_, JArray(vec))  => vec.nonEmpty
    case (_, JObject(obj)) => obj.nonEmpty
```

### 2. それ以外の値は、すべて残す

`null`、数値、文字列などは、空ではない値として扱い、`true` で残します。

```scala:line-numbers=240
    case _                 => true
```

### 3. オブジェクトに対して、全体を一度に処理する

`this.mapObject` で、この条件をオブジェクトのすべてのキーに当てます。オブジェクト以外の `Json` では、何も変わりません。

```scala:line-numbers=237
  def dropEmptyValues: Json = this.mapObject(_.filter {
```

## ここがすごい

- 「空かどうか」の判定を、配列とオブジェクトの両方に同じ形で書いています。違いは `nonEmpty` の対象だけです。
- 値の種類で `case` を分けるので、どの型を残すかが、コードにそのまま書かれています。
- `mapObject` を使うので、オブジェクト以外には手を入れず、安全に使えます。
- `dropNullValues` と並べると、「null を消す」と「空を消す」の違いが、はっきりわかります。

## まとめ

- `dropEmptyValues` は、オブジェクトの中の空の配列と空のオブジェクトを持つキーを取り除きます。
- `null` や数値、文字列は、空ではないので残します。
- 判定は `case` で種類ごとに書かれ、`mapObject` で一度に適用されます。
