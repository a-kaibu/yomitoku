---
title: "条件に合う最初の要素の位置を、Option で返す"
description: "fs2 の Chunk.indexWhere。チャンクの中で条件を満たす最初の要素の位置を探す。見つからなければ None を返し、負の値で「ない」を表さない。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [227, 230]
format: 2
function: "Chunk.indexWhere"
difficulty: 1
tags: [イテレータ, 型システム, 関数型]
---

## ひとことで

fs2 の `Chunk` は、要素をまとめて持つ不変の配列のような型です。`indexWhere` は、条件を満たす最初の要素の位置を探します。見つかれば `Some` で位置を、見つからなければ `None` を返します。

## コード

```scala:line-numbers=227
  def indexWhere(p: O => Boolean): Option[Int] = {
    val idx = iterator.indexWhere(p)
    if (idx < 0) None else Some(idx)
  }
```

## 前提知識

- `Chunk[O]` は、`O` 型の要素を順番に持つ、まとめ単位のデータです。
- `p: O => Boolean` は、要素を受け取って真か偽を返す関数です。ここでは「条件」を表します。
- `Option[Int]` は、位置があるかもしれないことを表す型です。`Some(i)` は位置が見つかったこと、`None` は見つからなかったことを表します。
- `iterator` は、チャンクの要素を先頭から一つずつ取り出す仕組みです。
- `-1` のような特別な値で「見つからない」を表す書き方もありますが、このメソッドは `Option` を使います。

## 何をしているか

### 1. 要素を先頭から調べ、最初に条件を満たす位置を得る

チャンクの `iterator` に対して、標準の `indexWhere` を呼びます。結果は、最初に条件を満たす要素の位置か、見つからなければ負の値です。

```scala:line-numbers=228
    val idx = iterator.indexWhere(p)
```

### 2. 負の値を `Option` に変換して返す

見つからなかった（負の値の）ときは `None` を、見つかったときはその位置を `Some` で包んで返します。呼び出し側は `Option` を調べるだけで判断できます。

```scala:line-numbers=229
    if (idx < 0) None else Some(idx)
```

## ここがすごい

- 「見つからない」を `-1` ではなく `None` で表すので、位置の値と取り違えることがありません。
- 実装は `iterator` の標準機能に任せており、探索の仕組みを新しく書いていません。
- 型の上で「見つからないかもしれない」が明示されるので、`None` の場合の処理を忘れにくくなります。
- 同じ形の `last` や `headOption` などと並んで、チャンクを安全に扱う API の統一感があります。

## まとめ

- `indexWhere` は、条件を満たす最初の位置を `Option[Int]` で返します。
- 中身は `iterator.indexWhere` を呼び、負の値を `None` に変えているだけです。
- 「見つからない」を型で表すと、呼び出し側の分岐を忘れにくくなります。
