---
title: "空かもしれない列を、先頭から 1 つにまとめて Option で返す"
description: "Cats の Foldable.reduceLeftToOption。途中の結果を Option で持ち、最初の要素は変換関数 f で初期値にし、以後は g で結果に足す。空の列なら None を返す。畳み込みの初期値を持たない場合の定番の書き方。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [128, 132]
format: 2
function: "Foldable.reduceLeftToOption"
difficulty: 3
tags: [関数型, 標準ライブラリ, エラー処理]
---

## ひとことで

Cats の `Foldable` にある `reduceLeftToOption` は、列を左から畳み込みます。ただし、初期値を持たない列も扱えるように、途中の結果を `Option` で持ちます。最初の要素からは特別な変換で始め、要素が 1 つもなければ `None` を返します。

## コード

```scala:line-numbers=128
  def reduceLeftToOption[A, B](fa: F[A])(f: A => B)(g: (B, A) => B): Option[B] =
    foldLeft(fa, Option.empty[B]) {
      case (Some(b), a) => Some(g(b, a))
      case (None, a)    => Some(f(a))
    }
```

## 前提知識

- 畳み込みには、普通、初期値が必要です。しかし、最大値や最小値のように、初期値を決めにくい処理もあります。
- `Option` は、値がある `Some(x)` と、値がない `None` のどちらかを持つ型です。ここでは「まだ途中の結果がない」状態を `None` で表します。
- `f: A => B` は、最初の要素を、途中の結果の型 `B` に変換する関数です。
- `g: (B, A) => B` は、途中の結果と次の要素から、新しい途中の結果を作る関数です。
- `Option.empty[B]` は、`None` を型 `B` で作る書き方です。

## 何をしているか

### 1. 途中の結果を None で始める

`foldLeft` の初期値は `Option.empty[B]` です。まだ要素を見ていないので、途中の結果は「ない」状態から始まります。

```scala:line-numbers=129
    foldLeft(fa, Option.empty[B]) {
```

### 2. 途中の結果があれば、g で足し、なければ f で始める

途中の結果が `Some(b)` なら、`g(b, a)` で足し合わせます。`None` なら、最初の要素なので `f(a)` で新しい途中の結果を作ります。

```scala:line-numbers=130
      case (Some(b), a) => Some(g(b, a))
      case (None, a)    => Some(f(a))
```

### 3. 結果を Option のまま返す

要素が 1 つもなければ、途中の結果は `None` のまま残り、そのまま返ります。要素があれば `Some` の値が返ります。

```scala:line-numbers=132
    }
```

## ここがすごい

- 初期値の代わりに `Option` を使うので、「空の列」と「値がある列」を、例外を使わずに区別できます。
- 最初の要素だけ特別な関数 `f` で扱うので、型を変えながら畳み込めます。
- 要素の型と結果の型が違っても、同じ骨組みで書けます。
- `reduceLeftOption` は、この関数に恒等関数を渡すだけで作られています。部品の組み合わせで、似た関数を簡単に用意できます。

## まとめ

- 初期値がない畳み込みは、途中の結果を `Option` で持つと、空の場合を安全に扱えます。
- 最初の要素だけ別の関数で扱うと、型の変換も一緒に書けます。
- 基本の関数に別の関数を渡して、似た処理を作ると、コードの重複が減ります。
