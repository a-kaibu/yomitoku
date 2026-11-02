---
title: "入れ子の中から、同じキーの値をすべて集める"
description: "circe の Json.findAllByKey。オブジェクトと配列の奥まで再帰的にたどり、指定したキーに対応する値をすべて集める。ListBuffer に足して、最後にリストにする。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/Json.scala"
lines: [270, 284]
format: 2
function: "Json.findAllByKey"
difficulty: 2
tags: [再帰, データ構造, イテレータ]
---

## ひとことで

circe の `Json` は、入れ子になった JSON の値です。`findAllByKey` は、どこの深さにあっても、指定したキーの値をすべて集めます。オブジェクトと配列の中を、奥まで順にたどります。見つかった値は、見つかった順にリストになります。

## コード

::: code-group

```scala:line-numbers=270 [日本語訳]
  final def findAllByKey(key: String): List[Json] = {
    val hh: ListBuffer[Json] = ListBuffer.empty[Json]
    def loop(json: Json): Unit = json match {
      case JObject(obj) =>
        obj.toIterable.foreach {
          case (k, v) =>
            if (k == key) hh += v
            loop(v)
        }
      case JArray(elems) => elems.foreach(loop)
      case _             => // 何もしません（値を持たない種類は読み飛ばします）
    }
    loop(this)
    hh.toList
  }
```

```scala:line-numbers=270 [原文]
  final def findAllByKey(key: String): List[Json] = {
    val hh: ListBuffer[Json] = ListBuffer.empty[Json]
    def loop(json: Json): Unit = json match {
      case JObject(obj) =>
        obj.toIterable.foreach {
          case (k, v) =>
            if (k == key) hh += v
            loop(v)
        }
      case JArray(elems) => elems.foreach(loop)
      case _             => // do nothing
    }
    loop(this)
    hh.toList
  }
```

:::

## 前提知識

- JSON では、オブジェクトの中にオブジェクトや配列が入れ子になっていることがよくあります。
- `ListBuffer` は、末尾に要素を足していける可変のリストです。最後に `toList` で不変のリストにできます。
- `loop` は、補助のローカル関数です。自分自身を呼び出して、入れ子の奥へ進みます。
- `obj.toIterable.foreach { case (k, v) => ... }` は、オブジェクトのキーと値の組を一つずつ取り出す書き方です。
- `case _ => // do nothing` は、値を持たない種類（`null`、数値など）のとき、何もしないという意味です。

## 何をしているか

### 1. 結果を入れる `ListBuffer` を用意する

最初に、空の `ListBuffer` を作ります。見つけた値を、ここに順に足していきます。

```scala:line-numbers=271
    val hh: ListBuffer[Json] = ListBuffer.empty[Json]
```

### 2. オブジェクトなら、キーを比べて、奥へ再帰する

オブジェクトの各キーと値について、キーが一致すれば `hh` に値を足します。そのうえで、値 `v` に対して `loop` を呼び、さらに奥をたどります。キーが一致しても、奥にも同じキーがあるかもしれないので、必ず再帰します。

```scala:line-numbers=273
      case JObject(obj) =>
        obj.toIterable.foreach {
          case (k, v) =>
            if (k == key) hh += v
            loop(v)
        }
```

### 3. 配列なら、要素ごとに再帰する。それ以外は何もしない

配列の各要素に `loop` を当てて、奥をたどります。`null` や数値などは、中に何もないので読み飛ばします。

```scala:line-numbers=279
      case JArray(elems) => elems.foreach(loop)
      case _             => // do nothing
```

### 4. 全部たどったら、集めた値をリストにして返す

`loop(this)` で、自分自身から調べ始めます。最後に `hh.toList` で、集めた値を不変のリストにして返します。

```scala:line-numbers=282
    loop(this)
    hh.toList
```

## ここがすごい

- 深さを気にせずに、どこにあっても見つけられます。再帰の呼び出しで、入れ子の奥まで同じ処理を当てています。
- キーが一致しても、そこで止まらずに奥をたどります。同じキーが入れ子の中にもあれば、すべて拾えます。
- 結果を `ListBuffer` に足すことで、途中で不変のリストを何度も作り直しません。
- 種類による分岐を `match` で書いているので、どの種類を読み飛ばすかが、コードに明示されています。

## まとめ

- `findAllByKey` は、入れ子の中のキーを再帰的に探し、一致した値をすべて集めます。
- オブジェクトはキーを比べて奥へ進み、配列は要素ごとに奥へ進みます。
- 結果は `ListBuffer` に溜め、最後にリストとして返します。
