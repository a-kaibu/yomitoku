---
title: "値の回数を、行ごとに 1 つずつ増やし、全部の表が満杯なら数えない"
description: "Apache Pekko の FrequencySketch.increment。値のハッシュから、各行の位置を求めて回数を 1 増やす。一定の数を数えたら、すべての回数を半分にする reset を呼び、古い回数を減らす。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2021-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/FrequencySketch.scala"
lines: [188, 202]
format: 2
function: "FrequencySketch.increment"
difficulty: 3
tags: [ハッシュ, キャッシュ, アルゴリズム]
---

## ひとことで

Apache Pekko の `FrequencySketch` の `increment` は、ある値が 1 回使われたことを記録します。各行の表で、その値に当たる位置の回数を 1 増やします。どれかの回数が増えたら、全体の数を 1 つ数えます。その数が決められた値に達すると、すべての回数を半分にして、古いアクセスを忘れさせます。

## コード

```scala:line-numbers=188
  def increment(value: A): Unit = {
    val hash1 = hasher.hash(value)
    val hash2 = rehash(hash1)
    var updated = false
    var row = 0
    while (row < depth) {
      val hash = hash1 + row * hash2
      updated |= incrementCounter(row, hash)
      row += 1
    }
    if (updated) {
      updatedSize += 1
      if (updatedSize == resetSize) reset()
    }
  }
```

## 前提知識

- この仕組みは、キャッシュに入れるかどうかを決める（TinyLFU）ために使われます。最近よく使われる値を残すための判断材料です。
- `updated |= incrementCounter(row, hash)` は、行ごとの結果を OR で集める書き方です。1 つでも真なら、`updated` は真になります。
- 回数の上限は、1 つの位置に入るビット数で決まります。上限に達した位置は、それ以上増えません。
- `resetSize` は、この回数を何回数えたら全体を半分にするかを表す値です。
- 「減衰（aging）」は、古い情報を少しずつ薄める考え方です。新しいアクセスが目立つようにします。

## 何をしているか

### 1. 値から、行ごとの位置を準備する

`hash1` と `hash2` を求め、二重ハッシュの位置を行ごとに作れるようにします。

```scala:line-numbers=189
    val hash1 = hasher.hash(value)
    val hash2 = rehash(hash1)
```

### 2. 各行で、位置の回数を増やせたかを記録する

行ごとに `incrementCounter` を呼びます。増やせた行が 1 つでもあれば、`updated` が真になります。全部の行で上限に達していれば、増えないので `updated` は偽のままです。

```scala:line-numbers=191
    var updated = false
    var row = 0
    while (row < depth) {
      val hash = hash1 + row * hash2
      updated |= incrementCounter(row, hash)
      row += 1
```

### 3. 増えたら全体の数を数え、必要なら reset する

どこかで増えたときだけ、`updatedSize` を 1 増やします。その数が `resetSize` に等しくなったら、`reset()` を呼んで、すべての回数を半分にします。

```scala:line-numbers=197
    }
    if (updated) {
      updatedSize += 1
      if (updatedSize == resetSize) reset()
    }
```

## ここがすごい

- 全部の行が上限に達している値は、数えても意味がないので、数を更新せず、余分な処理を避けています。
- 数を増やした回数だけを数えるので、`reset` の間隔は「実際の更新の回数」で決まります。
- 定期的に半分にするので、昔の人気と今の人気が自然に混ざり合います。古いデータに頼り続けない仕組みです。
- 表の値を直接書き換えるだけで、ほかのデータ構造を作らずに、回数の管理ができます。

## まとめ

- 出現回数の記録は、行ごとの表を更新し、その結果で全体の数を数える形にできます。
- 上限に達した値を数えないことで、無駄な更新を減らせます。
- 定期的に回数を半分にすると、古いアクセスの影響を薄められます。
