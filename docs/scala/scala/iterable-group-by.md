---
title: "キーごとに要素を集め、最後に不変のマップにまとめる"
description: "Scala 標準ライブラリの Iterable.groupBy。要素をキーで分け、同じキーの要素を一緒に集める。途中は可変のマップと Builder を使い、最後に不変の HashMap へ入れ直す。作りながら変えるより、途中の作業を速くする設計。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/Iterable.scala"
lines: [556, 572]
format: 2
function: "Iterable.groupBy"
difficulty: 3
tags: [関数型, データ構造, 標準ライブラリ]
---

## ひとことで

Scala の `Iterable.groupBy` は、要素を「キーを決める関数」で分けて、同じキーの要素をまとめた `Map` を作ります。たとえば単語を先頭の文字で分けると、「a で始まる単語のグループ」などが作れます。

## コード

```scala:line-numbers=556
  def groupBy[K](f: A => K): immutable.Map[K, C] = {
    val m = mutable.Map.empty[K, Builder[A, C]]
    val it = iterator
    while (it.hasNext) {
      val elem = it.next()
      val key = f(elem)
      val bldr = m.getOrElseUpdate(key, newSpecificBuilder)
      bldr += elem
    }
    var result = immutable.HashMap.empty[K, C]
    val mapIt = m.iterator
    while (mapIt.hasNext) {
      val (k, v) = mapIt.next()
      result = result.updated(k, v.result())
    }
    result
  }
```

## 前提知識

- `Map` は、キーから値を引くための型です。`groupBy` の結果は、キーと、そのキーに属する要素の集まりの組です。
- `mutable.Map` は、後から中身を変えられる `Map` です。`immutable.Map` は、変えられない `Map` で、変えるたびに新しい `Map` を作ります。
- `Builder` は、要素を後ろに足して、最後に完成した集まりを取り出す入れ物です。`+=` で要素を足し、`result()` で完成させます。
- `getOrElseUpdate(key, default)` は、キーが無ければ既定の値を入れて、その値を返す操作です。
- `iterator` は、要素を 1 つずつ取り出す仕組みです。`while (it.hasNext)` で全部を順に読みます。

## 何をしているか

### 1. 可変のマップに、キーごとの Builder を集める

最初に、キーから `Builder` への可変のマップを作ります。要素を 1 つずつ読み、キーを決めて、そのキーの `Builder` に要素を足します。キーが新しければ、`getOrElseUpdate` が新しい `Builder` を作ります。

```scala:line-numbers=557
    val m = mutable.Map.empty[K, Builder[A, C]]
    val it = iterator
    while (it.hasNext) {
      val elem = it.next()
      val key = f(elem)
      val bldr = m.getOrElseUpdate(key, newSpecificBuilder)
      bldr += elem
    }
    var result = immutable.HashMap.empty[K, C]
```

### 2. 不変のマップに入れ直す

途中の作業が済んだら、各 `Builder` の `result()` で完成した集まりを取り出し、不変の `HashMap` に入れます。`updated` は、新しい `HashMap` を返す操作です。

```scala:line-numbers=566
    val mapIt = m.iterator
    while (mapIt.hasNext) {
      val (k, v) = mapIt.next()
      result = result.updated(k, v.result())
    }
    result
```

### 3. 完成した不変のマップを返す

すべてのキーを入れ終わったら、その `HashMap` を返します。呼び出し側は、後から値が変わらない安全な `Map` を受け取ります。

```scala:line-numbers=572
  }
```

## ここがすごい

- 途中の作業では、可変のマップと `Builder` を使い、要素を足すたびに新しい `Map` を作ることを避けています。作業の速さが大事な部分です。
- 最後だけ不変の `Map` にするので、結果を受け取った側は、変更される心配がありません。速さと安全さを両立しています。
- キーの計算は要素ごとに 1 回だけです。同じ要素のキーを何度も求め直しません。
- 要素の集まりの型を `Builder` で決めているので、リストでもベクタでも、元のコレクションに合う型で返せます。

## まとめ

- 分類して集めるときは、途中は可変、最後は不変、という使い分けが速さと安全さの両立になります。
- `getOrElseUpdate` と `Builder` を組み合わせると、キーごとの集まりを簡単に作れます。
- 結果の型を、元のコレクションに合わせて決める設計は、Scala の標準ライブラリに共通です。
