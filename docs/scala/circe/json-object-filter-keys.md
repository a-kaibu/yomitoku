---
title: "キーの名前だけを見て、オブジェクトの項目を絞る"
description: "circe の JsonObject.filterKeys。キーを受け取って真偽を返す関数で、項目を絞り込む。値は見ずにキーだけで判断する。filter の特別な形。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/JsonObject.scala"
lines: [194, 194]
format: 2
function: "JsonObject.filterKeys"
difficulty: 1
tags: [データ構造, API設計, 関数型]
---

## ひとことで

circe の `JsonObject` は、JSON のオブジェクトを表す型です。`filterKeys` は、キーの名前だけを見て、残す項目を決めます。値の中身は見ません。例えば「`x` で始まるキーだけ残す」といった絞り込みに使えます。

## コード

```scala:line-numbers=194
  final def filterKeys(pred: String => Boolean): JsonObject = filter(field => pred(field._1))
```

## 前提知識

- JSON のオブジェクトは、キーと値の組の集まりです。
- `pred: String => Boolean` は、キーを受け取って、残すかどうかを真偽で答える関数です。
- `filter` は、キーと値の組を受け取って、残すかを決める操作です。`filterKeys` は、その特別な形です。
- `field._1` は、組（タプル）の一番目、つまりキーを取り出す書き方です。

## 何をしているか

### 1. 組の一番目（キー）だけを、条件に渡す

`filter` に渡す関数は、キーと値の組 `field` を受け取ります。`field._1` で、キーだけを `pred` に渡して判断します。値は使いません。

```scala:line-numbers=194
  final def filterKeys(pred: String => Boolean): JsonObject = filter(field => pred(field._1))
```

## ここがすごい

- 値を見ずに、キーの名前だけで絞り込めるので、判断の基準がはっきりします。
- 既存の `filter` を使って書かれているので、新しい絞り込みの仕組みを増やしていません。
- 絞り込んだ結果も `JsonObject` のままなので、そのあと `add` や `toJson` などを続けられます。
- 「キーだけを見る」という意図が、名前 `filterKeys` で伝わります。

## まとめ

- `filterKeys` は、キーの名前を条件にして、オブジェクトの項目を残します。
- 中身は `filter` に、キーだけを渡す関数を渡した一行です。
- 値は見ないので、キーの名前だけで判断したいときに使います。
