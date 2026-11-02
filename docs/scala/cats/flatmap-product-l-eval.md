---
title: "次の計算は行うが、元の値は捨てずに返す"
description: "Cats の FlatMap.productLEval。前の値 a を保ったまま、Eval で遅らせた次の計算 fb を実行し、その結果を捨てて a を返す。前の値を、後ろの効果の後に残す形。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/FlatMap.scala"
lines: [99, 99]
format: 2
function: "FlatMap.productLEval"
difficulty: 2
tags: [遅延評価, 関数型, イディオム]
---

## ひとことで

Cats の `FlatMap` にある `productLEval` は、前の値 `a` を残したまま、次の計算 `fb` を実行します。`fb` の結果は捨てて、最後に `a` を返します。前の値を、後ろの効果が終わった後も使いたいときに使います。

## コード

```scala:line-numbers=99
  def productLEval[A, B](fa: F[A])(fb: Eval[F[B]]): F[A] = flatMap(fa)(a => as(fb.value, a))
```

## 前提知識

- `productL` は、前の結果を残して、後ろの計算の結果を捨てる操作です。`L` は左側の値を残すという意味です。
- `Eval[F[B]]` は、`F[B]` の計算を、値が必要になるまで遅らせる箱です。`value` で取り出すと、そこで計算が行われます。
- `as(x, a)` は、効果 `x` を実行してから、その結果を捨てて `a` を返す操作です。
- `a => as(fb.value, a)` は、受け取った `a` を保ったまま、`fb` の効果を実行する関数です。

## 何をしているか

### 1. 前の値 `a` を取り出し、次の計算 `fb` を実行する

`flatMap(fa)` は、`fa` の値 `a` を取り出します。次に `fb.value` を実行して、次の効果つき計算を行います。

### 2. 次の計算の結果を捨て、`a` を返す

`as(fb.value, a)` は、`fb` の結果を捨てて、元の `a` を結果にします。これで、前の値が後ろの効果の後にも残ります。

```scala:line-numbers=99
  def productLEval[A, B](fa: F[A])(fb: Eval[F[B]]): F[A] = flatMap(fa)(a => as(fb.value, a))
```

## ここがすごい

- 前の値を残しながら、後ろの効果を実行できます。結果の形は、前の計算と同じです。
- 次の計算は `Eval` で遅らせて渡すので、前の計算が失敗すれば、実行されません。
- `productR`（右を残す）と対になっていて、どちらを残すかを名前で選べます。
- 「値を残す」「効果だけ行う」を、関数一つで表せるので、処理の流れが読みやすくなります。

## まとめ

- `productLEval` は、前の値 `a` を残し、`Eval` で遅らせた次の計算を実行します。
- 次の計算の結果は捨てて、`a` を結果として返します。
- 中身は `flatMap` と `as` を組み合わせた一行です。
