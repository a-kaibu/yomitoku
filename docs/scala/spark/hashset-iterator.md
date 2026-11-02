---
title: "空いていない位置だけを順に飛ばして、要素を取り出す"
description: "Apache Spark の OpenHashSet.iterator。ビットセットで使われている位置だけを、nextPos で次々に探して要素を返す。空の位置は読み飛ばすので、容量が大きくても要素の数だけ進む。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/OpenHashSet.scala"
lines: [193, 201]
format: 2
function: "OpenHashSet.iterator"
difficulty: 2
tags: [イテレータ, データ構造, ハッシュ]
---

## ひとことで

Spark の `OpenHashSet` は、要素を配列に並べて持つ集合です。`iterator` は、その集合の要素を 1 つずつ取り出す仕組みです。配列の空いている場所は読み飛ばし、使われている位置だけを順に返します。

## コード

```scala:line-numbers=193
  def iterator: Iterator[T] = new Iterator[T] {
    var pos = nextPos(0)
    override def hasNext: Boolean = pos != INVALID_POS
    override def next(): T = {
      val tmp = getValue(pos)
      pos = nextPos(pos + 1)
      tmp
    }
  }
```

## 前提知識

- `OpenHashSet` では、要素は配列の中のどこかに入っていて、空いている場所もたくさんあります。
- `Iterator` は、要素を 1 つずつ取り出す仕組みです。`hasNext` で続きがあるかを確かめ、`next()` で 1 つ取り出します。
- `nextPos(from)` は、`from` 以降で使われている最初の位置を返す関数です。内部では、ビットセットの `nextSetBit` を使います。
- `INVALID_POS` は、もう使われている位置が無いことを表す値です。ここでは -1 です。
- `new Iterator[T] { ... }` は、名前のない `Iterator` の実装を、その場で書く書き方です。

## 何をしているか

### 1. 最初の使われている位置を探しておく

`pos` は、今取り出す位置を覚えておく変数です。作られたときに、最初に使われている位置を `nextPos(0)` で探します。

```scala:line-numbers=194
    var pos = nextPos(0)
```

### 2. 続きがあるかは、位置が有効かで決める

`hasNext` は、`pos` が `INVALID_POS` でなければ真です。つまり、まだ使われている位置が残っているということです。

```scala:line-numbers=195
    override def hasNext: Boolean = pos != INVALID_POS
```

### 3. 今の位置の要素を返し、次の位置を先に探す

`next()` は、今の位置の要素を `tmp` に取り出します。その後で `nextPos(pos + 1)` で次に使われている位置を探して `pos` に入れてから、`tmp` を返します。

```scala:line-numbers=196
    override def next(): T = {
      val tmp = getValue(pos)
      pos = nextPos(pos + 1)
      tmp
    }
```

## ここがすごい

- 空いている位置を 1 つずつ見ないで、ビットセットの `nextSetBit` で飛ばします。空きが多い配列でも、速く回れます。
- 次の位置を先に探しておくので、`hasNext` は位置を見るだけで答えられます。`hasNext` を何度呼んでも、探索は走りません。
- 要素を取り出すときに、次の位置を計算しておくという順番が、`Iterator` の約束を守る書き方になっています。
- 元の集合を変更しない限り、取り出しの順番は位置の順になります。同じ集合なら、毎回同じ順番で取り出せます。

## まとめ

- 配列を使う集合の走査は、使われている位置だけを飛ばして回ると速くなります。
- `Iterator` では、次の位置を先に探しておくと、`hasNext` が簡単になります。
- ビットセットと組み合わせると、疎な配列も無駄なく回せます。
