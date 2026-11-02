---
title: "条件を計算の結果で決めて、2 つのうち片方の計算を続ける"
description: "Cats の FlatMap.ifM。条件が効果つき（Option や IO など）で、その結果が true か false かで、2 つの計算のどちらを実行するかを決める。条件も分岐先も、必要になるまで評価しない名前渡しの引数。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/FlatMap.scala"
lines: [144, 145]
format: 2
function: "FlatMap.ifM"
difficulty: 2
tags: [関数型, 遅延評価, イディオム]
---

## ひとことで

Cats の `FlatMap` にある `ifM` は、`if` 文の効果つき版です。条件がモナドの中にあるときに、その結果が `true` なら一方の計算を、`false` なら別の計算を続けます。たとえば「データベースに存在するか」を調べてから、その結果で処理を分けるような場面で使えます。

## コード

```scala:line-numbers=144
  def ifM[B](fa: F[Boolean])(ifTrue: => F[B], ifFalse: => F[B]): F[B] =
    flatMap(fa)(if (_) ifTrue else ifFalse)
```

## 前提知識

- `FlatMap` は、計算の結果を使って次の計算を決められる型の約束です。`flatMap` がその中心の操作です。
- `F[Boolean]` は、`true` か `false` を、効果（失敗、入出力など）を持つ型の中に入れた値です。
- `ifTrue: => F[B]` と `ifFalse: => F[B]` は、名前渡しの引数です。選ばれた側の計算だけが評価され、選ばれなかった側は評価されません。
- `flatMap(fa)(...)` は、`fa` の結果を受け取って、次のモナドの計算を返す関数に渡す操作です。
- `if (_) ifTrue else ifFalse` は、受け取った真偽値で 2 つの計算を選ぶ関数です。`_` は、`flatMap` が渡す値を指します。

## 何をしているか

### 1. 条件の計算の結果を受け取る

`flatMap(fa)` は、条件 `fa` が出した真偽値を取り出します。取り出した値は、次の関数に渡されます。

```scala:line-numbers=145
    flatMap(fa)(if (_) ifTrue else ifFalse)
```

### 2. 結果によって、どちらかの計算を選ぶ

渡された関数は、真なら `ifTrue`、偽なら `ifFalse` を返します。選ばれたモナドの計算が、そのまま続けて実行されます。

```scala:line-numbers=145
    flatMap(fa)(if (_) ifTrue else ifFalse)
```

## ここがすごい

- 条件の効果（例えば入出力や失敗）を、そのまま `flatMap` の流れに乗せます。条件を調べる処理と、分岐の処理が自然につながります。
- 名前渡しなので、選ばれなかった方の計算は一切評価されません。副作用のある計算でも、誤って両方を実行することがありません。
- `if` 文を新しく書かずに、既存の `flatMap` だけで分岐を表しています。モナドの型の約束から、分岐の仕組みが自然に得られます。
- `Option` や `Either` を使えば、条件が失敗したときに全体を止めるような、エラーの扱いも同じ形で書けます。

## まとめ

- 効果を持つ条件で分岐するには、条件を `flatMap` で受けて、結果により計算を選びます。
- 分岐先を名前渡しにすると、選ばれなかった計算は評価されません。
- 既存の部品を組み合わせると、新しい制御構文を作らずに分岐を書けます。
