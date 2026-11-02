---
title: "条件を満たす要素だけを、配列に直接集めて新しい Chunk を作る"
description: "fs2 の Chunk.filter。要素を 1 つずつ条件で調べ、通ったものだけを配列のビルダーに足す。結果は新しい Chunk になり、元の Chunk は変わらない。大きさの目安を先に渡して、配列の作り直しを減らす。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [157, 162]
format: 2
function: "Chunk.filter"
difficulty: 2
tags: [関数型, イテレータ, 最適化]
---

## ひとことで

fs2 の `Chunk` は、要素を並べて持つ不変の塊です。`filter` は、条件を満たす要素だけを集めて、新しい `Chunk` を作ります。元の `Chunk` は変わりません。たとえば偶数だけを残すには、`filter(_ % 2 == 0)` と書きます。

## コード

```scala:line-numbers=157
  def filter(p: O => Boolean): Chunk[O] = {
    val b = makeArrayBuilder(thisClassTag)
    b.sizeHint(size)
    foreach(e => if (p(e)) b += e)
    Chunk.array(b.result()).asInstanceOf[Chunk[O]]
  }
```

## 前提知識

- `Chunk` は、不変の塊です。作ったあとに中身を書き換えることはできません。そのため、絞り込みは新しい `Chunk` を作って返します。
- `makeArrayBuilder` は、要素を後ろに足して配列を作るための入れ物です。`b += e` で 1 つ足します。
- `thisClassTag` は、要素の型の情報です。配列を要素の型に合わせて作るために使います。
- `sizeHint` は、要素数の目安を伝える命令です。これで配列を作り直す回数が減ります。
- `foreach(e => ...)` は、要素を先頭から順に取り出して、関数を適用します。

## 何をしているか

### 1. 結果を入れる入れ物を、目安の大きさで用意する

要素の型に合わせたビルダーを作り、元の `Chunk` の大きさを目安として伝えます。残る要素は、これより少ないこともあります。

```scala:line-numbers=158
    val b = makeArrayBuilder(thisClassTag)
    b.sizeHint(size)
```

### 2. 条件を満たす要素だけを、ビルダーに足す

`foreach` で要素を 1 つずつ取り出します。条件 `p(e)` が真なら、`b += e` で入れ物に足します。偽なら、何もせずに次へ進みます。

```scala:line-numbers=160
    foreach(e => if (p(e)) b += e)
```

### 3. 集めた要素を Chunk にして返す

すべて調べ終わったら、ビルダーの中身を配列にして、`Chunk` に包んで返します。

```scala:line-numbers=161
    Chunk.array(b.result()).asInstanceOf[Chunk[O]]
```

## ここがすごい

- 1 回の走査で、絞り込みと配列の作成が同時に終わります。途中の `List` や中間の `Chunk` を作りません。
- 条件を満たした要素だけを足すので、必要な分だけメモリを使います。
- 型の情報を `thisClassTag` で持ち越すので、絞り込んだ結果も元と同じ要素の型の配列になります。
- 目安の大きさを伝えるので、要素が多いときも配列の拡張が少なくなります。

## まとめ

- 絞り込みは、条件を満たす要素だけをビルダーに足すと、1 回の走査で済みます。
- 不変のデータを扱うときは、新しい入れ物を作って結果を返すのが基本です。
- 型の情報を保つと、結果を元と同じ型のまま扱えます。
