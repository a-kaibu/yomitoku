---
title: "同じ値を、配列の指定の位置へ繰り返し書き込む"
description: "fs2 の Chunk.Constant.copyToArray。すべての要素が同じ値の Chunk を、配列に写す。末尾再帰の go で、同じ値を大きさの分だけ順に書き込む。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [644, 653]
format: 2
function: "Chunk.Constant.copyToArray"
difficulty: 3
tags: [関数型, データ構造, 最適化]
---

## ひとことで

fs2 の `Chunk` には、すべての要素が同じ値の `Chunk` を、少ない記憶で表す `Constant` があります。`copyToArray` は、その `Chunk` を配列に写す処理です。同じ値を、指定の位置から大きさの分だけ順に書き込みます。

## コード

```scala:line-numbers=644
    def copyToArray[O2 >: A](xs: Array[O2], start: Int): Unit = {

      @tailrec
      def go(ix: Int): Unit =
        if (ix < size) {
          xs(start + ix) = value
          go(ix + 1)
        }
      go(0)
    }
```

## 前提知識

- `Constant` は、1 つの値を大きさの数だけ持つ `Chunk` です。中身の配列を持たず、値と大きさだけを覚えます。
- `copyToArray(xs, start)` は、`Chunk` の要素を配列 `xs` の `start` の位置から書き込む操作です。
- `@tailrec` は、末尾の再帰をループに変えることをコンパイラに確かめさせる注釈です。
- `go(ix)` は、今書き込む位置 `ix` を受け取る再帰の関数です。`ix` が大きさに達したら止まります。
- `xs(start + ix) = value` は、配列の指定の位置に値を書く操作です。

## 何をしているか

### 1. 位置 0 から書き込みを始める

`go(0)` で、最初の位置から書き込みを始めます。`start` は配列の書き込み先の開始位置で、`ix` は `Chunk` の中の番号です。

```scala:line-numbers=652
      go(0)
```

### 2. まだ大きさに届いていなければ、値を書いて次へ進む

`ix` が大きさより小さい間は、`xs(start + ix)` に同じ `value` を書き込みます。そのあと `go(ix + 1)` で次の位置へ進みます。

```scala:line-numbers=647
      def go(ix: Int): Unit =
        if (ix < size) {
          xs(start + ix) = value
          go(ix + 1)
```

### 3. 大きさに届いたら、何もせずに終わる

`ix` が大きさ以上になると、`if` の条件が偽になり、何も書かずに再帰が終わります。

## ここがすごい

- 同じ値を書くだけなので、中身の配列を `Constant` が持つ必要がありません。書き込みの処理は、値を 1 つ覚えておけば足ります。
- 末尾再帰で書いてあるので、大きさが多くても、関数の呼び出しの深さは増えません。
- 書き込みの位置を `start + ix` で決めるので、配列のどこからでも書き始められます。
- `Constant` の中に閉じた処理なので、一般の `Chunk` の処理と混ざらず、役割がはっきりしています。

## まとめ

- 同じ値を大量に配列へ写すときは、値を 1 つ覚えて、位置を進めながら書き込みます。
- 大きさの分だけ繰り返す処理は、末尾再帰にすると、深さを気にせず書けます。
- 特別な形の入れ物には、その形に合った処理を用意すると、効率が上がります。
