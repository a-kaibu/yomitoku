---
title: "効果つきの計算を、左から順に畳み込む"
description: "Cats の Reducible.reduceLeftM。最初の要素を効果つきの値に変え、残りの要素を flatMap で順にたたみ込む。途中で効果が失敗すれば、そこで全体が止まる。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Reducible.scala"
lines: [120, 121]
format: 2
function: "Reducible.reduceLeftM"
difficulty: 2
tags: [関数型, エラー処理, イディオム]
---

## ひとことで

Cats の `Reducible` は、必ず一つ以上の要素を持つ集まりの約束です。`reduceLeftM` は、要素を左から順に、効果つきの計算でまとめます。効果つきとは、`Option` や `Either` のように、失敗や途中の状態を値の中に持つ型のことです。

## コード

```scala:line-numbers=120
  def reduceLeftM[G[_], A, B](fa: F[A])(f: A => G[B])(g: (B, A) => G[B])(implicit G: FlatMap[G]): G[B] =
    reduceLeftTo(fa)(f)((gb, a) => G.flatMap(gb)(g(_, a)))
```

## 前提知識

- `FlatMap[G]` は、前の計算の結果を使って次の効果つき計算をつなげる型の約束です。
- `G[B]` は、効果 `G` を持つ `B` の値です。例えば `Option[Int]` や `Either[String, Int]` がこれにあたります。
- `reduceLeftTo` は、最初の要素を変換して初期値にし、残りを順に加える操作です。ここでは、その加える関数が効果つきになっています。
- `G.flatMap(gb)(g(_, a))` は、前の結果 `gb` が取り出せたときだけ、次の計算 `g` を続ける操作です。
- 「モナディック版（Monadic variant）」は、効果つきの計算を扱うバージョンという意味です。

## 何をしているか

### 1. 最初の要素を効果つきの値にし、残りを `flatMap` で順に足す

`reduceLeftTo` に、最初の要素の変換 `f` を渡します。残りの要素では、前の結果 `gb` を `flatMap` で取り出し、そこに `g(_, a)` を続けます。

```scala:line-numbers=121
    reduceLeftTo(fa)(f)((gb, a) => G.flatMap(gb)(g(_, a)))
```

## ここがすごい

- 途中の計算が失敗（`None` や `Left`）すれば、`flatMap` によって、残りの計算は行われず全体が失敗になります。
- 効果の扱いを `flatMap` の一箇所に任せるので、`reduceLeft` の処理をそのまま効果つきにできます。
- 空の集まりを扱わないので、初期値の効果を用意する必要がありません。
- `G` の型の約束だけで書かれているので、`Option`、`Either`、`IO` など、どんな効果でも同じ形で使えます。

## まとめ

- `reduceLeftM` は、効果つきの計算を左から順に組み合わせて、一つにまとめます。
- 途中で失敗すれば、そこで全体が止まります。
- 中身は `reduceLeftTo` と `flatMap` を組み合わせた一行です。
