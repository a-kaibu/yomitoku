---
title: "効果つきの要素を順に実行し、結果の値は捨てる"
description: "Cats の Foldable.sequenceVoid。G[A] の要素を順番に実行して、すべてが成功したかどうかだけを G[Unit] として返す。途中で失敗があれば、その時点で失敗になる。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [623, 624]
format: 2
function: "Foldable.sequenceVoid"
difficulty: 1
tags: [関数型, エラー処理, イディオム]
---

## ひとことで

Cats の `Foldable` は、要素の集まりをたたみ込める型の約束です。`sequenceVoid` は、要素が効果つき（`Option` や `IO` など）の値の集まりのとき、それらを順に実行します。結果の値は捨てて、すべて成功したかどうかだけを `G[Unit]` で返します。

## コード

```scala:line-numbers=623
  def sequenceVoid[G[_]: Applicative, A](fga: F[G[A]]): G[Unit] =
    traverseVoid(fga)(identity)
```

## 前提知識

- `F[G[A]]` は、要素が効果 `G` を持つ集まりです。例えば `List[Option[Int]]` がこれにあたります。
- `Applicative[G]` は、値を包む `pure` と、効果つきの計算を組み合わせる機能を持つ型の約束です。
- `Unit` は、値を持たないことを表す型です。`G[Unit]` は、結果の値を捨てた効果つきの値です。
- `traverseVoid` は、各要素に関数を当てて、結果の値を捨てて集める操作です。
- `identity` は、受け取った値をそのまま返す関数です。ここでは、各要素がもともと `G[A]` なので、そのまま使えます。

## 何をしているか

### 1. 各要素を、そのまま `traverseVoid` に渡す

`identity` を関数として渡すことで、各要素 `G[A]` をそのまま順に実行します。結果の値 `A` は、最後には使われません。

```scala:line-numbers=624
    traverseVoid(fga)(identity)
```

## ここがすごい

- 要素の値を取り出さずに、効果だけを順に実行できます。「全部成功したか」を確かめたいときに、便利な形です。
- 途中で一つでも失敗（`None` など）があれば、全体が失敗になります。ドキュメントの例では、`Option` の `None` が一つあるだけで `None` になります。
- 関数 `identity` で `traverseVoid` を特殊化しているので、新しい処理を書かずに済みます。
- `G` の型の約束だけで書かれているので、`Option`、`Either`、`IO` など、どんな効果でも同じ形で使えます。

## まとめ

- `sequenceVoid` は、効果つきの要素を順に実行し、結果の値は捨てて `G[Unit]` を返します。
- 一つでも失敗があれば、全体が失敗になります。
- 中身は `traverseVoid(fga)(identity)` の一行で、値を取り出さずに効果だけを扱います。
