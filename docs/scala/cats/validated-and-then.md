---
title: "成功したときだけ次の検証へ進み、失敗は最初の 1 つで止める"
description: "Cats の Validated.andThen。Valid なら、中身を次の検証関数に渡す。Invalid なら、そのまま返して次の検証は行わない。失敗を値として持ち、途中で止める連鎖の書き方。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Validated.scala"
lines: [725, 729]
format: 2
function: "Validated.andThen"
difficulty: 2
tags: [エラー処理, 関数型, 型システム]
---

## ひとことで

Cats の `Validated` は、成功（`Valid`）か失敗（`Invalid`）のどちらかを持つ値です。`andThen` は、成功のときだけ次の検証を続けます。失敗のときは、その失敗をそのまま返し、次の検証は行いません。順番に検証を重ねるときに使います。

## コード

```scala:line-numbers=725
  def andThen[EE >: E, B](f: A => Validated[EE, B]): Validated[EE, B] =
    this match {
      case Valid(a)       => f(a)
      case i @ Invalid(_) => i
    }
```

## 前提知識

- `Validated[E, A]` は、成功なら `A` の値を、失敗なら `E` のエラーを持つ型です。例外を使わず、失敗を値として扱えます。
- `Valid(a)` は成功、`Invalid(e)` は失敗を表す値です。
- `f: A => Validated[EE, B]` は、成功した値を受け取って、次の検証の結果を返す関数です。
- `case i @ Invalid(_) => i` は、失敗の値をそのまま返す書き方です。`i @` は、パターンに一致した値全体に名前をつけます。
- 「連鎖（chain）」は、前の結果を次の処理の入力にして、順番に処理をつなぐことです。

## 何をしているか

### 1. 成功なら、次の検証へ渡す

`this` が `Valid(a)` のときは、中身の `a` を関数 `f` に渡します。`f` が返す新しい検証の結果が、そのまま全体の結果になります。

```scala:line-numbers=727
      case Valid(a)       => f(a)
```

### 2. 失敗なら、そのまま返して止める

`this` が `Invalid` のときは、関数 `f` を呼ばずに、その失敗をそのまま返します。後ろの検証は、一切行われません。

```scala:line-numbers=728
      case i @ Invalid(_) => i
```

## ここがすごい

- 最初の失敗で止まるので、無駄な検証を行いません。前の段階が失敗していれば、後の段階は意味がないからです。
- 失敗の値を作り直さず、そのまま返すので、最初に起きたエラーの情報が保たれます。
- 型の上限 `EE >: E` によって、エラーの型を広げて連鎖させられます。異なるエラーの型をまとめる書き方に対応します。
- `Option` の `flatMap` と同じ形なので、慣れた書き方で成功と失敗の連鎖を表せます。

## まとめ

- 検証を順番に重ねるときは、成功のときだけ次の検証へ渡し、失敗はそのまま返すと止まります。
- 失敗の情報を作り直さずに返すと、最初の原因が分かりやすく残ります。
- 型の上限を使うと、エラーの型が違う検証も連鎖できます。
