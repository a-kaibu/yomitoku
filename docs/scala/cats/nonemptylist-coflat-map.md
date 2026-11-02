---
title: "各要素から見た、残りのリスト全体を計算する"
description: "Cats の NonEmptyList.coflatMap。各位置を先頭として、そこから末尾までのリストを作り、f に渡す。先頭から見た全体と、各位置から見た残りを一度にたどる。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/NonEmptyList.scala"
lines: [364, 374]
format: 2
function: "NonEmptyList.coflatMap"
difficulty: 3
tags: [関数型, イテレータ, 再帰]
---

## ひとことで

Cats の `NonEmptyList` は、必ず一つ以上の要素を持つリストです。`coflatMap` は、各位置を「先頭」とみなし、そこから末尾までのリストを作ってから、関数 `f` に渡します。その結果を、位置ごとに並べたリストを返します。`[1, 2, 3]` なら、`[1, 2, 3]`、`[2, 3]`、`[3]` の三つを順に `f` に渡します。

## コード

```scala:line-numbers=364
  def coflatMap[B](f: NonEmptyList[A] => B): NonEmptyList[B] = {
    val buf = ListBuffer.empty[B]
    @tailrec def consume(as: List[A]): List[B] =
      as match {
        case Nil     => buf.toList
        case a :: as =>
          buf += f(NonEmptyList(a, as))
          consume(as)
      }
    NonEmptyList(f(this), consume(tail))
  }
```

## 前提知識

- `NonEmptyList(head, tail)` は、先頭と残りを持つリストです。空にはならないので、先頭を安全に取り出せます。
- `ListBuffer` は、末尾に要素を足していける可変のリストです。最後に `toList` で不変のリストにします。
- `@tailrec` は、末尾再帰であることをコンパイラに確かめさせる注釈です。
- `a :: as` は、先頭 `a` と残り `as` に分けるパターンです。`Nil` は空のリストです。
- 「coflatMap」は、関数の結果を各位置で作り直す操作のことです。`flatMap` が値を平らにするのに対し、こちらは各位置を文脈として扱います。

## 何をしているか

### 1. 先頭の位置では、全体を `f` に渡す

`f(this)` で、リスト全体を一度だけ `f` に渡します。これが結果の先頭になります。

```scala:line-numbers=373
    NonEmptyList(f(this), consume(tail))
```

### 2. 残りの各位置で、その位置から末尾までを `f` に渡す

`consume` は、残りのリストを先頭から一つずつ見ていきます。各位置 `a` と、その後ろの `as` から `NonEmptyList(a, as)` を作り、`f` に渡します。結果は `buf` に溜めます。

```scala:line-numbers=366
    @tailrec def consume(as: List[A]): List[B] =
      as match {
        case Nil     => buf.toList
        case a :: as =>
          buf += f(NonEmptyList(a, as))
          consume(as)
      }
```

## ここがすごい

- 各位置から見た「残り」を、毎回作り直して渡します。同じ位置の情報を使う計算を、一つの流れで書けます。
- 結果は必ず `NonEmptyList` で、要素数は元と同じです。空の心配がありません。
- `consume` を末尾再帰で書いているので、要素が多くても関数の呼び出しが積み重なりません。
- `ListBuffer` に溜めてから最後にリストにするので、途中で不変のリストを作り直しません。

## まとめ

- `coflatMap` は、各位置から末尾までのリストを作って `f` に渡し、その結果を並べます。
- 先頭は全体、二番目以降は残りの部分を渡します。
- 結果の要素数は元のリストと同じで、非空が保たれます。
