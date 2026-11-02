---
title: "各要素に、指定した番号から始まる連番をつける"
description: "ZIO の Chunk.zipWithIndexFrom。要素ごとに (要素, 番号) の組を作り、番号は indexOffset から始める。ChunkBuilder に入れていく。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Chunk.scala"
lines: [1012, 1025]
format: 2
function: "Chunk.zipWithIndexFrom"
difficulty: 2
tags: [イテレータ, データ構造, 最適化]
---

## ひとことで

ZIO の `Chunk` は、要素をまとめて持つ不変の列です。`zipWithIndexFrom` は、各要素に番号をつけて、`(要素, 番号)` の組の列を作ります。番号は、指定した `indexOffset` から数え始めます。

## コード

```scala:line-numbers=1012
  final def zipWithIndexFrom(indexOffset: Int): Chunk[(A, Int)] = {
    val iterator = self.chunkIterator
    var index    = 0
    val builder  = ChunkBuilder.make[(A, Int)]()
    builder.sizeHint(length)
    var i = indexOffset
    while (iterator.hasNextAt(index)) {
      val a = iterator.nextAt(index)
      index += 1
      builder += ((a, i))
      i += 1
    }
    builder.result()
  }
```

## 前提知識

- `Chunk[A]` は、要素を順番に持つ、まとめ単位のデータです。
- `chunkIterator` は、チャンクの要素を先頭から取り出す反復子です。`hasNextAt` と `nextAt` で、位置ごとに要素を取り出します。
- `ChunkBuilder` は、要素を足していき、最後にチャンクにする道具です。`sizeHint` は、あらかじめ大きさを伝えて、確保を効率よくします。
- `indexOffset` は、番号の開始値です。`zipWithIndex` の 0 から始めるのに対し、任意の値から始められます。
- `+=` は、ビルダーに要素を足す操作です。

## 何をしているか

### 1. 結果を入れるビルダーと、番号の初期値を用意する

ビルダーを作り、大きさのヒントを渡します。番号 `i` は `indexOffset` から始めます。

```scala:line-numbers=1013
    val iterator = self.chunkIterator
    var index    = 0
    val builder  = ChunkBuilder.make[(A, Int)]()
    builder.sizeHint(length)
    var i = indexOffset
```

### 2. 要素を一つずつ取り出し、組にしてビルダーに足す

反復子で要素 `a` を取り出し、`(a, i)` の組をビルダーに足します。`index` と `i` は、それぞれ一つずつ増えていきます。

```scala:line-numbers=1018
    while (iterator.hasNextAt(index)) {
      val a = iterator.nextAt(index)
      index += 1
      builder += ((a, i))
      i += 1
    }
```

### 3. ビルダーの結果をチャンクとして返す

最後に `builder.result()` で、組の列をチャンクにして返します。

```scala:line-numbers=1024
    builder.result()
```

## ここがすごい

- 番号の開始値を引数で選べるので、部分の列を続きから番号づけする、といった使い方ができます。
- `sizeHint` で大きさを先に伝えるので、ビルダーが配列を作り直す回数が減ります。
- 反復子の位置 `index` と、番号 `i` を分けているので、要素の位置と番号の関係がはっきりしています。
- 一度の走査で組の列を作り、途中の中間の列を作りません。

## まとめ

- `zipWithIndexFrom` は、各要素を `(要素, 番号)` の組にして、指定した番号から連番をつけます。
- 結果は `ChunkBuilder` に溜めて、最後にチャンクとして返します。
- 大きさのヒントで、配列の作り直しを減らしています。
