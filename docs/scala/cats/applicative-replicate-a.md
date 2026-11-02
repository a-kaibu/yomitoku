---
title: "同じ効果を n 回繰り返し、結果のリストを作る"
description: "Cats の Applicative.replicateA。同じ計算 fa を n 回実行して、結果を List にまとめる。2 進数の桁にそって計算を倍々に組み立てるので、map2 の回数が log n に比例する。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Applicative.scala"
lines: [88, 109]
format: 2
function: "Applicative.replicateA"
difficulty: 3
tags: [関数型, アルゴリズム, 再帰]
---

## ひとことで

Cats の `Applicative` にある `replicateA` は、同じ計算 `fa` を `n` 回実行して、結果をリストにまとめます。たとえば `replicateA(3, fa)` は、`fa` を 3 回実行し、3 つの結果を `List` で返します。計算の回数を少なくするため、2 進数の考え方で組み立てます。

## コード

::: code-group

```scala:line-numbers=88 [日本語訳]
  def replicateA[A](n: Int, fa: F[A]): F[List[A]] =
    if (n <= 0) pure(Nil)
    else if (n == 1) {
      // n == 1 のときは、map を 2 回重ねる余分な費用を避けます。
      map(fa)(_ :: Nil)
    } else {
      val one = map(fa)(Chain.one(_))

      // 不変条件として、n >= 1 です。
      @tailrec def loop(fa: F[Chain[A]], n: Int, acc: F[Chain[A]]): F[Chain[A]] =
        if (n == 1) map2(fa, acc)(_.concat(_))
        else
          // n >= 2
          // よって (n >> 1) >= 1 なので、loop を呼んでよいです。
          loop(
            map2(fa, fa)(_.concat(_)),
            n >> 1,
            if ((n & 1) == 1) map2(acc, fa)(_.concat(_)) else acc
          )

      map(loop(one, n - 1, one))(_.toList)
    }
```

```scala:line-numbers=88 [原文]
  def replicateA[A](n: Int, fa: F[A]): F[List[A]] =
    if (n <= 0) pure(Nil)
    else if (n == 1) {
      // if n == 1 don't incur the penalty two maps: .map(Chain.one(_)).map(_.toList)
      map(fa)(_ :: Nil)
    } else {
      val one = map(fa)(Chain.one(_))

      // invariant: n >= 1
      @tailrec def loop(fa: F[Chain[A]], n: Int, acc: F[Chain[A]]): F[Chain[A]] =
        if (n == 1) map2(fa, acc)(_.concat(_))
        else
          // n >= 2
          // so (n >> 1) >= 1 and we are allowed to call loop
          loop(
            map2(fa, fa)(_.concat(_)),
            n >> 1,
            if ((n & 1) == 1) map2(acc, fa)(_.concat(_)) else acc
          )

      map(loop(one, n - 1, one))(_.toList)
    }
```

:::

## 前提知識

- `Applicative` は、効果（失敗、状態、入出力など）を持つ計算を、組み合わせる型の約束です。`map2` は、2 つの計算を組にする関数です。
- 「2 進数の考え方」は、`n` を 2 進数で表し、桁が 1 の位置だけを足し合わせる方法です。たとえば 5 は `101` なので、4 と 1 に分けられます。
- `n >> 1` は、`n` を 1 桁右にずらす操作で、2 で割った商を表します。
- `Chain` は、連結が速いリストです。結果を `Chain` の形で何度も連結し、最後に `List` にします。
- `@tailrec` は、末尾の再帰をループに変えることをコンパイラに確かめさせる注釈です。

## 何をしているか

### 1. 1 回の結果を、`Chain` の 1 要素にする

`fa` の結果を 1 要素の `Chain` に包み、`one` とします。以後の連結は、この形で行われます。

```scala:line-numbers=94
      val one = map(fa)(Chain.one(_))
```

### 2. 桁が 1 の位置だけ、結果に足す

`loop` は、残りの回数 `n`、今 2 倍になった計算 `fa`、途中の結果 `acc` を持ちます。`n` の最下位のビットが 1 なら、今の `fa` を `acc` に足します。その後、`fa` 同士をつないで 2 倍にし、`n` を 1 桁右にずらします。

```scala:line-numbers=97
      @tailrec def loop(fa: F[Chain[A]], n: Int, acc: F[Chain[A]]): F[Chain[A]] =
        if (n == 1) map2(fa, acc)(_.concat(_))
        else
          // n >= 2
          // so (n >> 1) >= 1 and we are allowed to call loop
          loop(
            map2(fa, fa)(_.concat(_)),
            n >> 1,
            if ((n & 1) == 1) map2(acc, fa)(_.concat(_)) else acc
          )

```

### 3. 最後に、結果を List にする

`n - 1` 回の分まで組み立てたあと、残りを足して `Chain` を作ります。最後に `toList` で `List` に直して、結果とします。

```scala:line-numbers=108
      map(loop(one, n - 1, one))(_.toList)
```

## ここがすごい

- 回数が多くても、`map2` の回数は `n` の桁数、つまり log n に比例します。`n` が 100 万でも、約 20 回の組み合わせで済みます。
- 2 進数の桁ごとに必要なものだけを足すので、同じ計算を何度も繰り返し組み直しません。
- 連結を `Chain` で行うので、結果を作るたびに全体をコピーしません。
- `n == 1` の特別扱いで、余計な変換を避けています。コメントの通り、小さな場合の費用を減らすための工夫です。

## まとめ

- 同じ効果を何度も繰り返すときは、回数を 2 進数で分けると、計算の回数を減らせます。
- 途中の結果を `Chain` のような連結の速い形で持つと、コピーを減らせます。
- 特別な場合（`n == 1`）を先に分けると、一般の場合の仕組みを分かりやすく保てます。
