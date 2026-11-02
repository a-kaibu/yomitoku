---
title: "重複を消すが、最初に出た順番は残す"
description: "Cats の NonEmptyList.distinctBy。先頭から順に、変換したキーが初めて出たものだけを残す。TreeSet の add が「新しかったか」を返すことを使う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/NonEmptyList.scala"
lines: [389, 408]
format: 2
function: "NonEmptyList.distinctBy"
difficulty: 3
tags: [データ構造, ソート, 関数型]
---

## ひとことで

Cats の `NonEmptyList` は、要素が必ず 1 つ以上ある非空のリストです。`distinctBy` は、キーを変換した結果で重複を消します。先頭から順に見て、同じキーが初めて出たときだけ残すので、残った要素の順番は元と同じです。

## コード

```scala:line-numbers=389
  override def distinctBy[B](f: A => B)(implicit O: Order[B]): NonEmptyList[A] = {
    if (tail.isEmpty) this
    else {
      implicit val ord: Ordering[B] = O.toOrdering

      val bldr = List.newBuilder[A]
      val seen = mutable.TreeSet.empty[B]
      var rest = tail
      seen.add(f(head))
      while (rest.nonEmpty) {
        val next = rest.head
        rest = rest.tail
        if (seen.add(f(next))) {
          bldr += next
        }
      }

      NonEmptyList(head, bldr.result())
    }
  }
```

## 前提知識

- `NonEmptyList[A]` は、先頭の `head` と、残りの `tail` からなるリストです。空にはならないので、先頭を安全に取り出せます。
- `f: A => B` は、要素からキーを取り出す関数です。例えば、名前からその長さを取り出す関数などです。
- `Order[B]` は、2 つの `B` を比べる方法の約束です。`toOrdering` で、標準の `Ordering` に変えられます。
- `mutable.TreeSet` は、順番に並んだ集合です。`add` は、その値をまだ持っていなければ入れて `true` を返し、すでに持っていれば `false` を返します。
- `ListBuilder`（`List.newBuilder`）は、末尾に要素を足して、最後にリストを作る道具です。

## 何をしているか

### 1. 要素が 1 つだけなら、そのまま返す

`tail` が空なら、重複があり得ないので `this` を返します。

```scala:line-numbers=390
    if (tail.isEmpty) this
```

### 2. 先頭のキーを集合に入れてから、残りを順に見る

先頭のキーを `seen` に入れておきます。その後、`tail` を先頭から一つずつ取り出して、キーを求めます。

```scala:line-numbers=397
      seen.add(f(head))
      while (rest.nonEmpty) {
        val next = rest.head
        rest = rest.tail
```

### 3. `add` が `true` のときだけ、結果に足す

`seen.add(f(next))` が `true` なら、そのキーは初めて現れたものです。そのときだけ `bldr` に要素を足します。重複なら何もしません。

```scala:line-numbers=401
        if (seen.add(f(next))) {
          bldr += next
        }
```

### 4. 先頭と、残った要素をまとめてリストにする

最後に、先頭 `head` と、ビルダーの結果を `NonEmptyList` にまとめて返します。先頭は必ず残るので、空になることはありません。

```scala:line-numbers=406
      NonEmptyList(head, bldr.result())
```

## ここがすごい

- `add` の戻り値を、重複の判定に使っています。「入れてみて、入ったかで判断」するので、探す処理と追加する処理が 1 回で済みます。
- 結果の順番は、元のリストの先頭から見た順番です。初めて現れた要素が残るので、直感どおりの結果になります。
- 先頭を別に扱うことで、空のリストを作る心配がなくなっています。`NonEmptyList` の約束を、そのまま守っています。
- 比べ方は `Order` から受け取るので、どんな型のキーでも同じ仕組みで重複を消せます。

## まとめ

- `distinctBy` は、キーが初めて現れた要素だけを、元の順番で残します。
- `TreeSet.add` の戻り値で、重複かどうかを判定しています。
- 先頭を必ず残すことで、結果も非空のまま保たれます。
