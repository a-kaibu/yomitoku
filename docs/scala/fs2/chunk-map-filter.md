---
title: "変換して値があるものだけを集める"
description: "fs2 の Chunk.mapFilter。各要素を Option に変換し、Some の中身だけを新しい Chunk に集める。None の要素は捨てる。map と filter を 1 回の走査で行う。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [258, 266]
format: 2
function: "Chunk.mapFilter"
difficulty: 2
tags: [関数型, イテレータ, 最適化]
---

## ひとことで

fs2 の `Chunk` で、要素を変換しながら、変換できないものを捨てるのが `mapFilter` です。変換関数は `Option` を返します。`Some` なら中身を残し、`None` なら捨てます。`map` と `filter` を 1 回の走査にまとめた形です。

## コード

```scala:line-numbers=258
  def mapFilter[O2](f: O => Option[O2]): Chunk[O2] = {
    val b = makeArrayBuilder[Any]
    b.sizeHint(size)
    foreach { o =>
      val o2 = f(o)
      if (o2.isDefined) b += o2.get
    }
    Chunk.array(b.result()).asInstanceOf[Chunk[O2]]
  }
```

## 前提知識

- `Option` は、値がある `Some(x)` と、値がない `None` のどちらかを持つ型です。
- 「map と filter を続けて書く」と、元の配列を 2 回回し、途中の結果も 2 つ作ることになります。
- `makeArrayBuilder` は、要素を後ろに足して配列を作る入れ物です。`b += x` で 1 つ足し、`result()` で完成した配列を取り出します。
- `sizeHint` は、要素数の目安を伝えて、配列の拡張を減らす命令です。
- `o2.isDefined` は、`Option` が `Some` なら真になる判定です。`o2.get` で中身を取り出します。

## 何をしているか

### 1. 結果を入れる入れ物を、目安の大きさで作る

要素を集める入れ物を作ります。元の `Chunk` と同じ大きさを目安として伝えます。捨てられる要素があるので、実際はこれより小さくなることもあります。

```scala:line-numbers=259
    val b = makeArrayBuilder[Any]
    b.sizeHint(size)
```

### 2. 各要素を変換して、中身があるものだけ足す

`foreach` で要素を 1 つずつ取り出し、`f` に通します。`isDefined` が真なら、`get` で中身を取り出して入れ物に足します。

```scala:line-numbers=261
    foreach { o =>
      val o2 = f(o)
      if (o2.isDefined) b += o2.get
    }
    Chunk.array(b.result()).asInstanceOf[Chunk[O2]]
```

### 3. 集まった要素を Chunk にして返す

すべての要素を見終わったら、入れ物の中身を配列にして、`Chunk` として返します。

```scala:line-numbers=266
  }
```

## ここがすごい

- 1 回の走査で、変換と絞り込みが両方済みます。途中の中間結果を作らないので、メモリを使いません。
- 変換結果の型を `Option` にすることで、「変換できない」を例外ではなく値で表しています。捨てる理由が型に現れます。
- 入れ物に直接足していくので、`Option` の列から後で中身を取り出して並べ直す手間がありません。
- 目安の大きさを先に伝えるので、通常は配列を作り直す回数が少なく済みます。

## まとめ

- 変換しながら一部だけ残すには、変換関数が `Option` を返す形が便利です。
- map と filter を 1 回にまとめると、走査と中間の配列を減らせます。
- 入れ物に直接足す書き方は、Scala のコレクション処理の高速化によく使われます。
