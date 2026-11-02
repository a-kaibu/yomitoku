---
title: "最小の値が複数あれば、全部まとめて集める"
description: "Cats の Foldable.minimumList。最小の値が同じ順位で複数あるとき、すべてを順番どおりにリストに集める。比較結果の 3 通りで、リストを捨てる、足す、作り直すを切り替える。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [269, 274]
format: 2
function: "Foldable.minimumList"
difficulty: 3
tags: [関数型, ソート, イディオム]
---

## ひとことで

Cats の `Foldable` の `minimumList` は、中の要素のうち、いちばん小さい値をすべて集めて `List` で返します。たとえば `List(3, 1, 2, 1)` からは `List(1, 1)` を返します。最小が 1 つなら、その 1 つだけが入ったリストです。

## コード

```scala:line-numbers=269
  def minimumList[A](fa: F[A])(implicit A: Order[A]): List[A] =
    foldLeft(fa, List.empty[A]) {
      case (l @ (b :: _), a) if A.compare(a, b) > 0  => l
      case (l @ (b :: _), a) if A.compare(a, b) == 0 => a :: l
      case (_, a)                                    => a :: Nil
    }.reverse
```

## 前提知識

- `Order` は、2 つの値の大小を比べる型の約束です。`compare` は、小さいなら負、同じなら 0、大きいなら正の数を返します。
- `foldLeft` は、先頭から順に、途中の結果と要素を組み合わせていく畳み込みです。
- `List` は、先頭に要素を足すのが速い、一方向の連結リストです。`a :: l` は、`a` を先頭に足す書き方です。
- パターンマッチの `case (l @ (b :: _), a)` は、途中の結果 `l` を全体として名前をつけながら、先頭の要素 `b` も取り出す書き方です。
- `.reverse` は、リストの並びを逆順にします。先頭に足していった結果を、元の順番に戻すために使います。

## 何をしているか

### 1. 途中の結果が大きければ、捨てる

途中の結果 `l` の先頭 `b` より今の要素 `a` が大きければ、`a` は最小ではないので、`l` をそのまま使います。

```scala:line-numbers=270
    foldLeft(fa, List.empty[A]) {
```

### 2. 同じ大きさなら、先頭に足す

`a` と `b` が同じ大きさなら、`a` も最小のグループに入るので、先頭に足します。

```scala:line-numbers=271
      case (l @ (b :: _), a) if A.compare(a, b) > 0  => l
```

### 3. より小さければ、それまでの結果を捨てて作り直す

どの場合にも当てはまらないとき、途中の結果は空か、今の `a` より大きな値のグループです。そこで `a :: Nil` という 1 要素だけのリストを新しく作ります。

```scala:line-numbers=272
      case (l @ (b :: _), a) if A.compare(a, b) == 0 => a :: l
```

### 4. 最後に、順番を戻す

先頭に足していくので、結果は逆順になっています。最後に `.reverse` で、元の並びの順番に戻します。

```scala:line-numbers=273
      case (_, a)                                    => a :: Nil
    }.reverse
```

## ここがすごい

- 1 回の走査だけで、最小の値をすべて集めます。最小を探してから、もう一度探すような無駄がありません。
- 同じ値の要素は、比較が 0 になったときだけ足します。Order が「同じ」と判断する値をまとめて返せます。
- 途中の結果を捨てる場合は、新しいリストを 1 つだけ作ります。古いリストを作り直すことは少なく、メモリを節約しています。
- 比較は `Order` の型の約束に任せるので、数でも文字列でも、独自の型でも同じ関数で使えます。

## まとめ

- 最小の値を集めるには、1 回の走査で、比較の結果に応じてリストを捨てる、足す、作り直すの 3 通りで処理します。
- 先頭に足すと速いリストでは、最後に逆順を直す習慣が必要です。
- 型の約束（`Order`）で大小を決めると、同じ書き方を広く使えます。
