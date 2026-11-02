---
title: "末尾から先頭へ、要素を 1 つずつ取り出す Iterator"
description: "fs2 の Chunk.reverseIterator。最後の位置から番号を 1 つずつ減らしながら要素を返す Iterator。配列のコピーを作らず、添字だけで逆順に読む。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [272, 277]
format: 2
function: "Chunk.reverseIterator"
difficulty: 2
tags: [イテレータ, 標準ライブラリ, 最適化]
---

## ひとことで

fs2 の `Chunk` には、要素を後ろから前へ取り出す `reverseIterator` があります。`Chunk` を逆順にした新しい配列を作らず、最後の位置から添字を減らしながら、必要な分だけ要素を返します。

## コード

```scala:line-numbers=272
  def reverseIterator: Iterator[O] =
    new Iterator[O] {
      private[this] var i = self.size - 1
      def hasNext = i >= 0
      def next() = { val result = apply(i); i -= 1; result }
    }
```

## 前提知識

- `Iterator` は、要素を 1 つずつ取り出す仕組みです。`hasNext` で続きがあるかを確かめ、`next()` で 1 つ取り出します。
- `Chunk` は、添字で要素を直接取り出せる（`apply(i)`）ので、配列と同じように扱えます。
- `private[this] var i` は、今どの位置まで読んだかを覚える変数です。クラスの外からは見えません。
- `self.size - 1` は、最後の要素の添字です。`self` は、外側の `Chunk` を指します。
- `i -= 1` は、添字を 1 つ前へ戻す操作です。

## 何をしているか

### 1. 最後の位置から読み始める

`i` は、最後の要素の添字で初期化されます。`Chunk` が空なら `-1` なので、最初から読み終わった状態になります。

```scala:line-numbers=273
    new Iterator[O] {
      private[this] var i = self.size - 1
```

### 2. 添字が 0 以上の間は、続きがあると判断する

`hasNext` は、`i` が 0 以上なら真です。まだ読んでいない要素が残っているという意味です。

```scala:line-numbers=275
      def hasNext = i >= 0
```

### 3. 今の位置の要素を返し、添字を 1 つ前へ進める

`next()` は、`apply(i)` で今の要素を取り出します。その後で `i` を 1 減らしてから、取り出した値を返します。

```scala:line-numbers=276
      def next() = { val result = apply(i); i -= 1; result }
```

## ここがすごい

- 逆順のコピーを作らないので、大きな `Chunk` でも、余分なメモリを使いません。
- 添字だけを動かすので、読む作業が軽く、要素を 1 つずつ確実に取り出せます。
- `hasNext` は添字の比較だけで答えられるので、判定が速く済みます。
- 順方向の `iterator` と対になる設計で、同じ `Chunk` を両方向から扱えます。

## まとめ

- 逆順に読むときは、コピーを作る代わりに、添字を後ろから減らして読みます。
- 添字の範囲で続きを判定すると、判定が簡単になります。
- 順方向と逆方向を対で用意すると、使う側の選択肢が広がります。
