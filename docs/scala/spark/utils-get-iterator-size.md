---
title: "反復子の要素数を、分かるなら即答し、分からなければ数えながら進む"
description: "Apache Spark の Utils.getIteratorSize。Iterator の knownSize が分かっていれば、それをそのまま返す。分からなければ、要素を 1 つずつ取り出して数える。数え終わると、反復子は空になる。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/Utils.scala"
lines: [1817, 1827]
format: 2
function: "Utils.getIteratorSize"
difficulty: 2
tags: [イテレータ, 最適化, 標準ライブラリ]
---

## ひとことで

Spark の `Utils.getIteratorSize` は、`Iterator` に含まれる要素の数を求めます。大きさが最初から分かっている反復子なら、そのまま答えます。分からない反復子なら、要素を 1 つずつ取り出して数えます。

## コード

```scala:line-numbers=1817
  def getIteratorSize(iterator: Iterator[_]): Long = {
    if (iterator.knownSize >= 0) iterator.knownSize.toLong
    else {
      var count = 0L
      while (iterator.hasNext) {
        count += 1L
        iterator.next()
      }
      count
    }
  }
```

## 前提知識

- `Iterator` は、要素を 1 つずつ取り出す仕組みです。一度取り出した要素は、元に戻せません。
- `knownSize` は、要素の数が分かっている場合にその数を返し、分からない場合は -1 を返す、`Iterator` の関数です。
- 要素を数えると、反復子を最後まで進めてしまうので、数えた後はもう要素が残っていません。
- `Long` は 64 ビットの整数です。大量の要素を数えても、溢れにくい型です。
- `count += 1L` の `1L` は、`Long` の 1 を表すリテラルです。

## 何をしているか

### 1. 大きさが分かるなら、そのまま返す

`knownSize` が 0 以上なら、その値を `Long` にして返します。要素を 1 つも取り出さずに答えが出ます。

```scala:line-numbers=1818
    if (iterator.knownSize >= 0) iterator.knownSize.toLong
```

### 2. 分からなければ、取り出しながら数える

`knownSize` が -1 のときは、`count` を 0 から始めて、`hasNext` が真の間、要素を 1 つずつ取り出して `count` を増やします。

```scala:line-numbers=1821
      while (iterator.hasNext) {
        count += 1L
        iterator.next()
      }
      count
    }
```

### 3. 数えた結果を返す

すべての要素を取り出し終わったら、`count` が要素の数です。それを返します。

```scala:line-numbers=1825
      count
```

## ここがすごい

- 大きさが分かる場合は、要素を読まずに答えを返すので、とても速く終わります。
- 分からない場合でも、要素を配列などに集めずに、数えるだけなので、メモリを使いません。
- 数えるときに、要素を捨てているように見えますが、この関数は「数える」ことだけが目的です。元のデータは、もう取り出せない点に注意が必要です。
- `knownSize` という特別な値を使い、分かるかどうかを 1 つの数で表しています。

## まとめ

- 要素数を求めるとき、分かっていれば即答し、分からなければ数えるという順番が効率的です。
- 反復子は、数えると空になるので、同じものを 2 回使うときは注意が必要です。
- メモリを使わずに数えるには、要素を捨てながら進める方法が使えます。
