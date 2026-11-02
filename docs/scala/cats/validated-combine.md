---
title: "失敗は全部集め、成功は値をまとめる、Validated の結合"
description: "Cats の Validated.combine。両方が成功なら値を Semigroup で結合し、両方が失敗ならエラーを結合する。片方だけが失敗なら、その失敗を返す。エラーを 1 つずつ止めずに集めるための規則。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Validated.scala"
lines: [756, 764]
format: 2
function: "Validated.combine"
difficulty: 3
tags: [エラー処理, 関数型, 型システム]
---

## ひとことで

Cats の `Validated` の `combine` は、2 つの検証結果を 1 つにまとめます。両方が成功なら値をまとめ、両方が失敗ならエラーを全部まとめます。`andThen` と違って、途中で止めず、失敗を集めるための規則です。

## コード

```scala:line-numbers=756
  def combine[EE >: E, AA >: A](
    that: Validated[EE, AA]
  )(implicit EE: Semigroup[EE], AA: Semigroup[AA]): Validated[EE, AA] =
    (this, that) match {
      case (Valid(a), Valid(b))     => Valid(AA.combine(a, b))
      case (Invalid(a), Invalid(b)) => Invalid(EE.combine(a, b))
      case (Invalid(_), _)          => this
      case _                        => that
    }
```

## 前提知識

- `Validated[E, A]` は、成功（`Valid`）なら `A`、失敗（`Invalid`）なら `E` を持つ型です。
- `Semigroup` は、2 つの値を結合する操作を持つ型の約束です。文字列の連結、リストの連結、数の足し算などが当てはまります。
- `(this, that) match` は、2 つの値の組を一度に調べる書き方です。両方の状態の組み合わせごとに、結果を決められます。
- `EE` と `AA` は、エラーの型と成功の値の型です。それぞれに `Semigroup` が必要です。
- `case (Invalid(_), _) => this` は、左が失敗なら左を返す規則です。左のエラーが残れば十分です。

## 何をしているか

### 1. 両方が成功なら、値を結合する

両方が `Valid` なら、値 `a` と `b` を `AA.combine` で結合し、`Valid` に包んで返します。

```scala:line-numbers=759
    (this, that) match {
      case (Valid(a), Valid(b))     => Valid(AA.combine(a, b))
```

### 2. 両方が失敗なら、エラーを結合する

両方が `Invalid` なら、エラー `a` と `b` を `EE.combine` で結合します。どちらのエラーも捨てられず、1 つにまとめられます。

```scala:line-numbers=761
      case (Invalid(a), Invalid(b)) => Invalid(EE.combine(a, b))
```

### 3. 片方だけが失敗なら、その失敗を返す

左が失敗なら、左をそのまま返します。左が成功で右が失敗なら、最後の場合で右を返します。どちらの場合も、失敗だけが残ります。

```scala:line-numbers=762
      case (Invalid(_), _)          => this
      case _                        => that
```

## ここがすごい

- 失敗を途中で止めず、両方のエラーを集められます。入力のすべての問題を、一度に報告できます。
- エラーと値の結合方法を `Semigroup` に任せるので、リストに集めても、文字列に連結しても、同じ規則で動きます。
- 「片方だけ失敗」の場合は、失敗が残るように決めています。成功だけを混ぜても、失敗が消えることはありません。
- 組のパターンを使い、4 つの場合を 1 つの式で書いています。規則が一目で読めます。

## まとめ

- 複数の検証結果を集めるには、成功は値を結合し、失敗はエラーを結合する規則を決めます。
- 途中で止めずに失敗を集めるには、`Semigroup` でエラーをまとめると便利です。
- 片方だけ失敗した場合の扱いを明確にすると、結果の意味が分かりやすくなります。
