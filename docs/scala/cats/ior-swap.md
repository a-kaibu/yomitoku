---
title: "左と右を入れ替えて、Ior の意味を反転する"
description: "Cats の Ior.swap。Ior は左、右、または両方を持つ型。swap は左と右を入れ替える。fold を使い、両方持つ場合は組の順番を入れ替えて Both を作り直す。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Ior.scala"
lines: [503, 503]
format: 2
function: "Ior.swap"
difficulty: 1
tags: [型システム, 関数型, イディオム]
---

## ひとことで

Cats の `Ior[A, B]` は、`A` だけ、`B` だけ、または `A` と `B` の両方を持つ型です。`swap` は、`Ior[A, B]` を `Ior[B, A]` に変えます。左と右の役割を入れ替えたいときに使います。

## コード

```scala:line-numbers=503
  final def swap: B Ior A = fold(Ior.right, Ior.left, (a, b) => Ior.both(b, a))
```

## 前提知識

- `Ior` の値には 3 種類あります。`Left(a)` は左だけ、`Right(b)` は右だけ、`Both(a, b)` は両方です。
- `Ior.left`、`Ior.right`、`Ior.both` は、それぞれの値を作る関数です。
- `fold` は、3 種類のどれかに応じて、それぞれ別の関数を呼ぶ操作です。
- `B Ior A` は、`Ior[B, A]` を中置記法で書いた形です。型の並びが入れ替わることを示しています。
- `fold(fa, fb, fab)` の 3 つの関数は、左の場合、右の場合、両方の場合にそれぞれ呼ばれます。

## 何をしているか

### 1. 3 つの場合に、それぞれ入れ替えた値を作る関数を渡す

`fold` の 1 つ目と 2 つ目の引数は、左だけ、右だけの場合です。左だけだった値は右に、右だけだった値は左に移します。3 つ目は両方の場合で、組の順番を変えて `Ior.both(b, a)` を作り直します。

```scala:line-numbers=503
  final def swap: B Ior A = fold(Ior.right, Ior.left, (a, b) => Ior.both(b, a))
```

## ここがすごい

- 3 種類の場合分けを、`fold` 一つにまとめています。`match` を書かなくても、全部の場合を網羅しています。
- 左と右を入れ替えるだけなので、型は `Ior[A, B]` から `Ior[B, A]` へ正しく変わります。
- 両方の場合でも、情報を捨てずに組を作り直します。入れ替えの前後で、持っている値が変わりません。
- 同じ `fold` を使う `toEither` や `pad` なども、この仕組みで書けます。

## まとめ

- `swap` は、`Ior[A, B]` を `Ior[B, A]` に変え、左と右の役割を入れ替えます。
- 中身は `fold` 一つで、3 つの場合をそれぞれ書いています。
- 両方を持つ場合は、組の順番を変えて作り直します。
