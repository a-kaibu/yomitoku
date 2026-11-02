---
title: "結果が条件を満たす間だけ、モナドの計算を繰り返す"
description: "Cats の Monad.iterateWhileM。初期値から始めて、条件が成り立つ間だけ f を繰り返す。結果は tailRecM で繰り返すので、回数が多くてもスタックが増えない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Monad.scala"
lines: [120, 126]
format: 2
function: "Monad.iterateWhileM"
difficulty: 3
tags: [関数型, 再帰, イディオム]
---

## ひとことで

Cats の `Monad` には、「値が条件を満たす間、モナドの計算を繰り返す」関数が用意されています。`iterateWhileM` は、初期値から始めて、条件が成り立つ限り `f` を適用し続けます。結果が条件を外れたところで止まり、その値を返します。

## コード

```scala:line-numbers=120
  def iterateWhileM[A](init: A)(f: A => F[A])(p: A => Boolean): F[A] =
    tailRecM(init) { a =>
      if (p(a))
        map(f(a))(Left(_))
      else
        pure(Right(a))
    }
```

## 前提知識

- モナドは、「続けて計算する」ことを型で表す約束です。`Option` や `Either` や `IO` などが当てはまります。
- `F[A]` は、型 `A` の値を、モナドの中に入れた形です。`Option[Int]` なら `F = Option`、`A = Int` になります。
- `tailRecM` は、末尾で再帰する計算を、スタックを増やさずに回すための関数です。`Left` を返すと続け、`Right` を返すと終わります。
- `map(f(a))(Left(_))` は、次の値を `Left` に包んで、「まだ続ける」と伝える書き方です。
- `pure` は、普通の値をモナドの中に入れる関数です。

## 何をしているか

### 1. 条件が成り立つ間は、次の値を作って続ける

`p(a)` が真なら、`f(a)` でモナドの中の次の値を作ります。その結果を `Left` に包むと、`tailRecM` は同じ計算を続けます。

```scala:line-numbers=122
      if (p(a))
        map(f(a))(Left(_))
      else
```

### 2. 条件を外れたら、その値を `Right` で返して止める

`p(a)` が偽なら、今の値 `a` を `Right` に包んで `pure` で返します。`tailRecM` はこれを見て、繰り返しを終えます。

```scala:line-numbers=125
        pure(Right(a))
    }
```

## ここがすごい

- 繰り返しの本体を書くだけで、「続ける」と「止める」を `Left` と `Right` で切り替えています。ループの変数や `while` の構文が要りません。
- `tailRecM` を使うので、何万回繰り返しても、再帰の深さでスタックを使い切ることがありません。
- `f` が `Option` なら途中で `None` が出たところで止まり、`Either` なら `Left` の値で止まります。計算の型に応じて、途中の失敗の扱いも自然に決まります。
- 条件を `p` として受け取るので、「何回まで」「ある値になるまで」など、いろいろな止め方に使えます。

## まとめ

- 値が条件を満たす間だけ計算を続けるには、`Left` で続け、`Right` で止める形にします。
- 末尾の再帰を `tailRecM` に任せると、長い繰り返しでも安全です。
- モナドの型を変えずに繰り返しを書けるので、失敗や非同期の処理にも同じ形が使えます。
