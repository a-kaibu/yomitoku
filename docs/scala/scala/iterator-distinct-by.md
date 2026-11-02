---
title: "初めて出た値だけを、遅延して順に返す"
description: "Scala 標準ライブラリの Iterator.distinctBy。キーを計算して、これまでに見た値の集合に入っていない要素だけを返す。HashSet で見た値を覚え、次に返す要素を先に 1 つ探しておく遅延評価の書き方。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/Iterator.scala"
lines: [566, 589]
format: 2
function: "Iterator.distinctBy"
difficulty: 3
tags: [イテレータ, 遅延評価, ハッシュ]
---

## ひとことで

Scala の `Iterator` にある `distinctBy` は、要素を取り出すたびに「キー」を計算し、そのキーが初めて出たときだけ要素を返します。同じキーの 2 回目以降は捨てます。たとえば人のリストから、年齢が同じ人を 1 人だけ残す、という処理が書けます。

## コード

```scala:line-numbers=566
  def distinctBy[B](f: A => B): Iterator[A] = new AbstractIterator[A] {

    private[this] val traversedValues = mutable.HashSet.empty[B]
    private[this] var nextElementDefined: Boolean = false
    private[this] var nextElement: A = _

    def hasNext: Boolean = nextElementDefined || (self.hasNext && {
      val a = self.next()
      if (traversedValues.add(f(a))) {
        nextElement = a
        nextElementDefined = true
        true
      }
      else hasNext
    })

    def next(): A =
      if (hasNext) {
        nextElementDefined = false
        nextElement
      } else {
        Iterator.empty.next()
      }
  }
```

## 前提知識

- `Iterator` は、要素を 1 つずつ取り出す仕組みです。取り出した要素は、元に戻せません。
- `distinctBy(f)` の `f` は、要素からキーを作る関数です。キーが同じ要素は、重複とみなされます。
- `mutable.HashSet` は、値を覚えておいて、同じ値が来たかを素早く調べられる集合です。
- 「遅延評価」は、必要になるまで計算を遅らせることです。`Iterator` では、次の要素を取り出すまで、元の要素を読みません。
- `private[this] var` は、クラスの中だけで使う可変の変数です。外からは見えません。

## 何をしているか

### 1. 見たキーを覚える集合と、次の要素の置き場所を用意する

`traversedValues` は、これまでに出たキーを覚えておく集合です。`nextElement` は、次に返す要素を一時的に置いておく場所で、`nextElementDefined` は、その場所に要素があるかを表します。

```scala:line-numbers=568
    private[this] val traversedValues = mutable.HashSet.empty[B]
    private[this] var nextElementDefined: Boolean = false
    private[this] var nextElement: A = _
```

### 2. 次に返す要素を、先に探しておく

`hasNext` は、すでに次の要素が決まっていれば真を返します。無ければ、元の `Iterator` から要素を 1 つ取り、そのキーが集合に無ければ、その要素を次の要素として置きます。集合に既にあれば、続きを再帰的に探します。

```scala:line-numbers=572
    def hasNext: Boolean = nextElementDefined || (self.hasNext && {
      val a = self.next()
      if (traversedValues.add(f(a))) {
        nextElement = a
        nextElementDefined = true
        true
      }
      else hasNext
    })
```

`add` は、値を集合に入れて、入っていなかったときだけ真を返します。この性質を使うと、キーが初めてかを 1 回の操作で判断できます。

### 3. 次の要素を返し、置き場所を空ける

`next()` は、先に見つけておいた要素を返します。そのあと `nextElementDefined` を偽にして、次の `hasNext` で新しい要素を探せるようにします。

```scala:line-numbers=582
    def next(): A =
      if (hasNext) {
        nextElementDefined = false
        nextElement
      } else {
        Iterator.empty.next()
      }
```

## ここがすごい

- キーの重複を、集合の `add` の戻り値 1 つで判断しています。「あるか調べる」と「入れる」を 1 回にまとめています。
- 次の要素を `hasNext` の中で先に探すので、元の `Iterator` を必要な分だけしか読みません。最初の数件だけ欲しいときの無駄が省けます。
- キーの計算は、要素を読むときに 1 回だけ行います。同じ要素のキーを何度も作りません。
- 元のコレクションを変えずに、読むときに重複を取り除くので、大きなデータでもまとめて配列を作る必要がありません。

## まとめ

- 重複を除くには、見たキーを集合に覚えておき、初めてのものだけを返します。
- 次の要素を先に決めておくと、`hasNext` と `next` の約束を守りながら遅延して動きます。
- `add` の戻り値を使うと、重複の判定を 1 回の操作で済ませられます。
