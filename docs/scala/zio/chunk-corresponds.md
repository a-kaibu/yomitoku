---
title: "二つの列を、同じ位置の組ごとに比べて一致を確かめる"
description: "ZIO の Chunk.corresponds。長さが違えばすぐ false。同じなら、位置ごとに両方の要素を取り出して述語 f で比べ、一つでも合わなければ止める。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Chunk.scala"
lines: [252, 266]
format: 2
function: "Chunk.corresponds"
difficulty: 2
tags: [イテレータ, 最適化, 関数型]
---

## ひとことで

ZIO の `Chunk` は、要素をまとめて持つ不変の列です。`corresponds` は、二つの列が「同じ位置どうし」で条件を満たすかを調べます。例えば、同じ長さの二つの数の列が、位置ごとに同じかを比べるような場面で使えます。

## コード

```scala:line-numbers=252
  final def corresponds[B](that: Chunk[B])(f: (A, B) => Boolean): Boolean =
    if (self.length != that.length) false
    else {
      val leftIterator  = self.chunkIterator
      val rightIterator = that.chunkIterator
      var index         = 0
      var equal         = true
      while (equal && leftIterator.hasNextAt(index) && rightIterator.hasNextAt(index)) {
        val a = leftIterator.nextAt(index)
        val b = rightIterator.nextAt(index)
        index += 1
        equal = f(a, b)
      }
      equal
    }
```

## 前提知識

- `corresponds` は、二つの列を位置ごとに組にして、条件 `f` を当てる操作です。`f: (A, B) => Boolean` が条件です。
- `chunkIterator` は、チャンクの要素を位置で取り出す反復子です。`hasNextAt` で、その位置に要素があるかを調べます。
- `nextAt` は、その位置の要素を取り出す操作です。
- 「同じ位置」とは、先頭から数えて同じ番号の要素どうしのことです。
- `while` は、条件が真のあいだ繰り返す文です。

## 何をしているか

### 1. 長さが違えば、すぐ `false` にする

二つの列の長さが違うなら、位置をそろえて比べる意味がありません。そのまま `false` を返します。

```scala:line-numbers=253
    if (self.length != that.length) false
```

### 2. 両方の反復子から、同じ位置の要素を取り出す

両方の列の位置 `index` を一つずつ進めながら、要素 `a` と `b` を取り出します。`index` は、比べた位置の数を数えます。

```scala:line-numbers=259
      while (equal && leftIterator.hasNextAt(index) && rightIterator.hasNextAt(index)) {
        val a = leftIterator.nextAt(index)
        val b = rightIterator.nextAt(index)
        index += 1
```

### 3. 一つでも合わなければ、そこで止める

`f(a, b)` が `false` なら、`equal` が `false` になり、ループを抜けます。全部合えば `true` のまま残ります。

```scala:line-numbers=263
        equal = f(a, b)
      }
      equal
```

## ここがすごい

- 長さの比較を最初に行うので、違う長さの列は、比べる前に終わります。無駄な比較がありません。
- 条件 `f` が `false` になった時点で止めるので、残りの要素は取り出しません。
- 要素の比べ方を `f` で渡すので、等しさだけでなく、任意の関係も比べられます。
- 反復子を使うので、どちらの列も、コピーを作らずに位置ごとに読めます。

## まとめ

- `corresponds` は、長さが同じで、同じ位置の要素が条件 `f` を満たすかを調べます。
- 長さが違えば `false`、一つでも合わなければそこで止まります。
- 比べ方は `f` で自由に決められます。
