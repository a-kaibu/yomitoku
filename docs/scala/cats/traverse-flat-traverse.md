---
title: "結果がネストした効果を、一段だけ平らにして集める"
description: "Cats の Traverse.flatTraverse。各要素を G[F[B]] に変えて集め、traverse の結果の F[G[..]] を flatten で一段にする。Option の中の List など、二重の入れ子を扱う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Traverse.scala"
lines: [90, 91]
format: 2
function: "Traverse.flatTraverse"
difficulty: 2
tags: [関数型, 型システム, イディオム]
---

## ひとことで

Cats の `Traverse` は、リストなどの要素それぞれに効果つきの処理をかけて、全体を集める型の約束です。`flatTraverse` は、各要素の処理が「さらに中に `F` を持つ」場合に使います。集めた後で、二重になった `F` を一段にまとめます。

## コード

```scala:line-numbers=90
  def flatTraverse[G[_], A, B](fa: F[A])(f: A => G[F[B]])(implicit G: Applicative[G], F: FlatMap[F]): G[F[B]] =
    G.map(traverse(fa)(f))(F.flatten)
```

## 前提知識

- `F[A]` は、要素の集まりを表す型です。例えば `List[A]` がこれにあたります。
- `G[_]` は効果を表す型です。`Option` や `Either` などがあります。
- `G[F[B]]` は、効果 `G` の中に、さらに `F` の値が入っている形です。例えば `Option[List[Int]]` がこれにあたります。
- `traverse` は、要素ごとの処理を行い、結果を `G[F[B]]` の形で集めます。
- `F.flatten` は、`F[F[B]]` を `F[B]` に一段まとめる操作です。`FlatMap` が必要です。

## 何をしているか

### 1. 各要素に処理をかけて、結果を `G` の中に集める

`traverse(fa)(f)` は、各要素に `f` をかけて、結果を `G` の中で集めます。各要素の結果が `G[F[B]]` なので、全体は `G[F[F[B]]]` になり、`F` が二重に入ってしまいます。

```scala:line-numbers=91
    G.map(traverse(fa)(f))(F.flatten)
```

## ここがすごい

- 各要素の処理が `G[F[B]]` を返すとき、ふつうの `traverse` で集めると `F` が二重に残ってしまいます。`flatTraverse` は、その二重を一段にまとめてくれます。
- `G.map` の中で `F.flatten` を使うので、効果 `G` の中で一段にまとめる処理が、一箇所で完結します。
- `f` の型が `A => G[F[B]]` と決まっているので、要素ごとの処理の形が型で分かります。
- 引数の `F` と `G` の両方に約束（`FlatMap` と `Applicative`）が必要です。どちらが欠けてもコンパイルが通りません。

## まとめ

- `flatTraverse` は、集めた結果 `G[F[F[B]]]` の二重の `F` を、`F.flatten` で一段にまとめます。
- 中身は `traverse` の結果を `map` して、`F.flatten` を当てているだけです。
- 二重の入れ子を扱う、よくある形を一つの関数にまとめた道具です。
