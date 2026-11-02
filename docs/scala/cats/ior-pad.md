---
title: "Ior の両方の値を、2 つの Option の組に分けて取り出す"
description: "Cats の Ior.pad。左と右それぞれを Option で包み、(Option[A], Option[B]) の組にする。ある側がないときは None になる。fold の 3 つの関数を使う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Ior.scala"
lines: [337, 337]
format: 2
function: "Ior.pad"
difficulty: 1
tags: [型システム, エラー処理, 関数型]
---

## ひとことで

Cats の `Ior[A, B]` は、左、右、両方のどれかを持つ型です。`pad` は、その値を `(Option[A], Option[B])` の組に分けます。どちらの側の値があるか、ないかを、そのまま `Option` で表します。

## コード

```scala:line-numbers=337
  final def pad: (Option[A], Option[B]) = fold(a => (Some(a), None), b => (None, Some(b)), (a, b) => (Some(a), Some(b)))
```

## 前提知識

- `Option[A]` は、値がある `Some(a)` か、値がない `None` のどちらかを持つ型です。
- `(Option[A], Option[B])` は、二つの `Option` をまとめたタプルです。
- `fold` は、`Ior` の三つの場合（左、右、両方）それぞれに関数を当てる操作です。
- `(a, b) => (Some(a), Some(b))` は、両方ある場合に、両方の値を `Some` で包む関数です。

## 何をしているか

### 1. 三つの場合で、組を作る

`fold` に、三つの場合の変換を渡します。左だけなら `(Some(a), None)`、右だけなら `(None, Some(b))`、両方なら `(Some(a), Some(b))` を返します。

```scala:line-numbers=337
  final def pad: (Option[A], Option[B]) = fold(a => (Some(a), None), b => (None, Some(b)), (a, b) => (Some(a), Some(b)))
```

## ここがすごい

- 三つの場合を、同じ型 `(Option[A], Option[B])` で表せます。呼び出し側は、どちらが `None` かを調べるだけで済みます。
- 両方の値を捨てずに、`Option` の形に残します。`toEither` のように、片方を捨てる必要がありません。
- `fold` の三つの関数を並べるだけで、全部の場合を書き切っています。`match` の書き忘れが起きません。
- 型の上で「ない」を `None` で表すので、`null` を使う必要がありません。

## まとめ

- `pad` は、`Ior` を `(Option[A], Option[B])` の組に変えます。
- 左だけ、右だけ、両方の三つの場合を、`fold` で `Some` と `None` の組み合わせにしています。
- 両方の値を失わずに、`Option` で「あるか、ないか」を表します。
