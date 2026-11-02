---
title: "各要素を変換して、同じ大きさの新しい Chunk を作る"
description: "fs2 の Chunk.map。要素の数と同じ大きさの配列を最初に作り、各要素に関数を適用して番号の位置へ入れる。結果は Chunk になり、元の Chunk は変わらない。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [236, 240]
format: 2
function: "Chunk.map"
difficulty: 1
tags: [関数型, イテレータ, 最適化]
---

## ひとことで

fs2 の `Chunk` で、各要素に関数をかけて、新しい `Chunk` を作るのが `map` です。たとえば `Chunk(1, 2, 3).map(_ * 10)` は `Chunk(10, 20, 30)` になります。元の `Chunk` は変わりません。

## コード

```scala:line-numbers=236
  def map[O2](f: O => O2): Chunk[O2] = {
    val arr = new Array[Any](size)
    foreachWithIndex((o, i) => arr(i) = f(o))
    Chunk.array(arr).asInstanceOf[Chunk[O2]]
  }
```

## 前提知識

- `map` は、列の各要素に同じ関数を適用して、新しい列を作る操作です。
- `Chunk` は不変なので、結果は新しい入れ物に入ります。元の `Chunk` の中身は変わりません。
- `new Array[Any](size)` は、要素の数と同じ大きさの配列を作る書き方です。最初は中身が空の場所です。
- `foreachWithIndex` は、要素と番号を同時に受け取って順に処理する関数です。
- `Chunk.array(arr)` は、配列から `Chunk` を作る関数です。

## 何をしているか

### 1. 要素の数と同じ大きさの配列を用意する

結果を入れる配列を、元の `Chunk` と同じ大きさで作ります。大きさが同じなので、途中で配列を作り直す必要はありません。

```scala:line-numbers=237
    val arr = new Array[Any](size)
```

### 2. 各要素を変換して、同じ番号の位置へ入れる

`foreachWithIndex` で要素 `o` と番号 `i` を受け取ります。`f(o)` の結果を、配列の `i` 番目に入れます。番号が同じなので、変換の前後で位置が対応しています。

```scala:line-numbers=238
    foreachWithIndex((o, i) => arr(i) = f(o))
```

### 3. 配列を Chunk にして返す

すべての要素を変換し終わったら、配列を `Chunk` に包んで返します。

```scala:line-numbers=239
    Chunk.array(arr).asInstanceOf[Chunk[O2]]
```

## ここがすごい

- 大きさを先に決めるので、途中で配列を作り直す回数はゼロです。`filter` のように大きさが分からない場合と違って、効率が良いです。
- 番号を使って同じ位置へ入れるので、順番が元の `Chunk` と必ず一致します。
- 変換の関数を渡すだけで、数や文字列、別の型への変換を同じ形で書けます。
- 結果の型 `O2` は、元の型 `O` と違っても構いません。

## まとめ

- 大きさが変わらない変換は、結果の配列を先に元の大きさで用意すると効率的です。
- 番号を使って位置を揃えると、変換前後の対応が崩れません。
- 関数を引数に取る形にすると、同じ処理を用途に合わせて使い回せます。
