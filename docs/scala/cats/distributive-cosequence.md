---
title: "外側と内側の入れ子を、ひっくり返して並べ直す"
description: "Cats の Distributive.cosequence。F の中の G を、G の中の F へ入れ替える。関数を使わず、恒等関数 identity を distribute に渡すだけで書ける。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Distributive.scala"
lines: [34, 34]
format: 2
function: "Distributive.cosequence"
difficulty: 2
tags: [関数型, 型システム, ジェネリクス]
---

## ひとことで

Cats の `Distributive` は、「入れ子の型を、順番を変えて持ち直す」操作を表す型の約束です。`cosequence` は、`G[F[A]]` を `F[G[A]]` に入れ替えます。例えば「リストの中の選択肢」を、「選択肢の中のリスト」に変えるときに使います。

## コード

```scala:line-numbers=34
  def cosequence[G[_]: Functor, A](ga: G[F[A]]): F[G[A]] = distribute(ga)(identity)
```

## 前提知識

- `Functor[F]` は、中の値に関数を当てられる型の約束です。`map` を持ちます。
- `G[F[A]]` は、`G` の中に `F` の値が入り、その中に `A` が入った型です。例えば `List[Option[Int]]` がこれにあたります。
- `distribute` は、`G[A]` の各要素に `A => F[B]` の関数を当てて、結果の `F` を外へ出す操作です。
- `identity` は、受け取った値をそのまま返す関数です。`x => x` と同じ意味です。
- 型パラメータ `G[_]: Functor` は、`G` が `map` できるという条件を、暗黙の引数として付けています。

## 何をしているか

### 1. `cosequence` は、`distribute` に恒等関数を渡すだけ

`ga` の中の各要素は、すでに `F[A]` の形をしています。その要素をそのまま取り出す `identity` を `distribute` に渡せば、外側と内側が入れ替わります。

```scala:line-numbers=34
  def cosequence[G[_]: Functor, A](ga: G[F[A]]): F[G[A]] = distribute(ga)(identity)
```

## ここがすごい

- 入れ替えの処理を、新しく書いていません。汎用の `distribute` を、関数 `identity` で特殊化しているだけです。
- 「どの型をどう並べ直すか」は、`Distributive` の型の約束で保証されます。実装ごとに、同じ規則で動きます。
- 恒等関数を渡すという一行で、入れ替えの意図が伝わります。読み手は、`distribute` を理解すれば済みます。
- 型の上での入れ替えなので、入れ子のデータを扱う関数を、型に合わせて組み立てやすくなります。

## まとめ

- `cosequence` は、`G[F[A]]` を `F[G[A]]` に入れ替えます。
- 中身は `distribute(ga)(identity)` の一行です。
- 入れ子の順番を変える操作を、`identity` を使って汎用の `distribute` から導いています。
