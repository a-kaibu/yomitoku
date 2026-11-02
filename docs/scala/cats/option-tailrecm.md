---
title: "Option のモナドを、ループで再帰させる"
description: "Cats の Option に実装された tailRecM。途中で None が出たら即座に止まり、Left を繰り返すだけの処理をスタックを増やさずに回す。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/instances/option.scala"
lines: [111, 117]
format: 2
function: "optionInstance.tailRecM"
difficulty: 2
tags: [関数型, 再帰, 型システム]
---

## ひとことで

Cats の `Option` 向けの型クラス実装にある `tailRecM` です。`f` の結果が `Left` のときは同じ処理を続け、`Right` が出たら終わり、`None` が出たら途中で止めます。`@tailrec` が付いているので、深く繰り返してもスタックは増えません。

## コード

```scala:line-numbers=111
      @tailrec
      def tailRecM[A, B](a: A)(f: A => Option[Either[A, B]]): Option[B] =
        f(a) match {
          case None           => None
          case Some(Left(a1)) => tailRecM(a1)(f)
          case Some(Right(b)) => Some(b)
        }
```

## 前提知識

- `Option[A]` は、値が `Some(a)` か、値のない `None` のどちらかです。
- `Either[A, B]` は、`Left(a)` か `Right(b)` のどちらかです。Cats では「まだ続きがあるなら `Left`、終わりなら `Right`」の意味で使われます。
- 型クラス `Monad` は、`flatMap` などの操作をまとめた約束です。`tailRecM` は、その中の「ループを表す」操作です。
- `@tailrec` は、末尾の呼び出しが自分自身であることを確かめる注釈です。
- 一般に、「値を変えながら同じ関数を繰り返す」計算は、再帰で書くと深くなりすぎるのが問題になります。

## 何をしているか

### 1. 関数 f の結果でパターンマッチする

`tailRecM` は、まず `f(a)` を実行し、その結果を `match` で分けます。

```scala:line-numbers=113
        f(a) match {
          case None           => None
          case Some(Left(a1)) => tailRecM(a1)(f)
          case Some(Right(b)) => Some(b)
```

3 通りに分かれます。`None` なら、途中で失敗したので `None` を返します。`Some(Left(a1))` なら、まだ続きがあるので `a1` を使って自分を呼び直します。`Some(Right(b))` なら、答えが出たので `Some(b)` を返します。

### 2. 続きは同じ関数を末尾で呼ぶ

`Left` のとき、`tailRecM(a1)(f)` は関数の最後の処理になっています。そのため `@tailrec` が付けられ、コンパイラがループに変換します。

このおかげで、`a1` が何千回変わっても、JVM のスタックは増えません。

### 3. None で途中で止まる

`None` が出た瞬間に `None` を返して終わります。`flatMap` を使った一般的な書き方でも同じ結果になりますが、この実装は直接 `match` することで、途中で余計なクロージャを作らないようにしています。

## ここがすごい

- `tailRecM` は、モナドで「繰り返しを再帰として表す」ための汎用の道具です。`Option` 用の実装が末尾再帰になっているので、どれだけ長く繰り返しても安全です。
- `Either` の `Left` を「続き」、`Right` を「終了」に割り当てる約束は、Cats 全体で同じように使われています。`Option` 版もその約束に従っています。
- コメントにあるように、`map2` などでは `flatMap` の代わりに直接 `isDefined` を調べています。クロージャの生成を減らすための工夫が、ほかの場所にも見られます。
- 再帰をデータとして扱うので、途中で失敗したときにすぐ抜けられます。例外を投げずに失敗を値で返す、関数型らしい書き方です。

## まとめ

- モナドの繰り返しは `tailRecM` で表し、末尾再帰にするとスタックを増やさずに済みます。
- `Left` を続き、`Right` を終わりとする約束を覚えると、ほかの型の実装も読みやすくなります。
- `None` のような失敗は、例外ではなく値として途中で止まるように書けます。
