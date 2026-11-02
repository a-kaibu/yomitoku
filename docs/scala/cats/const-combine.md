---
title: "値の中身だけを足し合わせ、型 B は無視する"
description: "Cats の Const.combine。Const[A, B] は B を持たない箱で、combine は A の値どうしを Semigroup で足す。B の型は一切使わず、結果も同じ B の型を持つ。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Const.scala"
lines: [41, 42]
format: 2
function: "Const.combine"
difficulty: 1
tags: [型システム, 関数型, イディオム]
---

## ひとことで

Cats の `Const[A, B]` は、`A` の値を持つ箱です。`B` の型は、見た目の上でだけ存在し、中には値として入っていません。`combine` は、二つの `Const` の `A` の値を足し合わせます。`B` は関係ないので、そのまま型を引き継ぎます。

## コード

```scala:line-numbers=41
  def combine(that: Const[A, B])(implicit A: Semigroup[A]): Const[A, B] =
    Const(A.combine(getConst, that.getConst))
```

## 前提知識

- `Const[A, B]` は、`A` の値（`getConst`）を一つだけ持つ型です。`B` は、型の上でだけ使われる「幽霊」の型です。
- `Semigroup[A]` は、二つの `A` を一つにまとめる方法の約束です。例えば整数の足し算、文字列の連結などがあります。
- `A.combine(x, y)` は、`Semigroup` の方法で二つの値をまとめる操作です。
- `implicit A: Semigroup[A]` は、暗黙の引数として渡される約束です。型ごとに適切な方法が自動で選ばれます。
- `getConst` は、箱の中の `A` の値を取り出すメソッドです。

## 何をしているか

### 1. 二つの `A` の値を、`Semigroup` で一つにまとめる

`getConst` で両方の `A` の値を取り出し、`A.combine` でまとめます。その結果を、新しい `Const` に入れて返します。

```scala:line-numbers=42
    Const(A.combine(getConst, that.getConst))
```

## ここがすごい

- `B` の値を一切扱いません。`B` は型の情報としてだけ使われるので、組み合わせても `B` は変わりません。
- `Semigroup[A]` を渡すだけで、どんな `A` にも同じ仕組みで足し算ができます。整数でも、文字列でも、リストでも使えます。
- `combine` の戻り値の型が `Const[A, B]` で、入力と同じです。だから、何度でも続けて組み合わせられます。
- 関数を一切呼ばずに、値を一つだけ足すので、処理は素直で軽いです。

## まとめ

- `combine` は、二つの `Const[A, B]` の `A` の値を、`Semigroup` で足します。
- `B` は型として残るだけで、計算には使われません。
- 結果も `Const[A, B]` なので、組み合わせを続けられます。
