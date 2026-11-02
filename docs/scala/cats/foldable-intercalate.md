---
title: "要素の間に区切りを入れて、1 つにまとめる"
description: "Cats の Foldable.intercalate。要素の間に区切りの値 a を入れながら、Monoid の結合で 1 つにまとめる。要素が 1 つもなければ単位元（empty）を返す。文字列の区切り結合などに使う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [855, 859]
format: 2
function: "Foldable.intercalate"
difficulty: 2
tags: [関数型, 標準ライブラリ, イディオム]
---

## ひとことで

Cats の `Foldable` にある `intercalate` は、列の要素と要素の間に区切りを入れて、1 つの値にまとめます。たとえば `List("a", "b", "c").intercalate(", ")` は、`"a, b, c"` のような文字列になります。要素がない場合は、単位元（空の値）を返します。

## コード

```scala:line-numbers=855
  def intercalate[A](fa: F[A], a: A)(implicit A: Monoid[A]): A =
    combineAllOption(fa)(using A.intercalate(a)) match {
      case None    => A.empty
      case Some(a) => a
    }
```

## 前提知識

- `Monoid` は、結合の操作と、その単位元（何と結合しても変わらない値）を持つ型の約束です。文字列なら連結と空文字列、数なら足し算と 0 がその例です。
- `intercalate` は、`Monoid` が持つ、区切りを入れた結合の方法を使います。
- `combineAllOption` は、列のすべての要素を結合して、`Option` で返す関数です。要素がなければ `None` になります。
- `None` のときは、単位元 `A.empty` を返します。空の列でも、型に合った結果が得られるようにするためです。
- `match` は、`Option` の `Some` と `None` を分けて、それぞれの値を返す書き方です。

## 何をしているか

### 1. 区切りを入れた結合の方法を用意する

`A.intercalate(a)` は、要素の間に区切り `a` を入れて結合する方法を作ります。この結合方法を `combineAllOption` に渡します。

```scala:line-numbers=856
    combineAllOption(fa)(using A.intercalate(a)) match {
```

### 2. 要素がなければ、単位元を返す

結果が `None` なら、要素が 1 つもなかったことになります。そのときは、型 `A` の単位元 `A.empty` を返します。

```scala:line-numbers=857
      case None    => A.empty
```

### 3. 要素があれば、まとめた値を返す

結果が `Some(a)` なら、区切りを入れてまとめた値を取り出して返します。

```scala:line-numbers=858
      case Some(a) => a
```

## ここがすごい

- 区切りを入れる処理と、要素を結合する処理を、1 つの `Monoid` の約束に任せています。文字列でも、リストでも、同じ関数で書けます。
- 空の列に対しても、単位元を返すので、呼び出し側は `None` の場合を個別に扱わずに済みます。
- 途中で区切りを 1 つずつ入れるので、要素の数が増えても、結合の順番は変わりません。
- 型の約束に基づいて動くので、新しい型に `Monoid` を用意すれば、同じ使い方がそのまま使えます。

## まとめ

- 区切りを入れて結合するには、区切りつきの結合の方法を作って、列に適用します。
- 空の列の結果は、型の単位元で返すと、呼び出し側が楽になります。
- 型の約束を使うと、文字列や数など、さまざまな値を同じ関数で扱えます。
