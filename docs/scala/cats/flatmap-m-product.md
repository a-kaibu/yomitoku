---
title: "元の値と、その次の計算の結果を組にして残す"
description: "Cats の FlatMap.mproduct。fa の値 a を受け取り、f(a) の結果 b と組にして (a, b) を F の中に作る。元の値を捨てずに、次の計算を続けるときに使う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/FlatMap.scala"
lines: [137, 138]
format: 2
function: "FlatMap.mproduct"
difficulty: 1
tags: [関数型, イディオム, 型システム]
---

## ひとことで

Cats の `FlatMap` にある `mproduct` は、ある計算の結果 `a` を受け取り、次の計算 `f(a)` の結果 `b` と組にします。結果は `(a, b)` の形で `F` の中に入ります。`a` を捨てずに、後の処理でも使えるようにするための道具です。

## コード

```scala:line-numbers=137
  def mproduct[A, B](fa: F[A])(f: A => F[B]): F[(A, B)] =
    flatMap(fa)(a => map(f(a))((a, _)))
```

## 前提知識

- `FlatMap[F]` は、`flatMap` で次の計算をつなげる型の約束です。
- `F[A]` は、効果を持つ値です。例えば `Option[A]` や `List[A]` がこれにあたります。
- `f: A => F[B]` は、値 `a` を受け取って、次の効果つき計算を返す関数です。
- `map(f(a))((a, _))` は、`f(a)` の結果を `(a, b)` の組に変える操作です。`_` は、その結果の値を指します。
- 組（タプル）は、二つ以上の値をまとめて持つ型です。

## 何をしているか

### 1. 元の値 `a` を取り出し、次の計算 `f(a)` を続ける

`flatMap(fa)` は、`fa` の中の値 `a` を取り出して、次の関数に渡します。

```scala:line-numbers=138
    flatMap(fa)(a => map(f(a))((a, _)))
```

### 2. 結果の `b` を、元の `a` と組にして返す

`f(a)` の結果 `b` を `map` で受け取り、`(a, _)` の形で `a` と組にします。最後に、この組が `F` の中に入って返ります。

## ここがすごい

- 元の値 `a` を捨てずに、次の計算の結果と並べて持てます。`flatMap` だけだと、`a` は次の関数の中でしか使えません。
- `flatMap` と `map` だけで書けるので、どんな `FlatMap` の型にも同じ形で使えます。
- 結果が `F[(A, B)]` になるので、後で `a` と `b` の両方を使う処理に、そのまま渡せます。
- リストの例のように、要素ごとに候補を広げて、それぞれの組を作ることもできます。

## まとめ

- `mproduct` は、`a` と `f(a)` の結果 `b` を `(a, b)` の組にして、`F` の中に入れます。
- 中身は `flatMap` と `map` を組み合わせた一行です。
- 元の値を失わずに、次の計算の結果と並べられます。
