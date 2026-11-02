---
title: "条件が真のときだけ、効果つきの処理を実行する"
description: "Cats の Applicative.whenA。条件が true のときだけ、引数の効果つきの計算を実行する。引数は名前渡しなので、条件が false なら計算は一度も評価されない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Applicative.scala"
lines: [263, 264]
format: 2
function: "Applicative.whenA"
difficulty: 1
tags: [関数型, 遅延評価, イディオム]
---

## ひとことで

Cats の `Applicative` にある `whenA` は、「条件が真のときだけ、この効果つきの処理を行う」を書く道具です。効果つきとは、`Option` や `IO` のように、失敗や入出力を値の中に持つ型のことです。条件が偽のときは、何もせず「何もしない」効果を返します。

## コード

```scala:line-numbers=263
  def whenA[A](cond: Boolean)(f: => F[A]): F[Unit] =
    if (cond) void(f) else unit
```

## 前提知識

- `Applicative[F]` は、値を包む `pure` と、複数の効果つき計算を組み合わせる機能を持つ型の約束です。
- `cond: Boolean` は、真か偽の条件です。
- `f: => F[A]` は、名前渡しの引数です。`=>` が付いていると、引数は使われるまで評価されません。
- `void(f)` は、`f` の結果の値を捨てて、`F[Unit]` にする操作です。
- `unit` は、効果を持つ「何もしない」値です。`F[Unit]` の形をしています。

## 何をしているか

### 1. 条件が真なら、効果つきの処理を実行して結果を捨てる

`cond` が `true` のときは、`f` を評価して実行します。結果の値は必要ないので、`void` で `Unit` にします。

```scala:line-numbers=264
    if (cond) void(f) else unit
```

## ここがすごい

- 条件が偽のとき、名前渡しの `f` は一度も評価されません。書いた処理が実行されない、というのが型で保証されます。
- 「何もしない」効果を `unit` で表すので、条件分岐の結果も同じ型 `F[Unit]` になります。その後の処理と組み合わせやすくなります。
- 条件を先に計算しておけば、わざわざ `if` 文を書いて、ブロックを分ける必要がなくなります。
- 反対の意味の `unlessA` も同じ形で用意されています。条件が偽のときだけ実行する対になっています。

## まとめ

- `whenA` は、条件が真のときだけ効果つきの処理を実行します。
- 引数は名前渡しなので、条件が偽なら処理は評価されません。
- 偽のときの結果は `unit` で、型は `F[Unit]` のままです。
