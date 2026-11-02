---
title: "1 層ずつ解いて、命令か結果かを返す"
description: "Cats の Free.resume。計算の一番外側を 1 層だけ解いて、まだ続きのある命令（Left）か、最終的な値（Right）を返す。左に入れ子になった flatMap も、末尾再帰で組み直しながら進める。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "free/src/main/scala/cats/free/Free.scala"
lines: [84, 96]
format: 2
function: "Free.resume"
difficulty: 3
tags: [関数型, 遅延評価, 再帰]
---

## ひとことで

Cats の `Free` の `resume` は、計算の一番外側を 1 層だけ解きます。結果が確定していれば `Right` で値を返します。まだ命令が残っているなら、その命令と続きを `Left` で返します。解釈するプログラムが、命令を 1 つずつ処理するための基本の関数です。

## コード

```scala:line-numbers=84
  @tailrec
  final def resume(implicit S: Functor[S]): Either[S[Free[S, A]], A] =
    this match {
      case Pure(a)          => Right(a)
      case Suspend(t)       => Left(S.map(t)(Pure(_)))
      case FlatMapped(c, f) =>
        c match {
          case Pure(a)          => f(a).resume
          case Suspend(t)       => Left(S.map(t)(f))
          case FlatMapped(d, g) => d.flatMap(dd => g(dd).flatMap(f)).resume
        }
    }

```

## 前提知識

- `Free[S, A]` の `Pure(a)` は結果の値、`Suspend(t)` は命令（`S` の中に続きを入れた形）、`FlatMapped(c, f)` は「`c` の結果に `f` を当てる」形です。
- `Either[L, R]` は、`Left` か `Right` のどちらかを返す型です。ここでは `Left` が命令、`Right` が結果です。
- `Functor[S]` は、`S` の中の値に関数を当てられる型クラスです。`S.map(t)(f)` で使います。
- `flatMap` の入れ子は、結合法則で組み直して平らにできます。
- `@tailrec` は末尾の再帰をループに変えます。

## 何をしているか

### 1. Pure と Suspend は、そのまま 1 層を返す

`Pure(a)` は `Right(a)` を返します。`Suspend(t)` は、中身の `t` に `Pure` を被せて `Left` で返します。どちらも、これ以上解く必要がない形です。

```scala:line-numbers=87
      case Pure(a)          => Right(a)
      case Suspend(t)       => Left(S.map(t)(Pure(_)))
```

### 2. FlatMapped の中身を見て、続きを決める

`FlatMapped(c, f)` の場合は、`c` の形で分かれます。`c` が `Pure(a)` なら、`f(a)` をそのまま `resume` します。

### 3. 入れ子の flatMap は、組み直してから続ける

`c` が `FlatMapped(d, g)` のときは、`d.flatMap(dd => g(dd).flatMap(f))` に組み直し、もう一度 `resume` します。

```scala:line-numbers=93
          case FlatMapped(d, g) => d.flatMap(dd => g(dd).flatMap(f)).resume
```

## ここがすごい

- 解釈の側は、`Left` を受け取るたびに命令を 1 つ実行し、次の `resume` を呼ぶだけで済みます。計算の構造を気にせずに、命令の列を取り出せます。
- 入れ子の組み直しを末尾の再帰で行うので、左にどれだけ深く入れ子になっていても、スタックを増やしません。
- `Left` に続きを `S.map(t)(Pure(_))` で包むのは、続きをまた `Free` として扱えるようにするためです。型の形が一定に保たれます。
- 1 層だけ解く設計は、`step` や `foldMap` などの上の関数を、同じ部品で組み立てられるようにしています。

## まとめ

- 計算の外側を 1 層ずつ解くと、命令を順に処理する仕組みが作れます。
- 結果と命令を `Either` で分けると、呼び出し側が判定しやすくなります。
- 入れ子の組み直しを末尾再帰で書けば、深い計算にも耐えられます。
