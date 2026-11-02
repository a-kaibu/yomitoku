---
title: "両方の値があっても、右だけを取り出して Either にする"
description: "Cats の Ior.toEither。Left は Left に、Right は Right に、Both は右の値だけを残して Right にする。fold の 3 つ目の関数で、左の情報を捨てる場所を決めている。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Ior.scala"
lines: [412, 412]
format: 2
function: "Ior.toEither"
difficulty: 1
tags: [エラー処理, 型システム, イディオム]
---

## ひとことで

Cats の `Ior[A, B]` は、左、右、両方のどれかを持つ型です。`toEither` は、これを `Either[A, B]` に変えます。両方を持つ場合は、右の値を残し、左の値は捨てます。エラーを扱う `Either` の形に合わせるための変換です。

## コード

```scala:line-numbers=412
  final def toEither: Either[A, B] = fold(Left(_), Right(_), (_, b) => Right(b))
```

## 前提知識

- `Either[A, B]` は、`Left(a)` か `Right(b)` のどちらかを持つ型です。慣習として、`Right` を成功、`Left` を失敗に使います。
- `Ior[A, B]` の `Both(a, b)` は、左と右の両方を持つ状態です。`Either` にはこの状態がありません。
- `fold` は、3 つの場合（左、右、両方）それぞれに関数を当てる操作です。
- `Left(_)` と `Right(_)` は、受け取った値をそのまま包む関数の省略形です。
- `(_, b) => Right(b)` は、両方の場合に左 `_` を無視して、右 `b` を `Right` に包む関数です。

## 何をしているか

### 1. 3 つの場合を `fold` で `Either` に変える

`fold` に、左だけ、右だけ、両方の 3 つの変換を渡します。左だけなら `Left`、右だけなら `Right`、両方なら右の値だけ残して `Right` にします。

```scala:line-numbers=412
  final def toEither: Either[A, B] = fold(Left(_), Right(_), (_, b) => Right(b))
```

## ここがすごい

- `Either` にない「両方ある」状態を、どう変換するかを 3 つ目の関数に明示しています。どの値を残すかが、一箇所で決まります。
- 両方の場合に右を選ぶのは、「値が取れたなら成功として扱う」という慣習に沿っています。
- `fold` 一つで 3 つの場合を書くので、`match` の書き忘れがありません。
- 変換は一回の関数呼び出しで済み、余分なデータを作りません。

## まとめ

- `toEither` は、`Ior` を `Either` に変えます。
- 左だけと右だけは、そのまま `Left` と `Right` になります。
- 両方を持つ場合は、右の値を残すと決めて、左の値は捨てます。
