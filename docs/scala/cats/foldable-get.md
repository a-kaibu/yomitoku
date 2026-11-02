---
title: "何番目の要素かを、途中で止めながら探す"
description: "Cats の Foldable.get。何番目（0 から数える）の要素を取り出すとき、foldM の途中で Left を返して、見つかった時点で探索を止める。リストに限らず、どんな Foldable でも使える。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [325, 333]
format: 2
function: "Foldable.get"
difficulty: 2
tags: [関数型, イテレータ, 標準ライブラリ]
---

## ひとことで

Cats の `Foldable` は、リストや木のように「中の要素を順に畳み込める」型の約束です。その `get` は、先頭から数えて `idx` 番目の要素を `Option` で返します。`idx` が範囲の外なら `None` です。

## コード

```scala:line-numbers=325
  def get[A](fa: F[A])(idx: Long): Option[A] =
    if (idx < 0L) None
    else
      foldM[Either[A, *], A, Long](fa, 0L) { (i, a) =>
        if (i == idx) Left(a) else Right(i + 1L)
      } match {
        case Left(a)  => Some(a)
        case Right(_) => None
      }
```

## 前提知識

- `Foldable` は、中身を左から右へ順番に訪ねられる型です。`List` や `Vector` や `Option` などが当てはまります。
- `foldM` は、畳み込みの途中で、モナド（`Either` や `Option` などの、続けて計算できる入れ物）を使える畳み込みです。
- `Either` は、`Left` と `Right` のどちらかを持つ型です。ここでは、`Left` を「見つかった」、`Right` を「まだ」の意味で使っています。
- `Long` は、64 ビットの整数です。インデックスを `Int` ではなく `Long` で扱うので、大きな構造にも対応できます。
- `Option` は、`Some(値)` か `None` を持つ型です。値が無いことを例外ではなく型で表します。

## 何をしているか

### 1. 負の番号は、最初から無いとする

`idx` が 0 より小さければ、そもそも要素は無いので `None` を返します。

```scala:line-numbers=326
    if (idx < 0L) None
```

### 2. 数えながら、目的の番号に着いたら `Left` で止める

`foldM` の状態 `i` は、今まで何番目まで数えたかを表します。今の番号が `idx` と同じなら、その要素を `Left(a)` で返します。違えば、番号を 1 つ増やして `Right(i + 1)` にして次へ進みます。

```scala:line-numbers=328
      foldM[Either[A, *], A, Long](fa, 0L) { (i, a) =>
        if (i == idx) Left(a) else Right(i + 1L)
      } match {
```

### 3. `Left` なら見つかり、`Right` なら範囲外

`foldM` の結果が `Left` なら、そこで止まった要素が答えなので `Some(a)` にします。最後まで `Right` だったら、番号が範囲の外だったので `None` にします。

```scala:line-numbers=331
        case Left(a)  => Some(a)
        case Right(_) => None
      }
```

## ここがすごい

- 目的の要素が見つかった時点で、`Left` を返して畳み込みを止めます。`Left` を返すと、以降の要素を訪ねないので、無駄な探索が省けます。
- 「数えること」と「取り出すこと」を、状態と結果の 2 つに分けて書いています。`i` を数えるだけで、要素は `a` として受け取ります。
- `Foldable` の上に作られているので、リストだけでなく、木やオプションにも同じ書き方で使えます。
- 負の番号を最初に弾くので、畳み込みを無駄に始めません。

## まとめ

- 畳み込みは、途中で止めたいときに `Left` のような型を返すと、早く抜けられます。
- `foldM` と `Either` を組み合わせると、番号を数えながら要素を取り出せます。
- 型の約束（`Foldable`）に頼ると、同じ関数がいろいろな入れ物で動きます。
