---
title: "再帰を深くせず、ループを作る tailRecM の既定実装"
description: "Cats の StackSafeMonad.tailRecM。結果が Left の間は同じ処理を繰り返し、Right になったら値を返す。flatMap が安全なモナドなら、この 1 行で繰り返しを書ける。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/StackSafeMonad.scala"
lines: [36, 40]
format: 2
function: "StackSafeMonad.tailRecM"
difficulty: 2
tags: [関数型, 再帰, イディオム]
---

## ひとことで

Cats の `StackSafeMonad` は、`tailRecM` の実装をあらかじめ用意した混ぜ物（mix-in）です。`tailRecM` は「結果が `Left` の間は同じ処理を繰り返し、`Right` になったら終わる」ループを、モナドの中で書くための関数です。`flatMap` が安全なモナドなら、この実装を継承するだけで済みます。

## コード

```scala:line-numbers=36
  override def tailRecM[A, B](a: A)(f: A => F[Either[A, B]]): F[B] =
    flatMap(f(a)) {
      case Left(a)  => tailRecM(a)(f)
      case Right(b) => pure(b)
    }
```

## 前提知識

- `Monad[F]` は、値を包む `pure` と、次の計算をつなぐ `flatMap` を持つ型の約束です。
- `Either[A, B]` の `Left(a)` は「まだ続ける」、`Right(b)` は「終わり」の印として使われます。
- `tailRecM` は、`A => F[Either[A, B]]` の形の関数 `f` を受け取り、最後に `F[B]` を返します。
- 混ぜ物（トレイト）は、クラスに機能を足す仕組みです。`extends StackSafeMonad[F]` と書くと、そのメソッドを継承できます。
- 「スタックセーフ」とは、関数の再帰呼び出しが積み重なって、スタックが溢れないことを指します。

## 何をしているか

### 1. 現在の値 `a` に関数 `f` を適用する

`tailRecM` は、まず `f(a)` を計算します。これは `F[Either[A, B]]` の形の値です。

```scala:line-numbers=37
    flatMap(f(a)) {
```

### 2. `Left` なら、次の値で同じ `tailRecM` を呼び直す

結果が `Left(a)` のときは、まだ終わっていません。新しい `a` を使って、同じ `tailRecM` をもう一度呼びます。この呼び出しは `flatMap` の中で行われます。

```scala:line-numbers=38
      case Left(a)  => tailRecM(a)(f)
```

### 3. `Right` なら、その値を `pure` で包んで終わる

結果が `Right(b)` のときは、答えが決まりました。`pure(b)` で `F[B]` に包んで返します。

```scala:line-numbers=39
      case Right(b) => pure(b)
```

## ここがすごい

- 繰り返しの仕組みを、`flatMap` と `Either` の組み合わせだけで表しています。ループ用の特別な構文は使っていません。
- 実装は数行で、どのモナドにも同じ形で使えます。モナドごとに `tailRecM` を書き直す手間が省けます。
- `flatMap` が呼び出しを積み重ねない型（例えば評価を後回しにする型）なら、繰り返しが深くなってもスタックは溢れにくくなります。
- 継承する前提として「flatMap が安全」という条件を、トレイトのコメントで明記しています。安全でないモナドに使うと危険なので、使う側がその条件を確かめる必要があります。

## まとめ

- `tailRecM` は、`Left` の間は繰り返し、`Right` で終わるループです。
- 実装は `flatMap` の結果を `Left` と `Right` で分けて、必要なら自分自身を呼び直すだけです。
- 継承するのは、`flatMap` がスタックを使わないと確かなモナドに限ります。
