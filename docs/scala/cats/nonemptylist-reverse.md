---
title: "末尾再帰で、リストを逆順に並べ直す"
description: "Cats の NonEmptyList.reverse。先頭を外して、残りを一つずつ新しい累積リストの先頭へ移す。@tailrec で、深い再帰でもスタックを増やさない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/NonEmptyList.scala"
lines: [420, 427]
format: 2
function: "NonEmptyList.reverse"
difficulty: 2
tags: [再帰, データ構造, 関数型]
---

## ひとことで

`NonEmptyList` の `reverse` は、要素の並びを逆にした新しいリストを返します。内部では、`go` という補助関数を末尾再帰で呼んでいます。`@tailrec` が付いているので、要素が多くても関数呼び出しの積み重ねが増えません。

## コード

```scala:line-numbers=420
  def reverse: NonEmptyList[A] = {
    @tailrec
    def go(h: A, rest: List[A], acc: List[A]): NonEmptyList[A] =
      rest match {
        case Nil      => NonEmptyList(h, acc)
        case h1 :: t1 => go(h1, t1, h :: acc)
      }
    go(head, tail, Nil)
```

## 前提知識

- `NonEmptyList(h, rest)` は、先頭 `h` と残り `rest` からなるリストです。
- `List` は、`h :: t` の形で、先頭に要素を足していける連結リストです。`Nil` は空のリストです。
- 末尾再帰は、再帰の呼び出しが関数の最後に来る形です。結果をそのまま次の呼び出しに渡せるので、積み重ねを省けます。
- `@tailrec` は、コンパイラに「末尾再帰になっているか」を確かめさせる注釈です。違えばコンパイルエラーになります。
- `acc` は、途中の結果をためておく累積の変数です。ここでは、逆順に並んだ要素のリストを作っています。

## 何をしているか

### 1. 残りが空になったら、累積した結果を返す

`rest` が `Nil`（空）になったとき、いま持っている `h` を先頭に、`acc` を残りとして `NonEmptyList` を作って返します。

```scala:line-numbers=424
        case Nil      => NonEmptyList(h, acc)
```

### 2. 残りの先頭を、累積の先頭へ移して、同じ `go` を呼ぶ

残りの先頭 `h1` を取り出し、`h :: acc` の形で累積の先頭に足します。それから、残りの続きで `go` を呼びます。この呼び出しは関数の最後にあります。

```scala:line-numbers=425
        case h1 :: t1 => go(h1, t1, h :: acc)
```

### 3. 最初の呼び出しは、先頭と残りで始める

`reverse` は、`go(head, tail, Nil)` で始めます。最初の先頭が、累積の中で一番最後になるように動きます。

```scala:line-numbers=427
    go(head, tail, Nil)
```

## ここがすごい

- 逆順のリストを、一つずつ先頭に足して作ります。`List` の先頭への追加は速いので、この作り方が自然です。
- `@tailrec` のおかげで、要素が何千個あっても、関数の呼び出しが積み重なりません。コンパイラが確かめてくれます。
- 補助関数 `go` の中で、非空という約束を保ったまま結果を作ります。`NonEmptyList` を返すので、空の心配は要りません。
- 外側の関数は、初期値を渡すだけで短く書けています。仕組みを補助関数にまとめる、よくある書き方です。

## まとめ

- `reverse` は、残りを一つずつ累積の先頭へ移して、逆順のリストを作ります。
- 補助関数 `go` は `@tailrec` の末尾再帰で、深くなりません。
- 初期値を `Nil` にして、最初の先頭を最後に回すのがポイントです。
