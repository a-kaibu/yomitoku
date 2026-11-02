---
title: "条件を満たさなければ、計算を空（失敗）にする"
description: "Cats の Alternative.guard。条件が true なら unit（何もしない成功）、false なら empty（空の値）を返す。Option や List で、途中で候補を絞り込む。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Alternative.scala"
lines: [115, 116]
format: 2
function: "Alternative.guard"
difficulty: 1
tags: [関数型, イディオム, エラー処理]
---

## ひとことで

Cats の `Alternative` は、「空の値」と「候補をつなぐ」操作を持つ型の約束です。`guard` は、条件が真なら何もしない成功の値を、偽なら空の値を返します。`Option` や `List` と組み合わせると、条件に合わない途中の結果を、そこで捨てられます。

## コード

```scala:line-numbers=115
  def guard(condition: Boolean): F[Unit] =
    if (condition) unit else empty
```

## 前提知識

- `Alternative[F]` は、空の値 `empty` と、二つの候補をまとめる `combineK` を持つ型の約束です。
- `Option` の `empty` は `None`、`List` の `empty` は `Nil`（空のリスト）です。
- `unit` は、効果を持つ「何もしない成功」の値です。`F[Unit]` の形をしています。
- `condition: Boolean` は、真か偽の条件です。
- `F[Unit]` の `Unit` は、値を持たないことを表す型です。

## 何をしているか

### 1. 条件が真なら、何もしない成功の値を返す

`condition` が真のときは、`unit` を返します。計算は続き、後ろの処理に進みます。

```scala:line-numbers=116
    if (condition) unit else empty
```

### 2. 条件が偽なら、空の値を返す

偽のときは `empty` を返します。`Option` なら `None`、`List` なら空のリストになり、後ろの処理は実行されません。

```scala:line-numbers=116
    if (condition) unit else empty
```

## ここがすごい

- 条件を一行で書けるので、途中で候補を絞る処理を、`if` 文なしで組み立てられます。
- `Option` では `None`、`List` では空のリストになるので、同じ `guard` で、失敗としての絞り込みも、候補の削除としての絞り込みもできます。
- 型は `F[Unit]` のままなので、後ろに `flatMap` や `map` をつなぎやすくなります。
- 絞り込みの条件が、コードの流れの中に素直に並ぶので、読み手は「ここで条件を満たさないと止まる」とすぐわかります。

## まとめ

- `guard` は、条件が真なら `unit`、偽なら `empty` を返します。
- 途中で候補を絞り込むときに、`if` の代わりとして使えます。
- `Option` の `None` や `List` の空リストが、そこで計算を止める役目を果たします。
