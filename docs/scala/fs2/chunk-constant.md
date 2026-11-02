---
title: "同じ値を何万個並べても、メモリを使わないチャンク"
description: "fs2 の Chunk.constant。同じ値が続くだけのデータを配列に並べず、値と個数だけを持つ Constant として表す。分割や先頭の取り出しも、配列を作らずに済む。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [634, 657]
format: 2
function: "Chunk.constant"
difficulty: 2
tags: [データ構造, 最適化, イテレータ]
---

## ひとことで

fs2 の `Chunk` は、ストリームの要素をまとめて扱う不変の配列のような型です。その中の `constant` は、同じ値が `size` 個続くチャンクを作ります。配列に全部の要素を入れず、値と個数だけを持つことで、大きな繰り返しも軽く扱えます。

## コード

```scala:line-numbers=634
  def constant[A](value: A, size: Int): Chunk[A] =
    if (size <= 0) empty
    else if (size == 1) singleton(value)
    else new Constant(value, size)

  final class Constant[A](value: A, override val size: Int) extends Chunk[A] {

    def apply(i: Int): A =
      if (0 <= i && i < size) value else throw new IndexOutOfBoundsException()

    def copyToArray[O2 >: A](xs: Array[O2], start: Int): Unit = {

      @tailrec
      def go(ix: Int): Unit =
        if (ix < size) {
          xs(start + ix) = value
          go(ix + 1)
        }
      go(0)
    }

    protected def splitAtChunk_(n: Int): (Chunk[A], Chunk[A]) =
      constant(value, n) -> constant(value, size - n)
  }
```

## 前提知識

- fs2 は、Scala の関数型ストリームのライブラリです。データを少しずつ流しながら処理します。
- `Chunk` は、まとめて扱うための、不変な要素の並びです。配列に近い形で、要素を一括で処理できます。
- `final class` は、継承できないクラスです。`extends Chunk[A]` で `Chunk` の仕組みを実装しています。
- `copyToArray` は、チャンクの要素を配列の指定位置にコピーする操作です。
- `->` は、2 つの値をペアにする書き方です。`a -> b` は `(a, b)` と同じ意味です。

## 何をしているか

### 1. 要素数で作り方を分ける

`constant` は、まず要素数で分岐します。0 以下なら空、1 つなら単一の要素、それ以外のときだけ `Constant` のインスタンスを作ります。

```scala:line-numbers=635
    if (size <= 0) empty
    else if (size == 1) singleton(value)
    else new Constant(value, size)
```

要素が 0 や 1 のときは、専用の小さな実装を使うので、無駄な仕組みが付かずに済みます。

### 2. 配列を作らずに、値を何度も返す

`Constant` の `apply` は、添字が範囲内なら `value` をそのまま返します。配列のような中身を持たないので、要素数が多くてもメモリは同じです。

### 3. 分割しても、同じ形のまま

`splitAtChunk_` は、チャンクを 2 つに割るとき、同じ値の 2 つの `constant` を返します。

```scala:line-numbers=656
      constant(value, n) -> constant(value, size - n)
```

分割した後の塊も、値と個数だけで表せるので、分割の処理が配列のコピーにはなりません。

## ここがすごい

- 1 億個の同じ値を配列にすると、約数百 MB のメモリが必要です。`Constant` は、値 1 つと個数だけで済みます。
- `copyToArray` は、必要になったときだけ配列にコピーします。普段は配列を作らず、本当に必要なときだけ実体を作るという遅延の考え方です。
- 要素数の分岐を `constant` の中に閉じ込めているので、利用者は実装の違いを意識せずに使えます。
- 分割の結果も `constant` を返すので、どれだけ切り分けても、同じ種類の表現が保たれます。

## まとめ

- 同じ値が続くデータは、値と個数だけで表すとメモリを節約できます。
- 小さい場合は専用の実装に分けると、余計な仕組みが増えません。
- 配列へのコピーは、本当に必要になったときだけ行うと効率的です。
