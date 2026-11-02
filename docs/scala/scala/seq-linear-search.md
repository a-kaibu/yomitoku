---
title: "ソート済みの列を先頭から順に見て、途中で止める"
description: "Scala の Seq の linearSearch。先頭から一つずつ比べ、等しければ Found、大きい値に出会えば挿入位置を返す。ソート済みなら、最後まで見なくても結果がわかる。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/Seq.scala"
lines: [1015, 1026]
format: 2
function: "Seq.linearSearch"
difficulty: 2
tags: [アルゴリズム, 探索, イテレータ]
---

## ひとことで

Scala の `Seq` には、`search` という探索の仕組みがあります。`linearSearch` は、その中で使われる一本ずつ見ていく探索です。列がソート済みなら、値より大きい要素に出会った時点で、探索を止められます。

## コード

```scala:line-numbers=1015
  private[this] def linearSearch[B >: A](c: View[A], elem: B, offset: Int)
                                        (implicit ord: Ordering[B]): SearchResult = {
    var idx = offset
    val it = c.iterator
    while (it.hasNext) {
      val cur = it.next()
      if (ord.equiv(elem, cur)) return Found(idx)
      else if (ord.lt(elem, cur)) return InsertionPoint(idx)
      idx += 1
    }
    InsertionPoint(idx)
  }
```

## 前提知識

- 線形探索は、先頭から一つずつ比べていく最も単純な探索です。
- `Ordering[B]` は、二つの値の大小を比べる方法の約束です。`equiv` は等しいか、`lt` は小さいかを調べます。
- `Found(idx)` は、値が見つかった位置を表します。`InsertionPoint(idx)` は、値を入れるべき位置を表します。
- `return` は、メソッドの途中で値を返して、そこで終わる書き方です。
- `view.slice(from, to)` は、範囲を切り出した、コピーを作らない見方です。

## 何をしているか

### 1. 先頭から一つずつ、要素を取り出す

`iterator` で要素を先頭から順に取り出します。`idx` は、いま見ている位置を数えます。

```scala:line-numbers=1017
    var idx = offset
    val it = c.iterator
    while (it.hasNext) {
      val cur = it.next()
```

### 2. 等しければ見つかった、大きければ挿入位置を返す

`elem` と `cur` が等しければ、`Found(idx)` を返して終わります。`elem` が `cur` より小さければ、ソート済みなので、その手前が挿入位置です。`InsertionPoint(idx)` を返します。

```scala:line-numbers=1021
      if (ord.equiv(elem, cur)) return Found(idx)
      else if (ord.lt(elem, cur)) return InsertionPoint(idx)
```

### 3. 最後まで見ても見つからなければ、末尾が挿入位置

すべての要素より大きいなら、挿入位置は末尾です。`InsertionPoint(idx)` を返します。

```scala:line-numbers=1023
      idx += 1
    }
    InsertionPoint(idx)
```

## ここがすごい

- 列がソート済みという前提を使い、大きい値に出会った時点で探索を止めます。同じ線形探索でも、無駄な比較を減らしています。
- 見つからなかったときも、挿入位置を一緒に返すので、結果の型は一つにまとまっています。
- `return` を使って、早く抜ける形を素直に書いています。
- 要素の大小は `Ordering` で受け取るので、数でも文字列でも、同じ仕組みで使えます。

## まとめ

- `linearSearch` は、ソート済みの列を先頭から一つずつ見て、途中で止めます。
- 等しければ `Found`、大きい値に出会えば `InsertionPoint` を返します。
- 最後まで見ても見つからなければ、末尾が挿入位置です。
