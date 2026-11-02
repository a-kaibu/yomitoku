---
title: "効果つきの写像を、右から順に組み合わせて一つにまとめる"
description: "Cats の Foldable.foldMapA。各要素を G[B] に変え、Applicative の map2Eval で右から組み合わせ、Monoid の combine で値をまとめる。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [566, 567]
format: 2
function: "Foldable.foldMapA"
difficulty: 3
tags: [関数型, イディオム, 遅延評価]
---

## ひとことで

Cats の `Foldable` は、要素の集まりを一つにまとめる型の約束です。`foldMapA` は、各要素を効果つき（`Option` や `IO` など）の値に変えて、それらを順番に組み合わせます。最後に、中身の値を `Monoid` の方法でまとめた、一つの効果つき値を返します。

## コード

```scala:line-numbers=566
  def foldMapA[G[_], A, B](fa: F[A])(f: A => G[B])(implicit G: Applicative[G], B: Monoid[B]): G[B] =
    foldRight(fa, Eval.now(G.pure(B.empty)))((a, egb) => G.map2Eval(f(a), egb)(B.combine)).value
```

## 前提知識

- `Monoid[B]` は、空の値 `empty` と、二つの値をまとめる `combine` を持つ型の約束です。例えば、整数の足し算や、文字列の連結がこれにあたります。
- `Applicative[G]` は、値を包む `pure` と、効果つきの値を組み合わせる `map2Eval` を持つ型の約束です。
- `Eval` は、計算を必要になるまで遅らせる箱です。`value` で、計算の結果を取り出します。
- `foldRight` は、要素を右（末尾）から左へ向かってたたみ込む操作です。
- `B.combine` は、二つの `B` を Monoid の方法でまとめる関数です。`B.empty` が、まとめの出発点になります。

## 何をしているか

### 1. 空の値を、効果つきの初期値として用意する

最後の要素の後ろに置く初期値は、`G.pure(B.empty)` です。効果を持たない空の値を、`G` の中に入れておきます。`Eval.now` で包み、計算を遅らせられるようにします。

```scala:line-numbers=567
    foldRight(fa, Eval.now(G.pure(B.empty)))((a, egb) => G.map2Eval(f(a), egb)(B.combine)).value
```

### 2. 各要素の結果と、右側の結果を、`map2Eval` でまとめる

`foldRight` は、要素を右から順に見ます。各要素で `f(a)` を計算し、右側の結果 `egb` と `map2Eval` で組み合わせます。値は `B.combine` でまとめられます。

## ここがすごい

- 効果つきの値を組み合わせるとき、途中で失敗が出たら、そこで全体が失敗になります。`Option` の `None` などが、そのまま全体に伝わります。
- `Monoid` を使うので、どの型の値をまとめるかを、呼び出し側が自由に決められます。
- `Eval` で遅らせて右から組み立てるので、長い集まりでも、スタックを使い切りにくくなっています。
- 「写像（map）」と「まとめ（fold）」を一度に行うので、中間のリストを作らずに済みます。

## まとめ

- `foldMapA` は、各要素を効果つきの値に変えて、順番に組み合わせます。
- 値は `Monoid` の `combine` でまとめられ、効果は `Applicative` で組み合わされます。
- 初期値は `pure(empty)` で、右から順に組み立てられます。
