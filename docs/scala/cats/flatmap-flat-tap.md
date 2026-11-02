---
title: "効果を実行しても、元の値はそのまま返す"
description: "Cats の FlatMap.flatTap。値 a を受け取り、f(a) の効果を実行してから、元の a を返す。ログ出力や検証のように、値を変えずに途中で何かを行うときに使う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/FlatMap.scala"
lines: [174, 175]
format: 2
function: "FlatMap.flatTap"
difficulty: 1
tags: [関数型, イディオム, 型システム]
---

## ひとことで

Cats の `FlatMap` にある `flatTap` は、途中で効果つきの処理を行いながら、元の値を変えずに次へ渡します。例えば、値を使ってログを書いたり、検証をしたりしたいが、値そのものは変えたくないときに使います。

## コード

```scala:line-numbers=174
  def flatTap[A, B](fa: F[A])(f: A => F[B]): F[A] =
    flatMap(fa)(a => as(f(a), a))
```

## 前提知識

- `FlatMap[F]` は、前の計算の結果を使って次の計算をつなげる型の約束です。
- `f: A => F[B]` は、値 `a` を受け取って、効果つきの計算を返す関数です。結果の値 `B` は使わず、効果だけを実行します。
- `as(x, a)` は、効果 `x` を実行してから、その結果を捨てて `a` を返す操作です。
- `flatMap(fa)(...)` は、`fa` の値を取り出して次の関数に渡します。

## 何をしているか

### 1. 値 `a` を取り出し、効果 `f(a)` を実行する

`flatMap` で `a` を取り出し、`f(a)` の効果を実行します。その結果の値 `B` は、ここでは使いません。

```scala:line-numbers=175
    flatMap(fa)(a => as(f(a), a))
```

## ここがすごい

- 途中の効果を、元の値と切り離して書けます。ログや検証の処理が、値の流れに混ざりません。
- 効果の結果 `B` は捨てるので、どんな型の効果でも、同じ書き方で使えます。
- 元の値 `a` を、そのまま返すので、後ろの処理は、変わらない値を受け取れます。
- 効果が失敗すれば、`flatMap` によって全体が失敗になります。途中の検証にも使えます。

## まとめ

- `flatTap` は、効果を実行してから、元の値をそのまま返します。
- 中身は `as(f(a), a)` を `flatMap` で包んだ一行です。
- 値を変えずに途中で効果を挟みたいときに使います。
