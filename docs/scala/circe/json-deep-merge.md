---
title: "両方が JSON のオブジェクトなら中身を混ぜ、そうでなければ相手を採る"
description: "circe の Json.deepMerge。2 つの値が両方ともオブジェクトなら、JsonObject.deepMerge で中身を混ぜる。片方でも違えば、相手の値をそのまま返す。型による場合分けを 1 つの match で書く。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/Json.scala"
lines: [189, 201]
format: 2
function: "Json.deepMerge"
difficulty: 3
tags: [データ構造, 関数型, 型システム]
---

## ひとことで

circe は、Scala で JSON を扱うライブラリです。`Json` の `deepMerge` は、2 つの JSON の値を合わせます。両方がオブジェクトであれば、中身のキーを混ぜ合わせます。どちらかがオブジェクトでなければ、相手の値をそのまま採ります。

## コード

```scala:line-numbers=189
  def deepMerge(that: Json): Json =
    (asObject, that.asObject) match {
      case (Some(lhs), Some(rhs)) =>
        fromJsonObject(
          lhs.toIterable.foldLeft(rhs) {
            case (acc, (key, value)) =>
              rhs(key).fold(acc.add(key, value)) { r =>
                acc.add(key, value.deepMerge(r))
              }
          }
        )
      case _ => that
    }
```

## 前提知識

- JSON の値は、オブジェクト、配列、文字列、数、真偽値、null などの種類があります。
- `asObject` は、値がオブジェクトなら `Some(オブジェクト)`、そうでなければ `None` を返す関数です。
- `(asObject, that.asObject)` の組を `match` で調べると、両方がオブジェクトかどうかを 1 回の判定で分けられます。
- 「相手を採る」は、オブジェクト同士でなければ、後から渡された値（`that`）で置き換えることです。
- `JsonObject.deepMerge` は、キーごとに中身を混ぜ合わせる関数です。このメソッドはその入り口にあたります。

## 何をしているか

### 1. 両方がオブジェクトなら、中身を混ぜる

`case (Some(lhs), Some(rhs))` は、両方がオブジェクトのときに選ばれます。`lhs.toIterable.foldLeft(rhs)` で、左の各キーを右のオブジェクトに混ぜ込んでいきます。

```scala:line-numbers=190
    (asObject, that.asObject) match {
      case (Some(lhs), Some(rhs)) =>
        fromJsonObject(
          lhs.toIterable.foldLeft(rhs) {
            case (acc, (key, value)) =>
              rhs(key).fold(acc.add(key, value)) { r =>
                acc.add(key, value.deepMerge(r))
              }
```

同じキーが右にもあれば、その値同士を再帰的に混ぜます。右にないキーは、そのまま足されます。

```scala:line-numbers=198
          }
        )
```

### 2. 片方でもオブジェクトでなければ、相手を採る

`case _ => that` は、どちらか一方でもオブジェクトでないときに選ばれます。その場合は、相手の値をそのまま返します。左の値は、捨てられます。

```scala:line-numbers=200
      case _ => that
```

## ここがすごい

- 場合分けを、1 つの `match` にまとめています。両方がオブジェクトかどうかを、組のパターンで同時に判定できます。
- オブジェクトの中身の混ぜ方を、`JsonObject` に任せて、この関数は入り口だけを担当しています。役割の分け方が明確です。
- オブジェクトでない値は、丸ごと相手で置き換えるという単純な規則にしています。JSON の値の種類が増えても、規則は変わりません。
- 結果の型は `Json` のままなので、呼び出し側は、どの場合でも同じ型の値を受け取れます。

## まとめ

- 2 つの値を合わせるとき、両方が同じ種類かどうかで処理を分けると、規則がはっきりします。
- 中身を混ぜる処理は、専用の関数に任せると、入り口の関数を短く保てます。
- 型の種類ごとの規則を `match` でまとめると、場合分けを読みやすくできます。
