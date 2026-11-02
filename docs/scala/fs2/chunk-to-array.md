---
title: "Chunk を、要素の型を指定して普通の配列に直す"
description: "fs2 の Chunk.toArray。Chunk の大きさの配列を作り、copyToArray で中身を一度にコピーして返す。型の情報 ClassTag を使って、正しい型の配列を作る。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [339, 343]
format: 2
function: "Chunk.toArray"
difficulty: 2
tags: [データ構造, 型システム, 標準ライブラリ]
---

## ひとことで

fs2 の `Chunk` を、Scala や Java の普通の配列に変えるのが `toArray` です。たとえば `Chunk(1, 2, 3).toArray` は `Array(1, 2, 3)` になります。変換のときに、コピーを作ります。

## コード

```scala:line-numbers=339
  def toArray[O2 >: O: ClassTag]: Array[O2] = {
    val arr = new Array[O2](size)
    copyToArray(arr, 0)
    arr
  }
```

## 前提知識

- 配列（`Array`）は、大きさが決まった、可変の入れ物です。Java の配列と同じ仕組みで、要素の型の情報が実行時に必要です。
- `ClassTag` は、Scala の実行時に型の情報を渡す仕組みです。配列を作るときに、要素の型が分かっている必要があるので使われます。
- `O2 >: O` は、要素の型 `O2` が `O` 以上の型であることを表す型の制約です。型を広げて配列を作れます。
- `copyToArray` は、`Chunk` の中身を配列の先頭からまとめてコピーする関数です。
- `new Array[O2](size)` は、同じ大きさの配列を作る書き方です。

## 何をしているか

### 1. 同じ大きさの配列を、型の情報をもとに作る

`new Array[O2](size)` で、要素の数と同じ大きさの配列を作ります。`ClassTag` のおかげで、正しい型の配列になります。

```scala:line-numbers=340
    val arr = new Array[O2](size)
```

### 2. Chunk の中身を、配列にコピーする

`copyToArray(arr, 0)` で、`Chunk` の要素を配列の先頭からコピーします。配列の作り方は `copyToArray` に任せています。

```scala:line-numbers=341
    copyToArray(arr, 0)
```

### 3. 配列を返す

コピーが終わった配列を返します。ここから先は、普通の配列として扱えます。

```scala:line-numbers=342
    arr
```

## ここがすごい

- 大きさを先に決めて 1 回だけ配列を確保するので、途中で作り直す回数がありません。
- コピーは `copyToArray` に任せるので、`Chunk` の種類（配列の塊、連結された塊など）に応じて、最も効率の良い方法が選ばれます。
- `ClassTag` を使うので、型消去のせいで要素の型を失うことがありません。Java の API と組み合わせるときにも役立ちます。
- 型の制約 `O2 >: O` により、要素の型を広げた配列も作れます。

## まとめ

- 型付きの配列を作るには、要素の型の情報（ClassTag）を渡す必要があります。
- 大きさを先に決めてコピーすると、余計な確保を避けられます。
- 変換の処理は、入れ物ごとの最適な方法に任せると、効率と保守性が両立します。
