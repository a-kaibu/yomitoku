---
title: "配列を切り分けても、コピーしないチャンク"
description: "fs2 の ArraySlice の splitAtChunk_ と drop。元の配列を共有したまま、offset と length だけを変えて新しいチャンクを作る。切り分けが配列のコピーにならない。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [901, 907]
format: 2
function: "Chunk.ArraySlice.splitAtChunk_"
difficulty: 2
tags: [データ構造, 最適化, 遅延評価]
---

## ひとことで

fs2 の `Chunk` は、配列の一部を表す `ArraySlice` という形を持っています。`splitAtChunk_` と `drop` は、チャンクを途中で切り分けるときに、配列を新しく作らずに、元の配列の範囲（開始位置と長さ）だけを変えた 2 つのチャンクを返します。

## コード

```scala:line-numbers=901
    protected def splitAtChunk_(n: Int): (Chunk[O], Chunk[O]) =
      ArraySlice(values, offset, n) -> ArraySlice(values, offset + n, length - n)

    override def drop(n: Int): Chunk[O] =
      if (n <= 0) this
      else if (n >= size) Chunk.empty
      else ArraySlice(values, offset + n, length - n)
```

## 前提知識

- `Chunk` は、要素をまとめて扱う不変の並びです。fs2 のストリームは、要素をこの単位で流します。
- `ArraySlice(values, offset, length)` は、配列 `values` のうち、`offset` から `length` 個だけを見る形です。
- `values` は同じ配列を指したままです。`ArraySlice` は、データをコピーしない「窓」のようなものです。
- `->` は 2 つの値を組にする書き方で、`(a, b)` と同じ意味です。
- `override def` は、親の型で宣言されたメソッドを上書きする書き方です。

## 何をしているか

### 1. 切り分けは、2 つの窓を作るだけ

`splitAtChunk_` は、先頭 `n` 個の窓と、残りの窓の 2 つを作ります。

```scala:line-numbers=902
      ArraySlice(values, offset, n) -> ArraySlice(values, offset + n, length - n)
```

前半は同じ `offset` で長さが `n`、後半は `offset + n` から長さが `length - n` です。配列の中身は一切コピーしません。

### 2. drop は、先頭を捨てた窓を作る

`drop(n)` は、先頭 `n` 個を捨てた窓を返します。`n` が 0 以下なら、そのままの `this` を返します。`n` が大きすぎるなら、空の `Chunk` を返します。

```scala:line-numbers=905
      if (n <= 0) this
      else if (n >= size) Chunk.empty
      else ArraySlice(values, offset + n, length - n)
```

先頭を捨てるのも、開始位置を `n` だけずらすだけです。

## ここがすごい

- ストリームで「先頭の数要素を取って、残りを次へ渡す」処理は頻繁に起きます。毎回配列をコピーすると、大きなデータで時間もメモリも無駄になります。
- 窓の形にすることで、切り分けは定数時間で終わります。要素の数に関係なく、同じ速さです。
- `drop` で範囲外のときに `this` や `Chunk.empty` を返すのは、無駄な窓を作らないための判断です。
- 元の配列を共有するので、切り分けた後の値を読むだけなら、データの移動は起きません。

## まとめ

- 配列の一部を表すには、元の配列と開始位置と長さだけを持つ窓が使えます。
- 切り分けや先頭の削除は、窓の位置をずらす計算で済みます。
- 範囲外の場合は、特別な値を返して無駄を避けます。
