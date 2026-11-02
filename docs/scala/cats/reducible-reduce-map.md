---
title: "空にならない集まりを、変換しながら一つにまとめる"
description: "Cats の Reducible.reduceMap。最初の要素だけは f で変換して初期値にし、残りは変換した値を Semigroup の combine で足していく。初期値を必要としない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Reducible.scala"
lines: [92, 93]
format: 2
function: "Reducible.reduceMap"
difficulty: 2
tags: [関数型, イディオム, 型システム]
---

## ひとことで

Cats の `Reducible` は、必ず一つ以上の要素を持つ集まりの約束です。`reduceMap` は、各要素を `f` で変換して、その結果を一つにまとめます。空の集まりを考えなくてよいので、空の値（初期値）を用意する必要がありません。

## コード

```scala:line-numbers=92
  def reduceMap[A, B](fa: F[A])(f: A => B)(implicit B: Semigroup[B]): B =
    reduceLeftTo(fa)(f)((b, a) => B.combine(b, f(a)))
```

## 前提知識

- `Reducible[F]` は、要素が一つ以上あることが保証された、たたみ込める集まりの約束です。例えば `NonEmptyList` がこれにあたります。
- `Semigroup[B]` は、二つの `B` を一つにまとめる `combine` を持つ型の約束です。初期値の `empty` は必要ありません。
- `reduceLeftTo(fa)(f)(g)` は、最初の要素を `f` で変換して初期値にし、残りの要素を `g` で順に加えていく操作です。
- `f: A => B` は、要素を別の型に変える関数です。

## 何をしているか

### 1. 最初の要素を変換して初期値にし、残りを順に足す

`reduceLeftTo` に、最初の要素の変換 `f` と、残りを加える関数を渡します。加える関数の中で、`B.combine(b, f(a))` を使い、要素を変換してから足します。

```scala:line-numbers=93
    reduceLeftTo(fa)(f)((b, a) => B.combine(b, f(a)))
```

## ここがすごい

- 空の集まりを扱わないので、`empty` を用意する必要がありません。`Monoid` ではなく `Semigroup` で済みます。
- 最初の要素が必ず初期値になるので、変換と結合を一つの流れで書けます。
- 変換（`f`）と結合（`combine`）の両方が、呼び出し側から自由に決められます。
- 型の約束で「必ず一つ以上ある」と保証されるので、空の場合の処理を書き忘れる心配がありません。

## まとめ

- `reduceMap` は、各要素を変換して、一つの値にまとめます。
- 最初の要素が初期値になるので、`empty` は要りません。
- 中身は `reduceLeftTo` と `combine` を組み合わせた一行です。
