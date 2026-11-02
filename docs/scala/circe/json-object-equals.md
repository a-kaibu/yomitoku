---
title: "キーの順番が違っても、同じ中身の JSON オブジェクトは等しいとみなす"
description: "circe の JsonObject.equalsJsonObject。キーの並びに関係なく、サイズが同じで、どのキーも同じ値を持つかを調べる。ハッシュ値も順番に依存しない形で計算される。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/JsonObject.scala"
lines: [427, 446]
format: 2
function: "JsonObject.equalsJsonObject"
difficulty: 3
tags: [ハッシュ, データ構造, API設計]
---

## ひとことで

circe の `JsonObject` は、JSON のオブジェクト（キーと値の組の集まり）を表す型です。`equalsJsonObject` は、2 つのオブジェクトが等しいかを調べます。キーがどの順番で並んでいても、同じ内容なら等しいと判断します。JSON では、キーの順番に意味がないことが多いからです。

## コード

```scala:line-numbers=427
    final def equalsJsonObject(that: JsonObject): Boolean = that match {
      case that: LinkedHashMapJsonObject =>
        if (this.size != that.size)
          return false

        val iterator = fields.entrySet.iterator
        while (iterator.hasNext) {
          val entry = iterator.next
          if (that.applyUnsafe(entry.getKey) != entry.getValue) {
            return false
          }
        }
        true
      case that: MapAndVectorJsonObject =>
        this.size == that.size &&
        that.toMap.forall {
          case (k, v) =>
            v == this.applyUnsafe(k)
        }
    }
```

## 前提知識

- JSON のオブジェクトは `{"a": 1, "b": 2}` のように、キーと値の組を並べたものです。
- `size` は、オブジェクトに入っているキーの数です。
- `==` は、2 つの値が等しいかを比べる演算子です。
- `return false` は、メソッドの途中で `false` を返して終わる書き方です。Scala では、ふつう式の値で結果を返しますが、ここでは早く抜けるために使っています。
- `applyUnsafe(k)` は、キーに対応する値を、存在確認せずに取り出す内部用の操作です。

## 何をしているか

### 1. 片方が `LinkedHashMap` のとき、キーを 1 つずつ確かめる

まずサイズを比べます。違えばすぐに `false` です。同じなら、相手の各キーについて、値が同じかを調べます。途中で 1 つでも違えば、すぐ `false` を返します。

```scala:line-numbers=428
      case that: LinkedHashMapJsonObject =>
        if (this.size != that.size)
          return false

        val iterator = fields.entrySet.iterator
        while (iterator.hasNext) {
          val entry = iterator.next
          if (that.applyUnsafe(entry.getKey) != entry.getValue) {
            return false
          }
        }
```

### 2. 片方が `MapAndVector` のとき、サイズと全キーを比べる

こちらのケースでは、サイズが同じことを確かめてから、相手の `Map` の全要素について値を比べます。`forall` は、全部が条件を満たすときだけ `true` になります。

```scala:line-numbers=440
      case that: MapAndVectorJsonObject =>
        this.size == that.size &&
        that.toMap.forall {
          case (k, v) =>
            v == this.applyUnsafe(k)
        }
```

### 3. ハッシュ値も、順番に依存しない形で計算する

`internalHashCode` は、`MurmurHash3.unorderedHash` を使います。要素の並びを無視して計算するので、キーの順番が違っても同じ値になります。等しい二つのオブジェクトが、同じハッシュ値を持つ約束を守るためです。

```scala:line-numbers=448
    final def internalHashCode: Int = MurmurHash3.unorderedHash(toIterable, MurmurHash3.mapSeed)
```

## ここがすごい

- キーの並び順を無視して比べるので、`{"a":1,"b":2}` と `{"b":2,"a":1}` が等しいと判断されます。JSON の意味に合った比べ方です。
- 等しさとハッシュ値が、同じ「順番に依存しない」考え方でそろっています。そのため、ハッシュ表のキーとして使っても、等しいものが同じ場所に入ります。
- サイズを先に比べて早く抜けるので、違うオブジェクトはほとんどの場合すぐに終わります。
- 内部の表現（`LinkedHashMap` と `Map + Vector`）ごとに分けて書かれているので、表現の違いを吸収しながら、速さを保っています。

## まとめ

- `equalsJsonObject` は、キーの順番に関係なく、キーと値が同じかを調べます。
- サイズを先に比べ、キーごとに値を確かめます。
- ハッシュ値も順番に依存しない形で作るので、等しさとハッシュの約束が一致します。
