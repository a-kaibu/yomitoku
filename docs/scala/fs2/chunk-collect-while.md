---
title: "先頭から条件を満たす間だけ、部分関数で変換して集める"
description: "fs2 の Chunk.collectWhile。部分関数を先頭から当てはめ、当てはまらない要素が出たらそこで止める。途中までの結果だけを新しい Chunk として返す。配列のビルダーを使って、余分なリストを作らない。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [103, 118]
format: 2
function: "Chunk.collectWhile"
difficulty: 3
tags: [イテレータ, 関数型, 最適化]
---

## ひとことで

fs2 は、Scala で「データを少しずつ流す」ストリームを作るライブラリです。その中の `Chunk` は、まとめて扱う不変の配列のような型です。`collectWhile` は、先頭から部分関数を当てはめて、変換できる間だけ結果を集めます。変換できない要素が来たら、そこで止めます。

## コード

```scala:line-numbers=103
  def collectWhile[O2](pf: PartialFunction[O, O2]): Chunk[O2] = {
    val b = makeArrayBuilder[Any]
    b.sizeHint(size)
    var i = 0
    while (i < size) {
      import fs2.Chunk.NotApplied
      val r = pf.applyOrElse(apply(i), NotApplied)
      if (r.asInstanceOf[AnyRef] eq NotApplied) {
        return Chunk.array(b.result()).asInstanceOf[Chunk[O2]]
      } else {
        b += r
      }
      i += 1
    }
    Chunk.array(b.result()).asInstanceOf[Chunk[O2]]
  }
```

## 前提知識

- `PartialFunction[O, O2]` は、一部の入力だけに値を返せる関数です。`pf.applyOrElse` は、当てはまらないときに既定の値を返します。
- `Chunk` は、要素を配列のように持つ、不変の塊です。`apply(i)` で `i` 番目を取り出せます。
- `makeArrayBuilder` は、配列を少しずつ作るための入れ物を作ります。`sizeHint` は、最初に大きさの目安を伝えて、途中の拡張を減らします。
- `return` は、関数の途中で値を返して、そこで抜ける書き方です。Scala では、ループから抜けるときに使われます。
- `NotApplied` は、部分関数が当てはまらなかったときの印として使う、特別な値です。

## 何をしているか

### 1. 結果を入れる入れ物と、大きさの目安を用意する

まず、結果を入れる配列のビルダーを作ります。元の `Chunk` と同じ大きさを目安にしておくと、途中で配列を作り直す回数が減ります。

```scala:line-numbers=104
    val b = makeArrayBuilder[Any]
    b.sizeHint(size)
    var i = 0
```

### 2. 先頭から順に、部分関数を当てはめる

ループで 1 つずつ要素を取り出し、`pf` に当てはめます。当てはまらなければ `NotApplied` が返ってきます。

```scala:line-numbers=108
      import fs2.Chunk.NotApplied
      val r = pf.applyOrElse(apply(i), NotApplied)
```

### 3. 当てはまらなければ、そこで止める

`NotApplied` が返ってきたら、それまでに集めた結果をそのまま `Chunk` にして返します。残りの要素は見ません。

```scala:line-numbers=110
      if (r.asInstanceOf[AnyRef] eq NotApplied) {
        return Chunk.array(b.result()).asInstanceOf[Chunk[O2]]
      } else {
```

当てはまったときは、結果をビルダーに足して次へ進みます。

```scala:line-numbers=113
        b += r
      }
      i += 1
    }
```

### 4. 最後まで当てはまれば、全部を返す

ループが最後まで回ったら、すべての結果を `Chunk` にして返します。

```scala:line-numbers=117
    Chunk.array(b.result()).asInstanceOf[Chunk[O2]]
```

## ここがすごい

- 途中で止めるので、条件を外れた後の要素は一切変換しません。変換関数に副作用があっても、余計な呼び出しが起きません。
- 結果を `List` ではなく配列のビルダーに集めるので、要素を 1 つずつ並べ直す無駄がありません。
- `NotApplied` という特別な値で「当てはまらない」を表すので、`Option` を毎回作る必要がありません。
- 大きさの目安を先に渡しているので、同じ大きさまでは配列を作り直しません。

## まとめ

- 先頭から条件が続く間だけ変換したいときは、部分関数とループで早く止められます。
- 途中で止めるときは、それまでの結果をビルダーから取り出して返します。
- 目安の大きさを伝えると、配列の作り直しを減らせます。
