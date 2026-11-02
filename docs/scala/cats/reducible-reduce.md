---
title: "空にならない集まりを、Semigroup で一つにまとめる"
description: "Cats の Reducible.reduce。要素の型 A に Semigroup があれば、reduceLeft で左から combine を続けて一つの値にする。初期値は要らない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Reducible.scala"
lines: [58, 59]
format: 2
function: "Reducible.reduce"
difficulty: 1
tags: [関数型, イディオム, 型システム]
---

## ひとことで

Cats の `Reducible` は、必ず一つ以上の要素を持つ集まりの約束です。`reduce` は、要素の型 `A` の `Semigroup`（二つを一つにまとめる方法）を使って、全要素を一つの値にまとめます。空の集まりを扱わないので、初期値を用意する必要がありません。

## コード

```scala:line-numbers=58
  def reduce[A](fa: F[A])(implicit A: Semigroup[A]): A =
    reduceLeft(fa)(A.combine)
```

## 前提知識

- `Semigroup[A]` は、二つの `A` を一つにまとめる `combine` を持つ型の約束です。整数の足し算や、文字列の連結がこれにあたります。
- `reduceLeft` は、先頭の要素を初期値にして、左から順に `combine` を続ける操作です。
- `A.combine` は、そのまとめ方を関数として渡すものです。`(x, y) => A.combine(x, y)` と同じ意味です。
- 「`Reducible`」は、要素が必ず一つ以上あることを型で保証した集まりです。

## 何をしているか

### 1. `reduceLeft` に、`combine` を渡して左から畳む

`reduceLeft(fa)(A.combine)` は、先頭から順に、要素を `combine` で一つずつ組み合わせていきます。最後に残った値が、結果になります。

```scala:line-numbers=59
    reduceLeft(fa)(A.combine)
```

## ここがすごい

- 中身は `reduceLeft` と `combine` の組み合わせだけで、とても短く書けています。
- 初期値の `empty` を使わないので、`Monoid` ではなく `Semigroup` で十分です。
- 要素の型が決まれば、どの `Semigroup` を渡すかで、足し算にも連結にもなります。
- 空の集まりは型の上で存在しないので、「空だったとき」の分岐を書く必要がありません。

## まとめ

- `reduce` は、`Semigroup` の `combine` を左から順に当てて、一つの値にまとめます。
- 初期値は要らず、最初の要素から始まります。
- 中身は `reduceLeft(fa)(A.combine)` の一行です。
