---
title: "右から畳み込む処理を、Eval で遅らせて安全に進める"
description: "Cats の NonEmptyList.foldRight。先頭から末尾まで Eval を使って右から畳み込む。中身は List の foldRight に任せ、結果は Eval のまま返す。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/NonEmptyList.scala"
lines: [346, 347]
format: 2
function: "NonEmptyList.foldRight"
difficulty: 2
tags: [遅延評価, 再帰, 関数型]
---

## ひとことで

Cats の `NonEmptyList` を、右（末尾）から畳み込みます。`foldRight` は、結果の計算を `Eval` という遅らせる箱に包んで返します。畳み込みの途中で、関数が右側の結果を使うかどうかを、利用者が決められます。

## コード

```scala:line-numbers=346
  def foldRight[B](lb: Eval[B])(f: (A, Eval[B]) => Eval[B]): Eval[B] =
    Foldable[List].foldRight(toList, lb)(f)
```

## 前提知識

- `foldRight` は、リストを右（末尾）から左へ向かって、値を組み合わせていく操作です。
- `Eval[B]` は、値が必要になるまで計算を遅らせる箱です。`value` を呼んだときに、初めて計算されます。
- `f: (A, Eval[B]) => Eval[B]` は、要素と、右側の結果（まだ計算していない `Eval`）を受け取る関数です。
- `Foldable[List]` は、リストの畳み込みを提供する型の約束です。ここでは、その `foldRight` に処理を任せています。

## 何をしているか

### 1. `toList` を作り、`List` の `foldRight` に任せる

`NonEmptyList` を `toList` でリストにし、`Foldable[List].foldRight` に、初期値 `lb` と関数 `f` を渡します。畳み込みの中身は、`List` の仕組みがそのまま使われます。

```scala:line-numbers=347
    Foldable[List].foldRight(toList, lb)(f)
```

## ここがすごい

- 右側の結果を `Eval` で受け取るので、関数は右側を使わずに止まることもできます。途中で打ち切れる畳み込みになります。
- 畳み込みの実装を `List` に任せるので、同じ仕組みを二重に書きません。
- 結果が `Eval` のまま返るので、呼び出し側が `value` を呼ぶまで計算は行われません。
- 非空のリストでも、初期値 `lb` を別に渡す形なので、型の上で結果の型を自由に決められます。

## まとめ

- `foldRight` は、リストを右から畳み込み、結果を `Eval` で返します。
- 中身は `toList` と `List` の `foldRight` に任せた一行です。
- 右側の結果を遅らせて受け取るので、途中で打ち切ることもできます。
