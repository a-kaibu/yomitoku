---
title: "本体を実行してから条件を確かめ、真になったら止める"
description: "Cats の Monad.untilM_。本体を一度実行してから、条件が true になるまで繰り返す。条件は Eval.later で包み、必要になるまで評価しない。戻り値は Unit で、結果は捨てる。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Monad.scala"
lines: [93, 96]
format: 2
function: "Monad.untilM_"
difficulty: 3
tags: [関数型, 遅延評価, 再帰]
---

## ひとことで

Cats の `Monad` には、「条件が真になるまで、本体を繰り返す」関数が用意されています。`untilM_` は、本体を必ず一度実行してから、条件を確かめます。条件が `true` になった時点で止まり、結果は捨てて `Unit` を返します。

## コード

```scala:line-numbers=93
  def untilM_[A](f: F[A])(cond: => F[Boolean]): F[Unit] = {
    val p = Eval.later(cond)
    flatMap(f)(_ => whileM_(map(p.value)(!_))(f))
  }
```

## 前提知識

- `whileM_` は「条件が真の間」繰り返します。`untilM_` は、その反対で「条件が真になるまで」繰り返します。
- 「本体を先に一度実行する」ので、条件を確かめる前に少なくとも 1 回は本体が動きます。
- `Eval.later(cond)` は、条件の計算を遅らせて包む書き方です。必要になったときに一度だけ評価されます。
- `map(p.value)(!_)` は、条件の結果を反転させる操作です。真になったら止めたいので、「まだ偽か」を繰り返しの条件にしています。
- `flatMap(f)(_ => ...)` は、本体を先に実行して、その後の計算につなぐ書き方です。本体の結果は使わないので `_` で受けます。

## 何をしているか

### 1. 条件を遅らせて包んでおく

条件 `cond` を `Eval.later` で包みます。条件は、本体を 1 回実行した後で初めて評価されます。

```scala:line-numbers=94
    val p = Eval.later(cond)
```

### 2. 本体を 1 回実行してから、繰り返しに入る

`flatMap(f)` で本体 `f` を先に実行します。その後で `whileM_` を使い、条件を反転したものが真の間、本体を繰り返します。

```scala:line-numbers=95
    flatMap(f)(_ => whileM_(map(p.value)(!_))(f))
```

### 3. 条件が真になったら、そこで止まる

条件の結果を反転させているので、条件が `true` になると繰り返しは終わります。結果は `Unit` で、本体の値は捨てられます。

## ここがすごい

- 条件の反転と `whileM_` を組み合わせるだけで、「まで」の繰り返しを新しく書かずに済みます。既存の部品を再利用しています。
- 本体を先に実行するので、「条件を最初に調べる」`whileM_` とは動きが違います。少なくとも 1 回動く繰り返しを、そのまま表せます。
- 条件を `Eval.later` で包んでいるので、評価の順番がモナドの中で保たれます。
- 結果を捨てるので、本体が大きな値を返しても、メモリに溜め込みません。

## まとめ

- 「条件が真になるまで」は、条件を反転して「真の間」の繰り返しに変えると書けます。
- 本体を先に 1 回動かす繰り返しは、`flatMap` で最初の実行をつなぐと表現できます。
- 繰り返しの仕組みは `whileM_` に任せ、新しいループを書かないと、動きの違いだけに集中できます。
