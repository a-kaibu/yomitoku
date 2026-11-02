---
title: "要素が 0 個と 1 個の場合は、余計な箱を作らずに結果を返す"
description: "fs2 の Chunk.flatMap。空なら空を、要素が 1 個なら変換結果をそのまま返す。それ以外だけ Chunk.Queue に足していき、各結果を連結する。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [172, 179]
format: 2
function: "Chunk.flatMap"
difficulty: 2
tags: [最適化, データ構造, 関数型]
---

## ひとことで

fs2 の `Chunk` は、要素をまとめて持つ不変の入れ物です。`flatMap` は、各要素をチャンクに変えて、それらを一つにつなげます。要素が 0 個や 1 個のときは特別扱いして、余計な箱を作らずに結果を返します。

## コード

```scala:line-numbers=172
  def flatMap[O2](f: O => Chunk[O2]): Chunk[O2] =
    if (isEmpty) Chunk.empty
    else if (size == 1) f(apply(0))
    else {
      var acc = Chunk.Queue.empty[O2]
      foreach(o => acc = acc :+ f(o))
      acc
    }
```

## 前提知識

- `Chunk[O]` は、`O` 型の要素を順番に持つ、まとめ単位のデータです。
- `f: O => Chunk[O2]` は、一つの要素を、新しいチャンクに変える関数です。
- `flatMap` は、各要素の結果を平らにつなげる操作です。例えば、`[1, 2]` の各要素を `[x, x]` に変えると、`[1, 1, 2, 2]` になります。
- `Chunk.Queue` は、末尾に足していける、チャンクの一種です。`:+` で末尾に追加します。
- `foreach` は、すべての要素に順番に関数を当てる操作です。

## 何をしているか

### 1. 空のチャンクなら、空のチャンクを返す

要素が一つもないときは、結果も空です。`Chunk.empty` をそのまま返します。

```scala:line-numbers=173
    if (isEmpty) Chunk.empty
```

### 2. 要素が一つだけなら、その変換結果をそのまま返す

要素が一つなら、つなげる必要がありません。`f` の結果を、そのまま返します。新しい箱は作りません。

```scala:line-numbers=174
    else if (size == 1) f(apply(0))
```

### 3. それ以外は、Queue に末尾から足していく

要素が二つ以上のときは、空の `Queue` を用意し、各要素の結果を `:+` で末尾に足します。最後に、その `Queue` を結果として返します。

```scala:line-numbers=176
      var acc = Chunk.Queue.empty[O2]
      foreach(o => acc = acc :+ f(o))
      acc
```

## ここがすごい

- よくある「要素が少ない」場合を、先に特別扱いしています。要素が 0 個か 1 個なら、ほとんど計算がいりません。
- 要素が多いときだけ `Queue` を使い、末尾への追加を効率よく行います。
- 一つの `foreach` で全要素を処理するので、途中の中間結果をたくさん作りません。
- 結果の型は `Chunk[O2]` で、呼び出し側には、どの経路を通ったかが見えません。

## まとめ

- `flatMap` は、各要素を変換し、その結果を一つのチャンクにつなげます。
- 空と一要素の場合は、そのまま結果を返し、無駄な箱を作りません。
- 複数要素のときだけ、`Queue` に末尾から足していきます。
