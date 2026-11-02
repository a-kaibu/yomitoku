---
title: "隣り合う同じ要素を、一つにまとめる"
description: "ZIO の Chunk.dedupe。直前の要素と同じなら捨て、違うものだけをビルダーに足す。ソート済みの列の重複を消すような場面で使う。全体の重複ではなく、隣どうしだけを見る。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Chunk.scala"
lines: [271, 283]
format: 2
function: "Chunk.dedupe"
difficulty: 2
tags: [データ構造, 最適化, イテレータ]
---

## ひとことで

ZIO の `Chunk` は、要素をまとめて持つ不変の列です。`dedupe` は、隣り合って同じ値が続いている場合に、一つだけを残します。列の中の離れた場所にある同じ値は、消しません。ソートされた列の重複を消すような場面に向いています。

## コード

```scala:line-numbers=271
  def dedupe: Chunk[A] = {
    val builder = ChunkBuilder.make[A]()

    var lastA = null.asInstanceOf[A]

    foreach { a =>
      if (a != lastA) builder += a

      lastA = a
    }

    builder.result()
  }
```

## 前提知識

- `ChunkBuilder` は、要素を一つずつ足して、最後にチャンクにする道具です。
- `foreach` は、すべての要素に順番に関数を当てる操作です。
- `lastA` は、直前に見た要素を覚えておく変数です。
- `null.asInstanceOf[A]` は、型 `A` の「値がない」初期値を作る書き方です。参照型の `null` に相当します。
- `!=` は、二つの値が等しくないかを調べる演算子です。

## 何をしているか

### 1. 結果を入れるビルダーと、直前の要素の変数を用意する

最初に、空のビルダーを作ります。直前の要素を覚える `lastA` は、とりあえず `null` で始めます。

```scala:line-numbers=272
    val builder = ChunkBuilder.make[A]()

    var lastA = null.asInstanceOf[A]
```

### 2. 直前と違う要素だけを、結果に足す

要素 `a` を見て、直前の `lastA` と違うときだけ `builder += a` で足します。その後、`lastA` を今の `a` に更新します。

```scala:line-numbers=276
    foreach { a =>
      if (a != lastA) builder += a

      lastA = a
```

### 3. 結果をチャンクにして返す

最後に `builder.result()` で、残った要素からチャンクを作ります。

```scala:line-numbers=282
    builder.result()
```

## ここがすごい

- 一回の走査で、重複を消せます。前の要素と比べるだけなので、ほかの要素を見直す必要がありません。
- 隣どうしだけを比べるので、メモリはほとんど使いません。集合（`Set`）を作る必要がありません。
- 結果の順番は元の列と同じです。最初に出た要素の位置が保たれます。
- 注意点として、最初の `lastA` は `null` なので、列の先頭が `null` の要素だと、それが結果から抜けることがあります。通常の値の列では問題になりません。

## まとめ

- `dedupe` は、隣り合う同じ要素を一つにまとめます。
- 直前の要素を `lastA` で覚えて、違うものだけを足します。
- 離れた場所の重複は消さないので、全体の重複を消したいときは、ソートしてから使います。
