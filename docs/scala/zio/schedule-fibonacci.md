---
title: "待ち時間を、フィボナッチ数列のように少しずつ長くする"
description: "ZIO の Schedule.fibonacci。繰り返しの待ち時間を、直前の 2 つの待ち時間の和にする。1、1、2、3、5 と、フィボナッチ数列に沿って長くなっていく。unfold で状態を 2 つ持ち、その状態を更新して待ち時間を取り出す。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Schedule.scala"
lines: [1276, 1283]
format: 2
function: "Schedule.fibonacci"
difficulty: 3
tags: [遅延評価, 再帰, 並行処理]
---

## ひとことで

ZIO の `Schedule` は、失敗した処理を再試行するときの待ち時間などを決める仕組みです。`fibonacci` は、待ち時間を「直前の 2 つの待ち時間の和」にします。最初の待ち時間が 1 秒なら、待ち時間は 1、1、2、3、5 秒と、フィボナッチ数列に沿って長くなります。

## コード

```scala:line-numbers=1276
  def fibonacci(
    one: Duration
  )(implicit trace: Trace): Schedule.WithState[(Duration, Duration), Any, Any, Duration] =
    delayed[Any, Any] {
      unfold[(Duration, Duration)]((one, one)) { case (a1, a2) =>
        (a2, a1 + a2)
      }.map(_._1)
    }
```

## 前提知識

- フィボナッチ数列は、直前の 2 つの数の和を次の数にする数列です。1、1、2、3、5、8 と続きます。
- `Duration` は、時間の長さを表す型です。`a1 + a2` のように、足し算ができます。
- `Schedule` は、「いつ、何回繰り返すか」を表す型です。`delayed` は、繰り返しの間隔に待ち時間を加える関数です。
- `unfold` は、状態を 1 つずつ進めながら、値の列を作る関数です。状態と値を返す関数を渡します。
- `.map(_._1)` は、組の 1 番目の値だけを取り出す書き方です。

## 何をしているか

### 1. 状態を、直前の 2 つの待ち時間として持つ

`unfold` の初期の状態は `(one, one)` です。最初の 2 つの待ち時間を、どちらも `one` にしておきます。こうすると、1、1 から数列が始まります。

```scala:line-numbers=1279
    delayed[Any, Any] {
      unfold[(Duration, Duration)]((one, one)) { case (a1, a2) =>
```

### 2. 次の状態を、和で作る

関数 `{ case (a1, a2) => (a2, a1 + a2) }` は、今の状態から次の状態を作ります。新しい状態は、後ろの値 `a2` と、2 つの和 `a1 + a2` の組です。

```scala:line-numbers=1281
        (a2, a1 + a2)
```

### 3. 各回の待ち時間として、1 番目の値を使う

`unfold` が作る列の、1 番目の値 `_._1` が、今回の待ち時間になります。状態の組の前の値を取り出すので、数列の 1、1、2、3 が順番に使われます。

```scala:line-numbers=1282
      }.map(_._1)
```

## ここがすごい

- 状態を 2 つの値の組で持つだけで、数列が作れます。過去の値を配列などに溜めず、直前の 2 つだけを覚えています。
- 数列の作り方を、状態の更新の 1 行に書いています。数式とプログラムが、ほぼ 1 対 1 で対応しています。
- 待ち時間が増える速さは、指数的に増える方式より緩やかです。すぐに長くしすぎたくない場面に向いています。
- 同じ仕組みで、別の数列にも変えられます。更新の式を変えれば、待ち時間の増え方を自由に決められます。

## まとめ

- 直前の値に頼る数列は、直前の 2 つを状態として持つと、少ない記憶で作れます。
- 状態の更新を 1 行にすると、数列の決まりがそのままコードになります。
- 再試行の待ち時間を増やす方式は、目的に合わせて選ぶと良いです。
