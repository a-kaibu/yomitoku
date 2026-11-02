---
title: "効果のある判定を、途中で止まりながら繰り返す"
description: "Cats の Foldable.existsM。要素を順に効果つきの述語にかけ、真になったところで止める。Source と tailRecM を使うので、効果を持つモナドでも、途中で止めた後の要素には判定を行わない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [731, 737]
format: 2
function: "Foldable.existsM"
difficulty: 3
tags: [関数型, 再帰, 遅延評価]
---

## ひとことで

Cats の `Foldable` にある `existsM` は、「どれか 1 つでも条件を満たすか」を、条件判定に効果（`Option` や `IO` などのモナド）がある場合でも求めます。条件が `true` になった時点で止まり、後の要素には判定を行いません。

## コード

```scala:line-numbers=731
  def existsM[G[_], A](fa: F[A])(p: A => G[Boolean])(implicit G: Monad[G]): G[Boolean] =
    G.tailRecM(Foldable.Source.fromFoldable(fa)(using self)) { src =>
      src.uncons match {
        case Some((a, src)) => G.map(p(a))(bb => if (bb) Right(true) else Left(src.value))
        case None           => G.pure(Right(false))
      }
    }
```

## 前提知識

- `Foldable` は、中身を順に訪ねられる型です。`List` や `Option` などが当てはまります。
- 条件 `p` が `G[Boolean]` を返すとは、判定に効果がある、という意味です。例えば `IO` なら、判定のときに入出力をしてから結果を返します。
- `tailRecM` は、`Left` が返ってくる限り同じ関数を繰り返し、`Right` が返ってきたら結果を返す関数です。
- `Foldable.Source` は、要素を 1 つずつ取り出せる、遅延した列の表現です。`uncons` は、先頭の要素と残りの列を取り出します。
- `G.map(p(a))(...)` は、判定の結果に関数をかける書き方です。効果を持つまま、結果を変換します。

## 何をしているか

### 1. 要素を 1 つずつ取り出して、条件を調べる

`tailRecM` の中で、残りの列 `src` から先頭を `uncons` で取り出します。取り出せたら、先頭の要素 `a` に条件 `p` を適用します。

```scala:line-numbers=732
    G.tailRecM(Foldable.Source.fromFoldable(fa)(using self)) { src =>
      src.uncons match {
        case Some((a, src)) => G.map(p(a))(bb => if (bb) Right(true) else Left(src.value))
        case None           => G.pure(Right(false))
```

### 2. 条件が真なら、止めて `true` を返す

判定の結果が真なら、`Right(true)` を返します。`tailRecM` はこれを見て、そこで終わります。残りの要素には、条件を一切適用しません。

```scala:line-numbers=735
        case None           => G.pure(Right(false))
```

### 3. 偽なら、残りの列で続ける

判定の結果が偽なら、残りの列 `src.value` を `Left` に包んで返します。`tailRecM` はその列で、次の要素の判定を続けます。

```scala:line-numbers=735
        case None           => G.pure(Right(false))
```

### 4. 要素が無くなったら、`false`

列の先頭が取り出せなければ、要素は全部偽だったということです。`Right(false)` を返して終わります。

```scala:line-numbers=736
      }
```

## ここがすごい

- 真になった時点で止まるので、判定に効果（入出力や失敗）がある場合でも、余計な効果を起こしません。
- 要素の列を `Source` で持つので、残りの要素を作るのは必要になったときだけです。遅延した列が、無駄な計算を防ぎます。
- `tailRecM` を使うので、要素が多くても再帰の深さでスタックを使い切りません。
- 判定の型 `G` は、`Option` でも `Either` でも `IO` でも同じ書き方で動きます。型の約束に任せているので、ひとつの実装で多くの場合に対応できます。

## まとめ

- 効果を持つ判定を途中で止めるには、真の時点で `Right` を返す形が便利です。
- 要素の列を遅延させて持つと、止めた後の計算を省けます。
- `tailRecM` と組み合わせると、長い列でも安全に走査できます。
