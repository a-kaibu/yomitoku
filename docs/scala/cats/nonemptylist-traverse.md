---
title: "先頭と残りを、同じ効果つきの流れで集める"
description: "Cats の NonEmptyList.traverse。先頭の要素に f を当てた結果と、残りの traverse の結果を map2Eval で組み合わせる。残りは Always で包み、効果の順番を先頭から保つ。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/NonEmptyList.scala"
lines: [361, 362]
format: 2
function: "NonEmptyList.traverse"
difficulty: 3
tags: [関数型, 遅延評価, イディオム]
---

## ひとことで

Cats の `NonEmptyList` を、効果つき（`Option` や `Either` など）の関数で変換して、全体を集めます。`traverse` は、各要素に `f` を当てて、結果を `G` の中の `NonEmptyList` にまとめます。どれか一つでも失敗すれば、全体が失敗になります。

## コード

```scala:line-numbers=361
  def traverse[G[_], B](f: A => G[B])(implicit G: Applicative[G]): G[NonEmptyList[B]] =
    G.map2Eval(f(head), Always(Traverse[List].traverse(tail)(f)))(NonEmptyList(_, _)).value
```

## 前提知識

- `G[_]` は効果を表す型です。`Applicative[G]` は、その効果を組み合わせるための約束です。
- `f: A => G[B]` は、要素を効果つきの値に変える関数です。
- `map2Eval(x, y)(g)` は、二つの効果つきの値を組み合わせる操作です。`y` は `Eval` の形で遅らせて渡せます。
- `Always(...)` は、必要になるたびに計算する `Eval` の箱です。ここでは、残りの `traverse` を遅らせるために使われています。
- `value` は、`Eval` に入った計算を実行して、結果を取り出す操作です。

## 何をしているか

### 1. 先頭の要素に `f` を当て、残りの `traverse` を遅らせて組にする

先頭 `head` には `f` を当てます。残りの `tail` は、`Traverse[List].traverse` で全体を集めます。その計算は `Always` で包まれ、結果を `value` で取り出すときに実行されます。

```scala:line-numbers=362
    G.map2Eval(f(head), Always(Traverse[List].traverse(tail)(f)))(NonEmptyList(_, _)).value
```

## ここがすごい

- 先頭の効果を先に、残りの効果をその後に組み立てるので、効果の順番が先頭から保たれます。
- 残りの計算が `Always` の箱に入っているので、組み立てる処理と、実行する処理が分かれています。
- 結果は `NonEmptyList[B]` なので、非空という約束が、効果の中でもそのまま保たれます。
- 一行に収まる短い実装で、リストの `traverse` と組み合わせて、全体の処理を作っています。

## まとめ

- `traverse` は、先頭に `f` を当て、残りの `traverse` を遅らせて組み合わせます。
- 効果の順番は先頭から保たれ、結果は `G` の中で一つの `NonEmptyList` にまとまります。
- 結果は `G[NonEmptyList[B]]` で、非空のまま集められます。
