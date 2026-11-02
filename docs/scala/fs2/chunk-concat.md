---
title: "2 つの Chunk を、すぐには詰め直さずにつなぐ"
description: "fs2 の Chunk.++。空かどうかを先に調べ、片方が空ならもう一方をそのまま返す。両方に中身があるときは Chunk.Queue という、塊をつないだ形で持ち、要素の詰め直しを後回しにする。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [77, 84]
format: 2
function: "Chunk.++"
difficulty: 3
tags: [データ構造, 関数型, 最適化]
---

## ひとことで

fs2 の `Chunk` は、要素を配列のように並べて持つ不変の塊です。`++` は、2 つの `Chunk` を後ろにつなぎます。すぐに全部の要素を新しい配列にコピーせず、塊のままつないで扱うのが特徴です。

## コード

```scala:line-numbers=77
  def ++[O2 >: O](that: Chunk[O2]): Chunk[O2] =
    if (isEmpty) that
    else
      that match {
        case that if that.isEmpty  => this
        case that: Chunk.Queue[O2] => this +: that
        case that                  => Chunk.Queue(this, that)
      }
```

## 前提知識

- `Chunk` は不変なので、つないだ結果は新しい値として作ります。元の 2 つは変わりません。
- 要素を 1 つずつコピーして、大きな配列を作る方法は、大きさに比例して時間がかかります。
- `Chunk.Queue` は、複数の `Chunk` を順番に並べた形を表す内部の型です。中身を 1 つの配列にしなくても、全体として並んでいることを表せます。
- `this +: that` は、`that` の先頭に `this` を付けるような操作で、Queue の内部の並びを作り直す書き方です。
- `isEmpty` は、中身が 0 個かを調べます。空の `Chunk` は、つないでも意味が変わりません。

## 何をしているか

### 1. 自分が空なら、相手をそのまま返す

まず、自分（`this`）が空なら、つなぐものがないので、相手の `that` をそのまま返します。コピーは起きません。

```scala:line-numbers=78
    if (isEmpty) that
    else
```

### 2. 相手が空なら、自分をそのまま返す

相手が空なら、自分をそのまま返します。ここでも、コピーは起きません。

```scala:line-numbers=81
        case that if that.isEmpty  => this
```

### 3. どちらも中身があれば、Queue として並べる

相手が Queue なら、自分を先頭に付けた Queue を作ります。そうでなければ、自分と相手の 2 つを並べた `Chunk.Queue` を作ります。どちらの場合も、要素はまだ詰め直しません。

```scala:line-numbers=82
        case that: Chunk.Queue[O2] => this +: that
        case that                  => Chunk.Queue(this, that)
```

## ここがすごい

- 空との連結は、何もコピーせずに元の値を返すので、とても速く終わります。
- 両方に中身があるときも、要素を新しい配列に写さず、塊の並びとして持つので、大きな `Chunk` をつなぐときのコピーが減ります。
- 相手が Queue なら、前に付け足すだけで済むように分けています。同じ形の塊を、無駄なく伸ばせます。
- 型パラメータ `O2 >: O` により、要素の型を広げてつなげます。`Chunk[Int]` と `Chunk[Any]` のような組み合わせも扱えます。

## まとめ

- 連結は、空のときは元の値を返し、中身があるときは塊のまま並べると速くなります。
- 大きなデータをつなぐとき、要素のコピーを後回しにすると無駄が減ります。
- 内部の表現を分けると、よくある場合（空、相手が Queue）を簡単に処理できます。
