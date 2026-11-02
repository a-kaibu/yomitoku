---
title: "条件が真の間、本体を実行し続けて、結果を捨てる"
description: "Cats の Monad.whileM_。条件のモナドが true の間だけ本体を実行する。本体は Eval.later で包み、必要になるまで評価しない。戻り値は Unit で、結果は使わない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Monad.scala"
lines: [65, 75]
format: 2
function: "Monad.whileM_"
difficulty: 3
tags: [関数型, 遅延評価, 再帰]
---

## ひとことで

Cats の `Monad` にある `whileM_` は、`while` 文のような繰り返しを、モナドの中で行う関数です。条件を表すモナドが `true` を返す間だけ、本体の計算を実行します。結果の値は捨てて、`Unit` を返します。

## コード

```scala:line-numbers=65
  def whileM_[A](p: F[Boolean])(body: => F[A]): F[Unit] = {
    val continue: Either[Unit, Unit] = Left(())
    val stop: F[Either[Unit, Unit]] = pure(Right(()))
    val b = Eval.later(body)
    tailRecM(())(_ =>
      ifM(p)(
        ifTrue = as(b.value, continue),
        ifFalse = stop
      )
    )
  }
```

## 前提知識

- 末尾の `_` は、結果の値を使わないことを表す慣習です。`whileM` は結果を集めますが、`whileM_` は集めません。
- `F[Boolean]` は、`true` か `false` を、モナドの中に入れた値です。条件が `IO` のように副作用を持つ場合も、この形で書けます。
- `body: => F[A]` は、名前渡しの引数です。本体は、必要になるまで評価されません。
- `Eval.later` は、計算を一度だけ遅らせて評価する型です。`.value` を呼んだときに計算が走ります。
- `ifM` は、条件のモナドの結果によって、2 つのうちどちらかの計算を選ぶ関数です。

## 何をしているか

### 1. 本体を、評価を遅らせて包んでおく

本体の `body` を `Eval.later` で包みます。こうしておくと、条件が真の間だけ、必要な回数だけ本体が走ります。

```scala:line-numbers=68
    val b = Eval.later(body)
```

### 2. 続けるかどうかを、条件で決める

`ifM(p)` で条件を調べます。真なら、本体を実行して `continue`（`Left`）を返します。偽なら `stop`（`Right`）を返します。

```scala:line-numbers=70
      ifM(p)(
        ifTrue = as(b.value, continue),
        ifFalse = stop
      )
    )
```

`as` は、前のモナドの結果を捨てて、別の値に置き換える関数です。ここでは本体の結果を捨て、`continue` に置き換えています。

### 3. `tailRecM` に繰り返しを任せる

`tailRecM` は、`Left` が返ってくる限り同じ関数を呼び続けます。`Right` が返ってきたところで止まり、`Unit` を返します。

```scala:line-numbers=69
    tailRecM(())(_ =>
```

## ここがすごい

- 本体を `Eval.later` で包むので、繰り返しの前に本体の計算が走ることはありません。計算の順番がモナドの中で正しく保たれます。
- 繰り返しを `tailRecM` で書くので、`while` に相当する処理でも、スタックの深さが増えません。
- 条件と本体の両方がモナドなので、本体が入出力や失敗を持つ場合でも、同じ書き方で済みます。
- 戻り値を `Unit` にして結果を捨てると、集める場合の `whileM` より、メモリを使わずに済みます。

## まとめ

- 条件付きの繰り返しは、条件と本体をモナドにして、`tailRecM` で回せます。
- 本体は `Eval.later` で遅らせると、実行の順番が安全に保たれます。
- 結果を捨てるかどうかで、`whileM` と `whileM_` を使い分けます。
