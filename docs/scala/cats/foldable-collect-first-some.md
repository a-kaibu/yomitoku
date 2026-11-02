---
title: "最初に値が出た時点で、残りを見ずに止める"
description: "Cats の Foldable.collectFirstSome。要素を順に f で変換し、最初に Some が出たところで止めて、その中身を返す。Iterator を使い、残りの要素の変換は行わない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [357, 361]
format: 2
function: "Foldable.collectFirstSome"
difficulty: 2
tags: [イテレータ, 関数型, 遅延評価]
---

## ひとことで

Cats の `Foldable` にある `collectFirstSome` は、中の要素を順に変換して、最初に `Some` になった値を返します。`Some` が出た時点で止まるので、残りの要素は変換されません。全部が `None` なら `None` を返します。

## コード

```scala:line-numbers=357
  def collectFirstSome[A, B](fa: F[A])(f: A => Option[B]): Option[B] = {
    val maybeEmpty = toIterable(fa).iterator.map(f).dropWhile(_.isEmpty)
    if (maybeEmpty.hasNext) maybeEmpty.next()
    else None
  }
```

## 前提知識

- `Option` は、値がある `Some(x)` と、値がない `None` のどちらかを持つ型です。
- `Iterator` は、要素を 1 つずつ取り出す仕組みです。`next()` で次の要素を取り、`hasNext` で続きがあるかを確かめます。
- `toIterable(fa)` は、`Foldable` の中身を `Iterable` として取り出します。
- `map(f)` は、取り出すたびに `f` を適用する変換です。`Iterator` では、取り出されるまで `f` は呼ばれません。
- `dropWhile(_.isEmpty)` は、先頭から `None` が続く間だけ、その要素を捨てる操作です。

## 何をしているか

### 1. 変換を遅延させたまま、`None` を読み飛ばす

まず、中身の Iterator に `f` を適用し、`dropWhile` で先頭の `None` を捨てます。`Iterator` は遅延評価なので、この時点ではまだ `f` は要素の数だけ呼ばれていません。

```scala:line-numbers=358
    val maybeEmpty = toIterable(fa).iterator.map(f).dropWhile(_.isEmpty)
```

### 2. 次の要素があれば、それが答え

`hasNext` で続きがあるかを確かめます。`dropWhile` の後の最初の要素は、`Some` のはずです。その `Some` を `next()` で取り出して返します。

```scala:line-numbers=359
    if (maybeEmpty.hasNext) maybeEmpty.next()
```

### 3. 残りが無ければ、`None`

続きが無ければ、すべての要素が `None` だったことになります。そのときは `None` を返します。

```scala:line-numbers=360
    else None
```

## ここがすごい

- `Iterator` は必要になるまで変換しないので、最初の `Some` の後の要素は `f` が呼ばれません。重い変換でも、無駄な計算が起きません。
- 「最初に当たった値」を、特別なループを書かずに、`dropWhile` と `hasNext` の組み合わせで表しています。
- `Foldable` の型の約束だけで動くので、リストでも木でも同じ書き方になります。
- 戻り値が `Option` なので、見つからない場合を例外ではなく型で表せます。

## まとめ

- 最初に当たった値だけ欲しいときは、`Iterator` の遅延評価を使うと、残りの計算を省けます。
- `dropWhile` で先頭の空を捨てると、最初の値を簡単に取り出せます。
- 結果を `Option` で返すと、見つからない場合も安全に扱えます。
