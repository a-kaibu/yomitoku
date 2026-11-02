---
title: "Map と Vector を組にして、キーの入れた順番を保つ"
description: "circe の JsonObject の内部実装 MapAndVectorJsonObject。値は Map に、キーの順番は Vector に分けて持つ。追加は末尾に、削除は Vector から取り除く。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/JsonObject.scala"
lines: [454, 487]
format: 2
function: "JsonObject.MapAndVectorJsonObject"
difficulty: 3
tags: [データ構造, API設計, ハッシュ]
---

## ひとことで

circe の `JsonObject` は、JSON のオブジェクトを表す型です。内部には `MapAndVectorJsonObject` という実装があり、値を `Map` に、キーの順番を `Vector` に分けて持ちます。`Map` は値を素早く探すため、`Vector` は元の並び順を保つためです。

## コード

```scala:line-numbers=454
  private final class MapAndVectorJsonObject(
    fields: Map[String, Json],
    orderedKeys: Vector[String]
  ) extends JsonObject {
    private[circe] def applyUnsafe(key: String): Json = fields(key)
    final def apply(key: String): Option[Json] = fields.get(key)
    final def size: Int = fields.size
    final def contains(key: String): Boolean = fields.contains(key)
    final def isEmpty: Boolean = fields.isEmpty

    final def keys: Iterable[String] = orderedKeys
    final def values: Iterable[Json] = orderedKeys.map(key => fields(key))

    final def toMap: Map[String, Json] = fields
    final def toIterable: Iterable[(String, Json)] = orderedKeys.map(key => (key, fields(key)))

    final def add(key: String, value: Json): JsonObject =
      if (fields.contains(key)) {
        new MapAndVectorJsonObject(fields.updated(key, value), orderedKeys)
      } else {
        new MapAndVectorJsonObject(fields.updated(key, value), orderedKeys :+ key)
      }

    final def +:(field: (String, Json)): JsonObject = {
      val (key, value) = field
      if (fields.contains(key)) {
        new MapAndVectorJsonObject(fields.updated(key, value), orderedKeys)
      } else {
        new MapAndVectorJsonObject(fields.updated(key, value), key +: orderedKeys)
      }
    }

    final def remove(key: String): JsonObject =
      new MapAndVectorJsonObject(fields - key, orderedKeys.filterNot(_ == key))
```

## 前提知識

- `Map[String, Json]` は、キーから値を素早く探せるデータ構造です。ただし、キーの並び順は保証されません。
- `Vector[String]` は、要素を順番どおりに持つ列です。末尾への追加も速く行えます。
- JSON では、キーの並び順が表示や出力に影響することがあります。元の順番を残すと、読みやすさが保たれます。
- `fields.updated(key, value)` は、`Map` の中で値を入れ替えた新しい `Map` を作ります。元の `Map` は変わりません。
- `filterNot(_ == key)` は、条件に当てはまらない要素だけを残す操作です。

## 何をしているか

### 1. 値と並び順を、二つのフィールドに分けて持つ

クラスは、`fields`（キーから値への `Map`）と `orderedKeys`（キーの並びの `Vector`）を受け取ります。二つは常に同じキーの集合を指すように作られています。

```scala:line-numbers=454
  private final class MapAndVectorJsonObject(
    fields: Map[String, Json],
    orderedKeys: Vector[String]
  ) extends JsonObject {
```

### 2. 追加するとき、新しいキーなら並びの末尾に足す

キーがすでにあるなら、`Map` の値だけを入れ替えて、並びは変えません。新しいキーなら、`Map` に入れた上で、`orderedKeys :+ key` で末尾に足します。

```scala:line-numbers=470
    final def add(key: String, value: Json): JsonObject =
      if (fields.contains(key)) {
        new MapAndVectorJsonObject(fields.updated(key, value), orderedKeys)
      } else {
        new MapAndVectorJsonObject(fields.updated(key, value), orderedKeys :+ key)
      }
```

### 3. 削除するとき、`Map` と並びの両方から消す

`fields - key` で `Map` から消し、`orderedKeys.filterNot(_ == key)` で並びからも消します。両方を同時に更新するので、二つがずれません。

```scala:line-numbers=486
    final def remove(key: String): JsonObject =
      new MapAndVectorJsonObject(fields - key, orderedKeys.filterNot(_ == key))
```

## ここがすごい

- 値の探しやすさと、並び順の保ちやすさを、二つのデータ構造に役割分担させています。
- 既存のキーへの追加では、並びを作り直さないので、余計な処理がありません。
- 外から見ると、`keys` と `toIterable` は並び順どおりに返ります。JSON の出力も、この順番に従います。
- 追加と削除の両方で、二つのフィールドを必ず同時に更新しています。どちらか片方だけが変わることがありません。

## まとめ

- `MapAndVectorJsonObject` は、値を `Map`、キーの並びを `Vector` に分けて持ちます。
- 追加は新しいキーなら末尾へ、削除は両方から取り除きます。
- 値を探すのは `Map`、順番を保つのは `Vector`、と役割を分けています。
