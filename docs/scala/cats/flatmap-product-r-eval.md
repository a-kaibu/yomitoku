---
title: "次の計算を、必要になるまで評価しない形で続ける"
description: "Cats の FlatMap.productREval。前の計算 fa が終わってから、Eval に包まれた次の計算 fb を取り出して実行する。fa が失敗すれば、fb は評価されない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/FlatMap.scala"
lines: [75, 75]
format: 2
function: "FlatMap.productREval"
difficulty: 2
tags: [遅延評価, 関数型, イディオム]
---

## ひとことで

Cats の `FlatMap` にある `productREval` は、前の計算 `fa` の後に、次の計算 `fb` を続けます。`fb` は `Eval` という「必要になるまで計算しない箱」で渡されます。前の計算が途中で失敗したら、次の計算は一度も評価されません。

## コード

```scala:line-numbers=75
  def productREval[A, B](fa: F[A])(fb: Eval[F[B]]): F[B] = flatMap(fa)(_ => fb.value)
```

## 前提知識

- `FlatMap[F]` は、前の計算の結果を使って次の計算をつなげる型の約束です。
- `Eval[F[B]]` は、`F[B]` の計算を、値が必要になるまで遅らせる箱です。`value` を呼んだときに初めて計算されます。
- `productR` は、前の結果を捨てて、後ろの計算の結果を返す操作です。`R` は右側の値を残すという意味です。
- `_ => fb.value` は、前の値を使わずに、`fb` の値を取り出す関数です。

## 何をしているか

### 1. 前の計算 `fa` の値を捨てて、次の計算の値を取り出す

`flatMap(fa)` は、`fa` の値を取り出します。その値は使わず、`fb.value` を呼んで次の計算を実行します。`fb` は、ここで初めて評価されます。

```scala:line-numbers=75
  def productREval[A, B](fa: F[A])(fb: Eval[F[B]]): F[B] = flatMap(fa)(_ => fb.value)
```

## ここがすごい

- 次の計算を `Eval` で渡すことで、前の計算が失敗すれば、`fb.value` は呼ばれません。無駄な計算をしないのが保証されます。
- 次の計算が重い（時間がかかる、大きな計算をする）ときに、必要なときだけ実行できます。
- 前の値を捨てる形を、`flatMap` 一つで書けます。新しい仕組みを足さずに済みます。
- `FlatMap` の約束だけで書かれているので、`Option`、`Either`、`IO` など、どの型にも同じ形で使えます。

## まとめ

- `productREval` は、前の計算の値を捨てて、`Eval` で遅らせた次の計算を実行します。
- 前の計算が失敗すれば、次の計算は評価されません。
- 中身は `flatMap(fa)(_ => fb.value)` の一行です。
