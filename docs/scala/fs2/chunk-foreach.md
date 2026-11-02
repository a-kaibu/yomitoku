---
title: "Chunk の要素を、番号で順に取り出して関数を適用する"
description: "fs2 の Chunk.foreach。大きさまで番号を 1 つずつ増やしながら、apply で要素を取り出して関数に渡す。Iterator を作らず、while ループだけで回す。副作用のある処理を全部の要素に行うときに使う。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [193, 199]
format: 2
function: "Chunk.foreach"
difficulty: 1
tags: [イテレータ, 最適化, 関数型]
---

## ひとことで

fs2 の `Chunk` で、すべての要素に関数を適用するための `foreach` です。要素を 1 つずつ取り出して、渡された関数に順番に渡します。戻り値はなく、ログを出す、ファイルに書く、といった副作用のある処理によく使われます。

## コード

```scala:line-numbers=193
  def foreach(f: O => Unit): Unit = {
    var i = 0
    while (i < size) {
      f(apply(i))
      i += 1
    }
  }
```

## 前提知識

- `foreach` は、列の全要素に対して関数を実行する操作です。値を作るのではなく、処理を行うことが目的です。
- `Chunk` は、添字（番号）で要素を直接取り出せる（`apply(i)`）不変の塊です。
- `while` は、条件が真の間、同じ処理を繰り返す構文です。Scala でも、ループを明示して書けます。
- 副作用は、関数の外の状態を変えたり、入出力をしたりする処理のことです。
- `Unit` は、値を持たないことを表す型です。`foreach` は `Unit` を返します。

## 何をしているか

### 1. 番号を 0 から用意する

`i` は、今取り出す要素の番号です。0 から始めて、先頭の要素から順に取り出していきます。

```scala:line-numbers=194
    var i = 0
```

### 2. 番号が大きさより小さい間、要素を関数に渡す

`while (i < size)` で、最後の要素まで繰り返します。`apply(i)` で `i` 番目の要素を取り出し、関数 `f` に渡します。

```scala:line-numbers=195
    while (i < size) {
      f(apply(i))
```

### 3. 番号を 1 つ進める

処理が終わったら、番号を 1 増やして、次の要素へ進みます。

```scala:line-numbers=197
      i += 1
```

## ここがすごい

- `Iterator` のようなオブジェクトを作らず、番号だけで回るので、要素の数が多くても余計なメモリを使いません。
- 番号を直接扱うので、`apply` が配列の添字のように速く動きます。
- ループの条件が `size` と比べるだけなので、読み取る範囲は必ず `Chunk` の中に収まります。
- 副作用を持つ処理を、関数として外から渡せるので、ログ出力や書き込みなど、用途に合わせた処理を差し込めます。

## まとめ

- 全要素に処理を行うときは、番号を使ったループが速くて確実です。
- `Iterator` を作らないことで、短い処理でも余計な割り当てを防げます。
- 副作用の処理は、関数を渡して外から決める形にすると、再利用しやすくなります。
