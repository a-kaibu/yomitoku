---
title: "状態を持ち回しながら、各要素を変換する"
description: "Cats の Traverse.mapAccumulate。初期の状態から始め、各要素を変換するたびに状態を更新する。結果は最後の状態と、変換された要素の集まりの組。State を内部で使う。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Traverse.scala"
lines: [142, 143]
format: 2
function: "Traverse.mapAccumulate"
difficulty: 2
tags: [関数型, 状態機械, イディオム]
---

## ひとことで

Cats の `Traverse` は、要素の集まりに効果つきの処理を当てる型の約束です。`mapAccumulate` は、一つの状態を持ち回しながら、各要素を変換します。例えば、「何番目まで処理したか」を数えながら、要素を変換するような場面で使えます。

## コード

```scala:line-numbers=142
  def mapAccumulate[S, A, B](init: S, fa: F[A])(f: (S, A) => (S, B)): (S, F[B]) =
    traverse(fa)(a => State(s => f(s, a))).run(init).value
```

## 前提知識

- `Traverse[F]` は、リストなどの要素に、効果つきの処理を順番に当てられる型の約束です。
- `State[S, A]` は、状態 `S` を受け取って、値 `A` と新しい状態を返す計算の箱です。
- `run(init)` は、初期の状態を渡して、結果と最後の状態の組を取り出す操作です。`value` は、その結果を取り出す操作です。
- `(S, B)` は、新しい状態と変換後の値の組です。
- `f: (S, A) => (S, B)` は、今の状態と要素を受け取って、新しい状態と変換後の値を返す関数です。

## 何をしているか

### 1. 各要素を `State` の計算に変えて、`traverse` で集める

各要素 `a` を、状態 `s` を受け取って `f(s, a)` を返す `State` に包みます。`traverse` は、これを順番に実行して、結果を集めます。

```scala:line-numbers=143
    traverse(fa)(a => State(s => f(s, a))).run(init).value
```

## ここがすごい

- 状態を、一つの変数として手で渡さずに済みます。`State` が、要素ごとに新しい状態を自動的に受け渡します。
- 要素の変換と、状態の更新を、一つの関数 `f` にまとめて書けます。読み手は、一か所を見ればよいです。
- 結果が、最後の状態と変換後の集まりの組になるので、途中経過と結果をどちらも取り出せます。
- `traverse` という既存の仕組みに乗せるので、リストでも木でも同じ書き方で使えます。

## まとめ

- `mapAccumulate` は、初期の状態から始め、要素ごとに状態を更新しながら変換します。
- 中身は、各要素を `State` にして `traverse` で順番に実行する一行です。
- 結果は、最後の状態と、変換された集まりの組です。
