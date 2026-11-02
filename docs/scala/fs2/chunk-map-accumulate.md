---
title: "途中の状態を持ちながら、要素を一つずつ変換する"
description: "fs2 の Chunk.mapAccumulate。状態 S を持ちながら、各要素を (新しい状態, 変換後の値) に変える。結果は、最後の状態と、変換後の要素を並べた Chunk の組。累積の和などを 1 回の走査で作れる。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [246, 255]
format: 2
function: "Chunk.mapAccumulate"
difficulty: 3
tags: [関数型, イテレータ, 状態機械]
---

## ひとことで

fs2 の `Chunk` は、まとめて扱う不変の配列のような型です。`mapAccumulate` は、途中の状態を持ち歩きながら、要素を 1 つずつ変換します。たとえば「今までの合計」を持ちながら、各要素を合計値に変える、といった処理を 1 回の走査で行えます。

## コード

```scala:line-numbers=246
  def mapAccumulate[S, O2](init: S)(f: (S, O) => (S, O2)): (S, Chunk[O2]) = {
    val arr = new Array[Any](size)
    var s = init
    foreachWithIndex { (o, i) =>
      val (s2, o2) = f(s, o)
      arr(i) = o2
      s = s2
    }
    s -> Chunk.array(arr).asInstanceOf[Chunk[O2]]
  }
```

## 前提知識

- 「累積」は、先頭から今までの結果を積み重ねていくことです。たとえば足し算の途中の合計がその例です。
- `S` は、途中の状態の型です。`O` は、元の要素の型で、`O2` は変換後の要素の型です。
- `f: (S, O) => (S, O2)` は、今の状態と要素から、次の状態と変換後の値の組を返す関数です。
- `(s2, o2)` は、タプルを分けて受け取る書き方です。`Tuple2` の 2 つの要素を、2 つの名前に分けます。
- `s -> Chunk...` は、2 つの値を組にする書き方で、`(s, Chunk...)` と同じです。
- `new Array[Any](size)` は、要素の数だけ空きのある配列を作ります。結果を後から入れる領域です。

## 何をしているか

### 1. 結果の配列と、初期の状態を用意する

結果を入れる配列を、元の大きさで作ります。状態 `s` は、最初の値 `init` から始めます。

```scala:line-numbers=247
    val arr = new Array[Any](size)
    var s = init
```

### 2. 要素を順に変換して、状態を更新する

`foreachWithIndex` で、要素と番号を順に取り出します。`f(s, o)` で新しい状態 `s2` と変換後の値 `o2` を受け取り、`o2` を配列に入れ、状態を `s2` に置き換えます。

```scala:line-numbers=249
    foreachWithIndex { (o, i) =>
      val (s2, o2) = f(s, o)
      arr(i) = o2
      s = s2
    }
    s -> Chunk.array(arr).asInstanceOf[Chunk[O2]]
```

### 3. 最後の状態と、変換後の Chunk を返す

すべての要素を変換し終わったら、最後の状態と、配列から作った `Chunk` の組を返します。

```scala:line-numbers=255
  }
```

## ここがすごい

- 1 回の走査で、変換と状態の更新を同時に行います。同じ処理を 2 回に分けて書く必要がありません。
- 状態を変数で持ち、関数の戻り値で更新するので、変換の関数そのものは状態を持たずに書けます。副作用のない関数として扱えます。
- 結果を配列に直接入れるので、要素をリストに集めてから作り直す無駄がありません。
- 最後の状態も返すので、続きの処理に状態を引き継げます。途中で区切って処理するときに便利です。

## まとめ

- 途中の結果を持ちながら変換するには、状態と要素から次の状態と値を返す関数を使います。
- 変換後の要素と、最後の状態を組で返すと、続きの処理に値を渡せます。
- 配列に直接書き込むと、メモリの無駄が少なくなります。
