---
title: "2 つの Chunk を、短い方の長さまで組み合わせて新しい Chunk を作る"
description: "fs2 の Chunk.zipWith。2 つの Chunk を並べて、対応する要素同士を関数で組み合わせる。長さが違うときは短い方に合わせ、余った要素は使わない。結果は配列に直接入れて作る。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [523, 532]
format: 2
function: "Chunk.zipWith"
difficulty: 3
tags: [関数型, イテレータ, 最適化]
---

## ひとことで

fs2 の `Chunk` で、2 つの `Chunk` の対応する要素を組み合わせて、新しい `Chunk` を作るのが `zipWith` です。たとえば足し算の関数を渡せば、同じ位置の数どうしを足した `Chunk` ができます。長さが違うときは、短い方に合わせます。

## コード

```scala:line-numbers=523
  def zipWith[O2, O3](that: Chunk[O2])(f: (O, O2) => O3): Chunk[O3] = {
    val sz = size.min(that.size)
    val arr = new Array[Any](sz)
    var i = 0
    iterator.zip(that.iterator).foreach { case (o, o2) =>
      arr(i) = f(o, o2)
      i += 1
    }
    Chunk.array(arr).asInstanceOf[Chunk[O3]]
  }
```

## 前提知識

- 「zip」は、2 つの列を先頭から順に組にする操作です。`zipWith` は、組にした後で関数を適用する形です。
- `Chunk` は、要素を並べて持つ不変の塊です。`size` で大きさを、`iterator` で要素を順に取り出せます。
- `size.min(that.size)` は、2 つの大きさのうち小さい方を求めます。結果の大きさに使います。
- `Array[Any]` は、型を消した配列で、結果を後から入れる入れ物です。最後に `Chunk` に包みます。
- `iterator.zip(that.iterator)` は、2 つの `Iterator` を組にして取り出す書き方です。

## 何をしているか

### 1. 結果の配列を、短い方の長さで用意する

2 つの大きさのうち小さい方 `sz` を求め、その大きさの配列を作ります。長い方の余った要素は、組にする相手がないので使いません。

```scala:line-numbers=524
    val sz = size.min(that.size)
    val arr = new Array[Any](sz)
    var i = 0
```

### 2. 2 つの要素を取り出し、関数で組み合わせる

`iterator.zip(that.iterator)` で、同じ位置の要素の組を順に取り出します。組の 2 つの要素を関数 `f` に渡し、結果を配列の `i` 番目に入れます。

```scala:line-numbers=527
    iterator.zip(that.iterator).foreach { case (o, o2) =>
      arr(i) = f(o, o2)
      i += 1
    }
```

### 3. 配列を Chunk にして返す

取り出しが終わったら、配列を `Chunk` に包んで返します。

```scala:line-numbers=531
    Chunk.array(arr).asInstanceOf[Chunk[O3]]
```

## ここがすごい

- 結果の大きさを先に決め、配列に直接入れるので、途中でリストを作る無駄がありません。
- 長さが違っても、短い方で止まるので、範囲の外を読む心配がありません。
- 組み合わせの方法を関数で渡すので、足し算でも文字列の連結でも、同じ関数で書けます。
- `zip` を `zipWith` の形で書いておくと、組のまま欲しいとき（`Tuple2.apply` を渡す場合）にも、同じ部品で済みます。

## まとめ

- 2 つの列を組み合わせるときは、短い方に長さを揃えて、対応する要素を関数で結びます。
- 結果の大きさを先に決めて配列に入れると、余計なコピーを避けられます。
- 組にする方法を関数で渡すと、用途が違っても同じ処理が使えます。
