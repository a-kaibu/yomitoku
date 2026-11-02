---
title: "効果を繰り返し実行し続け、終わりは例外や失敗で決める"
description: "Cats の FlatMap.foreverM。同じ効果つき計算 fa を、結果が Left の間は繰り返す。終わらせるには、効果が失敗するか、Right を返さない限り続く。tailRecM で作る。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/FlatMap.scala"
lines: [190, 195]
format: 2
function: "FlatMap.foreverM"
difficulty: 2
tags: [関数型, 再帰, 状態機械]
---

## ひとことで

Cats の `FlatMap` にある `foreverM` は、効果つきの計算を、終わるまで繰り返します。計算の結果が `Left` の間は続きます。`Right` を返すか、効果が失敗すれば終わります。サーバの待ち受けのような、終わりを外から決める繰り返しに向いています。

## コード

::: code-group

```scala:line-numbers=190 [日本語訳]
  def foreverM[A, B](fa: F[A]): F[B] = {
    // 効率のため、ここで値を一度だけ作ります。
    val leftUnit = Left(())
    val stepResult: F[Either[Unit, B]] = as(fa, leftUnit)
    tailRecM(())(_ => stepResult)
  }
```

```scala:line-numbers=190 [原文]
  def foreverM[A, B](fa: F[A]): F[B] = {
    // allocate two things once for efficiency.
    val leftUnit = Left(())
    val stepResult: F[Either[Unit, B]] = as(fa, leftUnit)
    tailRecM(())(_ => stepResult)
  }
```

:::

## 前提知識

- `FlatMap[F]` は、前の計算の結果を使って次の計算をつなげる型の約束です。
- `Either[Unit, B]` は、続けるなら `Left(())`、終わって値を返すなら `Right(b)` を表します。`Unit` は、値がないことを表す型です。
- `tailRecM` は、`Left` の間は繰り返し、`Right` で終わる繰り返しを作る操作です。
- `as(fa, leftUnit)` は、効果 `fa` を実行してから、結果を捨てて `Left(())` を返します。
- 「永久に」という名前ですが、実際には効果が失敗するか、`Right` を返せば終わります。

## 何をしているか

### 1. 繰り返す一回分の計算を作る

`fa` を実行してから、結果を捨てて `Left(())` を返す計算を作ります。これが、一回の繰り返しに当たります。値は毎回同じものを使うので、一度だけ作って再利用します。

```scala:line-numbers=191
    // allocate two things once for efficiency.
    val leftUnit = Left(())
    val stepResult: F[Either[Unit, B]] = as(fa, leftUnit)
```

### 2. `tailRecM` で、その計算を繰り返す

`tailRecM` に、同じ計算 `stepResult` を渡します。結果が `Left` のあいだは同じ計算を続け、`Right` が出たら終わります。

```scala:line-numbers=194
    tailRecM(())(_ => stepResult)
```

## ここがすごい

- 繰り返しの仕組みを、`tailRecM` の一つの関数に任せています。ループや再帰を、ここで手で書く必要がありません。
- 同じ `Left(())` の値を使い回すので、一回ごとに新しい値を作るコストが減ります。コメントもそれを説明しています。
- 終わりは効果の失敗か、`Right` の返却で決まります。外から止められる繰り返しとして使えます。
- `F` の約束だけで書かれているので、`Option`、`Either`、`IO` など、どの型でも同じ形で使えます。

## まとめ

- `foreverM` は、効果を結果が `Right` になるか失敗するまで繰り返します。
- 一回分の計算を `Left(())` を返す形にして、`tailRecM` に渡します。
- 値を一度だけ作って使い回し、繰り返しのたびの確保を減らしています。
