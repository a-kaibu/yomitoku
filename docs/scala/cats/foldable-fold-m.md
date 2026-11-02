---
title: "効果のある計算を、要素の順に繋ぎながら畳み込む"
description: "Cats の Foldable.foldM。畳み込みの各段で、Monad の中の計算（Option や IO など）を使う。Source と tailRecM で、要素を 1 つずつ取り出し、途中で失敗や停止があればそこで止まる。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [476, 484]
format: 2
function: "Foldable.foldM"
difficulty: 3
tags: [関数型, 再帰, 遅延評価]
---

## ひとことで

Cats の `Foldable` にある `foldM` は、普通の畳み込みに「効果」を持たせたものです。畳み込みの各段で、`Option` や `Either` や `IO` のような、続けて計算できる型の中の計算を行います。途中で `None` や `Left` が出ると、そこで止まります。

## コード

```scala:line-numbers=476
  def foldM[G[_], A, B](fa: F[A], z: B)(f: (B, A) => G[B])(implicit G: Monad[G]): G[B] = {
    val src = Foldable.Source.fromFoldable(fa)(using self)
    G.tailRecM((z, src)) { case (b, src) =>
      src.uncons match {
        case Some((a, src)) => G.map(f(b, a))(b => Left((b, src.value)))
        case None           => G.pure(Right(b))
      }
    }
  }
```

## 前提知識

- 畳み込み（fold）は、途中の結果と次の要素から新しい結果を作って、列を 1 つの値にまとめる操作です。
- モナド（`Monad`）は、計算を続けて行うための型の約束です。`flatMap` や `map` で、次の計算をつなげます。
- `G[B]` は、モナドの中に入った値です。たとえば `Option[Int]` や `Either[String, Int]` などです。
- `Source` は、要素を 1 つずつ取り出す、遅延した列です。`uncons` で先頭と残りを分けて取り出せます。
- `tailRecM` は、`Left` を返す限り同じ処理を続け、`Right` が返ったら結果にする関数です。

## 何をしているか

### 1. 要素を入れた列と、途中の結果の組を作る

`Foldable.Source.fromFoldable` で、要素の列を作ります。`tailRecM` の状態は、途中の結果 `b` と、残りの列 `src` の組です。

```scala:line-numbers=477
    val src = Foldable.Source.fromFoldable(fa)(using self)
    G.tailRecM((z, src)) { case (b, src) =>
```

### 2. 要素があれば、効果つきの関数で次の結果を作る

`uncons` で先頭の要素 `a` を取り出します。`f(b, a)` は、モナドの中に入った次の途中の結果を返します。`G.map` でその結果を `Left` に包み、残りの列と一緒に次の段へ渡します。

```scala:line-numbers=479
      src.uncons match {
        case Some((a, src)) => G.map(f(b, a))(b => Left((b, src.value)))
```

### 3. 要素が尽きたら、最後の結果を返す

列の先頭が取り出せなくなったら、途中の結果 `b` を `Right` に包んで `pure` で返します。`tailRecM` は、これで繰り返しを止めます。

```scala:line-numbers=481
        case None           => G.pure(Right(b))
```

## ここがすごい

- 効果を持つ計算を、ループや再帰を書かずに、モナドの約束だけで畳み込めます。
- 途中で `None` や `Left` が出ると、`G.map` や `flatMap` の仕組みで後続の計算が飛ばされます。自然に早く止まります。
- `tailRecM` を使うので、要素が多くても、関数の呼び出しの深さが増えません。
- 結果を `Foldable` の型の約束だけで書いているので、リストでも木でも同じ関数が動きます。

## まとめ

- 効果を持つ畳み込みは、途中の結果をモナドで包んで、次の段へつなぐと書けます。
- 途中で止まる条件は、モナドの型（`Option`、`Either` など）に任せると、分岐を書かずに済みます。
- 要素の列を遅延させて持つと、止まった後の要素を無駄に読みません。
