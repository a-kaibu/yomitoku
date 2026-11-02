---
title: "辞書の中身を、null のキーを含めて順に返す Iterator"
description: "Apache Spark の OpenHashMap.iterator。null のキーの値を最初に返し、続いて配列の使われている位置を順に探して、キーと値の組を返す。次に返す組を先に計算しておき、hasNext を単純にする。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/OpenHashMap.scala"
lines: [139, 169]
format: 2
function: "OpenHashMap.iterator"
difficulty: 3
tags: [イテレータ, データ構造, ハッシュ]
---

## ひとことで

Spark の `OpenHashMap` は、キーと値の組を配列に並べて持つ辞書です。`iterator` は、その中身をすべて順番に取り出す仕組みです。キーが `null` のものは別に覚えているので、最初にその組を返します。その後、配列の使われている位置を順に返します。

## コード

::: code-group

```scala:line-numbers=139 [日本語訳]
  override def iterator: Iterator[(K, V)] = new Iterator[(K, V)] {
    var pos = -1
    var nextPair: (K, V) = computeNextPair()

    /** 次に next() で返す組を求めます。終わりなら null を返します。 */
    def computeNextPair(): (K, V) = {
      if (pos == -1) {    // 位置 -1 は、null のキーを見ている状態として扱います。
        if (haveNullValue) {
          pos += 1
          return (null.asInstanceOf[K], nullValue)
        }
        pos += 1
      }
      pos = _keySet.nextPos(pos)
      if (pos >= 0) {
        val ret = (_keySet.getValue(pos), _values(pos))
        pos += 1
        ret
      } else {
        null
      }
    }

    def hasNext: Boolean = nextPair != null

    def next(): (K, V) = {
      val pair = nextPair
      nextPair = computeNextPair()
      pair
    }
  }
```

```scala:line-numbers=139 [原文]
  override def iterator: Iterator[(K, V)] = new Iterator[(K, V)] {
    var pos = -1
    var nextPair: (K, V) = computeNextPair()

    /** Get the next value we should return from next(), or null if we're finished iterating */
    def computeNextPair(): (K, V) = {
      if (pos == -1) {    // Treat position -1 as looking at the null value
        if (haveNullValue) {
          pos += 1
          return (null.asInstanceOf[K], nullValue)
        }
        pos += 1
      }
      pos = _keySet.nextPos(pos)
      if (pos >= 0) {
        val ret = (_keySet.getValue(pos), _values(pos))
        pos += 1
        ret
      } else {
        null
      }
    }

    def hasNext: Boolean = nextPair != null

    def next(): (K, V) = {
      val pair = nextPair
      nextPair = computeNextPair()
      pair
    }
  }
```

:::

## 前提知識

- `Iterator` は、要素を 1 つずつ取り出す仕組みです。`hasNext` で続きがあるかを確かめ、`next()` で 1 つ取り出します。
- `OpenHashMap` では、キーは `OpenHashSet` の中にあり、値は同じ位置の `_values` 配列に入っています。
- `nextPos(from)` は、`from` 以降で使われている最初の位置を返す関数です。見つからなければ -1 を返します。
- `null` のキーは、配列の中に置けないので、`haveNullValue` と `nullValue` という別の変数で持っています。
- `nextPair` は、次に返す組をあらかじめ計算して覚えておく変数です。`null` のときは、もう続きがないという意味です。

## 何をしているか

### 1. 最初に、次に返す組を計算しておく

`nextPair` は、作られたときに `computeNextPair()` で最初の組を求めます。`pos` は、今どの位置まで見たかを表します。最初は -1 で、`null` の値を見る位置として扱います。

```scala:line-numbers=140
    var pos = -1
    var nextPair: (K, V) = computeNextPair()
```

### 2. 次の組を求める関数

`computeNextPair` は、まず `null` のキーがあれば、その組を返します。そうでなければ、`nextPos` で使われている次の位置を探し、キーと値の組を作ります。見つからなければ `null` を返して、終わりを知らせます。

```scala:line-numbers=144
    def computeNextPair(): (K, V) = {
      if (pos == -1) {    // Treat position -1 as looking at the null value
        if (haveNullValue) {
          pos += 1
          return (null.asInstanceOf[K], nullValue)
        }
        pos += 1
      }
      pos = _keySet.nextPos(pos)
      if (pos >= 0) {
        val ret = (_keySet.getValue(pos), _values(pos))
        pos += 1
        ret
      } else {
        null
      }
    }
```

### 3. hasNext と next で、先に計算した組を返す

`hasNext` は、`nextPair` が `null` でなければ真です。`next()` は、今の組を取り出し、次の組を計算して `nextPair` に入れ直してから、取り出した組を返します。

```scala:line-numbers=162
    def hasNext: Boolean = nextPair != null

    def next(): (K, V) = {
      val pair = nextPair
      nextPair = computeNextPair()
      pair
    }
```

## ここがすごい

- 次の組を先に求めておくので、`hasNext` は変数を見るだけで答えられます。`hasNext` を何度呼んでも、探索は走りません。
- `null` のキーを、配列の外の変数で扱うので、配列の仕組みを特別に変える必要がありません。
- 使われていない位置は `nextPos` が飛ばすので、空きの多い配列でも、要素の数だけ進みます。
- 値を取り出す位置と、次の位置を分けて持つので、`next()` の中で順番を間違えることがありません。

## まとめ

- 辞書の中身を順に返すときは、次に返す組を先に求めておくと、`hasNext` が簡単になります。
- 特別なキー（null）は、通常の配列とは別の変数で持つと、仕組みが分かりやすくなります。
- 使われていない位置を飛ばす仕組みがあると、疎な配列でも効率よく全体を回せます。
