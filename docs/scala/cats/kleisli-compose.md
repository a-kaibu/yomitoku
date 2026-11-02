---
title: "後ろから前へつなぐ、Kleisli の合成"
description: "Cats の Kleisli.compose。Kleisli は「A を受け取り F[B] を返す関数」の箱。compose は前の処理を先に実行できるように、後ろに別の関数を足す。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Kleisli.scala"
lines: [103, 104]
format: 2
function: "Kleisli.compose"
difficulty: 2
tags: [関数型, 型システム, イディオム]
---

## ひとことで

Cats の `Kleisli[F, A, B]` は、「`A` を受け取って `F[B]` を返す関数」を包んだ箱です。`compose` は、この箱に対して「先に別の処理を行い、その結果を使う」ように、前側へ処理をつなぎ足します。`andThen` が後ろへつなぐのに対し、`compose` は前へつなぎます。

## コード

```scala:line-numbers=103
  def compose[Z, AA <: A](f: Z => F[AA])(implicit F: FlatMap[F]): Kleisli[F, Z, B] =
    Kleisli.shift((z: Z) => F.flatMap(f(z))(run))
```

## 前提知識

- `Kleisli[F, A, B]` は、`run: A => F[B]` を持つ箱です。`F` は効果（失敗や非同期など）を持つ型です。
- `andThen` は「この処理の後に、次の処理を続ける」操作です。`compose` は、その逆で「次の処理の前に、この処理をする」見方になります。
- `Kleisli.shift` は、関数 `A => F[B]` を `Kleisli` の箱に入れる関数です。
- `F.flatMap(f(z))(run)` は、`f(z)` の結果を `run` に渡す操作です。
- `Z` と `AA <: A` は型パラメータです。`AA <: A` は、`AA` が `A` の部分型であることを表します。

## 何をしているか

### 1. 前に置く関数 `f` の結果を、この `run` に渡す

`compose` は、新しい入り口 `z: Z` を受け取ります。まず `f(z)` を計算し、その結果を `flatMap` で `run` に渡します。`f` が先に動き、その結果が元の処理へ流れます。

```scala:line-numbers=103
  def compose[Z, AA <: A](f: Z => F[AA])(implicit F: FlatMap[F]): Kleisli[F, Z, B] =
    Kleisli.shift((z: Z) => F.flatMap(f(z))(run))
```

### 2. 別の `Kleisli` を合成するときは、順番を入れ替えて `andThen` を使う

2 つ目の `compose` は、`k.andThen(this)` と書いています。`k` を先に実行し、その後で `this` を続けます。前と後ろの関係を、`andThen` で言い換えているのです。

## ここがすごい

- 前側の処理を追加しても、後ろの `run` の中身は変えずに済みます。既存の処理を、そのまま再利用できます。
- 2 つ目の `compose` を `andThen` で書いているので、ひとつの仕組みで前後の両方を表せます。
- `flatMap` を使うので、前の処理が失敗（`None` や `Left`）なら、後ろの処理は動きません。
- 型パラメータで入り口の型を変えられるので、前の処理の型が合わなければ、コンパイル時にわかります。

## まとめ

- `compose` は、前に別の処理を置いて、その結果を `run` に流します。
- 前後の関係は `andThen` で言い換えられます。
- 失敗があれば、途中で止まるのが `flatMap` の性質です。
