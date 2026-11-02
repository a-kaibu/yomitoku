---
title: "右からの畳み込みを、スタックを使わずに遅らせて行う"
description: "Cats の Foldable.foldRightDefer。要素の右側の処理を Defer で包んで後回しにし、要素数が多くても JVM のスタックを使い切らない右畳み込みを作る。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [118, 126]
format: 2
function: "Foldable.foldRightDefer"
difficulty: 3
tags: [関数型, 遅延評価, 再帰]
---

## ひとことで

Cats の `Foldable` にある `foldRightDefer` は、コレクションの要素を右から順に畳み込む関数です。普通に右畳み込みを再帰で書くと、要素数だけスタックが深くなります。ここでは、右側の続きを `Defer` で包んで後回しにし、要素数が多くても安全に実行できるようにしています。

## コード

```scala:line-numbers=118
  def foldRightDefer[G[_]: Defer, A, B](fa: F[A], gb: G[B])(fn: (A, G[B]) => G[B]): G[B] = {
    def loop(source: Source[A]): G[B] = {
      source.uncons match {
        case Some((next, s)) => fn(next, Defer[G].defer(loop(s.value)))
        case None            => gb
      }
    }
    Defer[G].defer(loop(Source.fromFoldable(fa)(using self)))
  }
```

## 前提知識

- 畳み込み（fold）は、コレクションの要素を 1 つの値にまとめる操作です。右畳み込み（foldRight）は、末尾の要素から順にまとめていきます。
- `Defer[G]` は、計算を「まだ実行しない箱」に包むための型クラスです。`defer` で包むと、必要になるまで中身を評価しません。
- `Source` は Cats の内部の型で、要素を 1 つずつ先頭から取り出せる仕組みです。`uncons` は、先頭と残りの組を返します。
- `Some((next, s))` は、取り出せたときの形です。`None` は、要素がなくなったときの形です。
- `gb` は、最後の空の場合に返す値です。

## 何をしているか

### 1. 要素の先頭を取り出し、残りを後回しにする

`loop` は、`source` の先頭 `next` を取り出し、残りの処理を `Defer` で包みます。

```scala:line-numbers=121
        case Some((next, s)) => fn(next, Defer[G].defer(loop(s.value)))
```

`fn(next, Defer[G].defer(loop(s.value)))` の `loop(s.value)` は、まだ実行されません。`fn` が必要になったときだけ、残りの右側の計算が始まります。

### 2. 要素がなければ、初期値を返す

`uncons` が `None` を返したら、要素がもうないので、初期値 `gb` をそのまま返します。

### 3. 全体を Defer で包んで開始する

最後の行では、`loop` 全体を `Defer` で包み、最初の要素から `Source` を作って開始します。

```scala:line-numbers=125
    Defer[G].defer(loop(Source.fromFoldable(fa)(using self)))
```

## ここがすごい

- 右畳み込みを素直に再帰で書くと、要素数だけ呼び出しが積み重なり、長いリストでは例外が起きます。ここでは、続きを値として包むので、1 回ごとの呼び出しは浅く済みます。
- `Defer` の型クラスに抽象化しているので、`Eval` や `IO` など、遅延を扱える型のどれでも同じ関数で使えます。
- `foldRight` が `Eval` を使うのに対して、この関数は `G` を任意の `Defer` 型で扱えます。型を柔軟に選べるのが特徴です。
- `Source.fromFoldable` で、コレクションの種類を先に統一しているので、リストでも木でも同じ処理で畳み込めます。

## まとめ

- 右畳み込みの続きを `Defer` で包むと、深い再帰を避けられます。
- 途中の計算を値として持つと、必要になるまで実行を遅らせられます。
- 抽象化された `Defer` を使うと、同じ仕組みを色々な計算の型で使えます。
