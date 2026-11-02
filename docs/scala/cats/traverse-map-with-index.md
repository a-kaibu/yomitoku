---
title: "要素ごとに番号を数えながら、構造を保ったまま変換する"
description: "Cats の Traverse.mapWithIndex。構造の中の要素を順に訪ね、0 から数えた番号と一緒に関数を適用する。番号は mapAccumulate で持ち歩き、結果の構造は元と同じ形になる。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Traverse.scala"
lines: [149, 150]
format: 2
function: "Traverse.mapWithIndex"
difficulty: 2
tags: [関数型, イテレータ, 状態機械]
---

## ひとことで

Cats の `Traverse` は、リストや木のように、中身を順に訪ねられる型の約束です。`mapWithIndex` は、中の要素を順に訪ねながら、0 から始まる番号を一緒に渡して変換します。結果は、元と同じ形の構造で返ります。

## コード

```scala:line-numbers=149
  def mapWithIndex[A, B](fa: F[A])(f: (A, Int) => B): F[B] =
    mapAccumulate(0, fa)((i, a) => (i + 1) -> f(a, i))._2
```

## 前提知識

- `Traverse` は、中身を訪ねながら、構造はそのまま保つ変換を持つ型の約束です。`List` や `Vector` や `Option` などが当てはまります。
- `F[A]` は、型 `A` の要素を持つ構造です。`F[B]` は、同じ形で中身の型だけが `B` に変わったものです。
- `mapAccumulate` は、途中の状態を持ち歩きながら、要素を変換する関数です。状態と結果の組を返します。
- `(i + 1) -> f(a, i)` は、次の状態 `i + 1` と変換後の値 `f(a, i)` の組を作ります。
- `._2` は、組の 2 番目の要素を取り出します。ここでは変換後の構造です。

## 何をしているか

### 1. 番号を状態として、0 から数える

`mapAccumulate` の初期の状態は `0` です。これが、最初の要素の番号になります。

```scala:line-numbers=149
  def mapWithIndex[A, B](fa: F[A])(f: (A, Int) => B): F[B] =
```

### 2. 要素ごとに、番号を渡して変換し、番号を 1 増やす

関数 `(i, a) => (i + 1) -> f(a, i)` は、今の番号 `i` と要素 `a` を受け取ります。次の番号に `i + 1` を、変換後の値に `f(a, i)` を入れた組を返します。

```scala:line-numbers=150
    mapAccumulate(0, fa)((i, a) => (i + 1) -> f(a, i))._2
```

### 3. 変換後の構造だけを取り出す

`mapAccumulate` は、最後の状態と変換後の構造の組を返します。番号は要らないので、`._2` で構造だけを取り出します。

## ここがすごい

- 番号を数える処理を、状態として `mapAccumulate` に任せています。変換の関数は、番号を引数で受け取るだけで済みます。
- 結果の構造は元と同じ形なので、リストならリストのまま、`Option` なら `Option` のまま返ります。型の情報が失われません。
- 番号は `Int` で数えるので、同じ構造を何度も数え直す必要がありません。1 回の走査で済みます。
- `zipWithIndex` も、この関数を `(a, i) => (a, i)` と使って作られています。小さな部品を組み合わせた書き方です。

## まとめ

- 番号付きで変換するには、番号を状態として持ち歩く形が簡単です。
- 構造を保つ変換は、型の約束（`Traverse`）に任せると、リストでも木でも同じように書けます。
- 結果の組から必要な方だけを取り出すと、余分な情報を捨てられます。
