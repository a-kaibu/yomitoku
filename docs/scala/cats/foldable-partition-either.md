---
title: "結果を Left と Right に振り分け、それぞれ集める"
description: "Cats の Foldable.partitionEither。各要素を Either に変え、Left の値を一方の集まりに、Right の値をもう一方の集まりに振り分ける。空の値と pure を Monoid として使う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [795, 805]
format: 2
function: "Foldable.partitionEither"
difficulty: 3
tags: [関数型, エラー処理, 型システム]
---

## ひとことで

Cats の `Foldable` は、要素の集まりをたたみ込める型の約束です。`partitionEither` は、各要素に `Either` を返す関数を当て、`Left` の値と `Right` の値を、二つの別々の集まりに振り分けます。失敗と成功の結果を、一度の走査で分けたいときに使います。

## コード

```scala:line-numbers=795
  def partitionEither[A, B, C](fa: F[A])(f: A => Either[B, C])(implicit A: Alternative[F]): (F[B], F[C]) = {
    implicit val mb: Monoid[F[B]] = A.algebra[B]
    implicit val mc: Monoid[F[C]] = A.algebra[C]

    foldMap(fa)(a =>
      f(a) match {
        case Right(c) => (A.empty[B], A.pure(c))
        case Left(b)  => (A.pure(b), A.empty[C])
      }
    )
  }
```

## 前提知識

- `Either[B, C]` は、`Left(b)` か `Right(c)` のどちらかを持つ型です。慣習として、`Right` を成功、`Left` を失敗に使います。
- `Alternative[F]` は、空の値 `empty` と、値を包む `pure` を持つ型の約束です。`Option` や `List` が該当します。
- `Monoid` は、空の値と、二つをまとめる操作を持つ型の約束です。`foldMap` の結果を集めるのに使われます。
- `foldMap` は、各要素を値に変えて、すべての結果をまとめる操作です。
- `(F[B], F[C])` は、二つの集まりを組にした値です。

## 何をしているか

### 1. Monoid の集まりの作り方を、二つ用意する

`F[B]` と `F[C]` の集まりを結合するための方法を、`A.algebra` から受け取ります。これで `foldMap` が二つの集まりを作れるようになります。

```scala:line-numbers=796
    implicit val mb: Monoid[F[B]] = A.algebra[B]
    implicit val mc: Monoid[F[C]] = A.algebra[C]
```

### 2. `Right` なら、右側に値を入れ、左側は空にする

`f(a)` が `Right(c)` のとき、`(A.empty[B], A.pure(c))` を返します。左の集まりは空、右の集まりに `c` が一つ入ります。

```scala:line-numbers=801
        case Right(c) => (A.empty[B], A.pure(c))
```

### 3. `Left` なら、左側に値を入れ、右側は空にする

`Left(b)` のときは、`(A.pure(b), A.empty[C])` を返します。左の集まりに `b` が入り、右は空です。

```scala:line-numbers=802
        case Left(b)  => (A.pure(b), A.empty[C])
```

### 4. 全要素の結果を `foldMap` でまとめる

最後に、この振り分けを `foldMap` で全要素に当てます。二つの集まりが、それぞれ要素の順に結合されて返ります。

```scala:line-numbers=799
    foldMap(fa)(a =>
      f(a) match {
        case Right(c) => (A.empty[B], A.pure(c))
        case Left(b)  => (A.pure(b), A.empty[C])
      }
    )
```

## ここがすごい

- 一回の走査で、成功と失敗を振り分けられます。要素を二回読んで、それぞれ絞り込む必要がありません。
- 空の値 `empty` と `pure` で、振り分けの片方が自然に空になります。特別な場合分けを書かずに済みます。
- 結果の集まりは、元の順番を保ったまま結合されます。Left の値も Right の値も、出てきた順に並びます。
- 型 `Alternative` の約束だけで書かれているので、`Option` でも `List` でも同じ形で使えます。

## まとめ

- `partitionEither` は、`Either` の結果を、Left の集まりと Right の集まりに振り分けます。
- 各要素では、片方に `pure`、もう片方に `empty` を入れて、`foldMap` でまとめます。
- 一度の走査で、二つの集まりを順番どおりに作れます。
