---
title: "要素と、その位置の番号を組にした Chunk を作る"
description: "fs2 の Chunk.zipWithIndex。各要素を、0 から始まる番号と組にして、新しい Chunk を作る。結果の配列を最初に元の大きさで用意し、番号を付けながら順に入れる。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [541, 545]
format: 2
function: "Chunk.zipWithIndex"
difficulty: 2
tags: [関数型, イテレータ, 標準ライブラリ]
---

## ひとことで

fs2 の `Chunk` の `zipWithIndex` は、それぞれの要素に、先頭から数えた番号を付けます。`Chunk("The", "quick", "brown")` からは、`("The", 0)`、`("quick", 1)`、`("brown", 2)` の組の `Chunk` ができます。番号が要るときに、一度に付けられる便利な関数です。

## コード

```scala:line-numbers=541
  def zipWithIndex: Chunk[(O, Int)] = {
    val arr = new Array[(O, Int)](size)
    foreachWithIndex((o, i) => arr(i) = (o, i))
    Chunk.array(arr)
  }
```

## 前提知識

- 「インデックス」は、先頭から数えた位置の番号です。Scala では 0 から数えるのが普通です。
- `Chunk` は、要素を並べて持つ不変の塊です。作られた後は、中身を変えられません。
- `(O, Int)` は、要素と番号の組の型です。結果は、この組を要素とする `Chunk` になります。
- `foreachWithIndex` は、要素と番号を同時に受け取って、順に処理する関数です。
- `new Array[(O, Int)](size)` は、組の配列を、元と同じ大きさで最初に作る書き方です。

## 何をしているか

### 1. 組の配列を、元と同じ大きさで用意する

結果を入れる配列を、元の `Chunk` の大きさで作ります。組は後から入れるので、この時点では空の場所です。

```scala:line-numbers=542
    val arr = new Array[(O, Int)](size)
```

### 2. 要素と番号を組にして、配列に入れる

`foreachWithIndex` で、要素 `o` と番号 `i` を順に受け取ります。`(o, i)` の組を、配列の `i` 番目に入れます。

```scala:line-numbers=543
    foreachWithIndex((o, i) => arr(i) = (o, i))
```

### 3. 配列を Chunk にして返す

すべての要素に番号を付けたら、配列を `Chunk` に包んで返します。

```scala:line-numbers=544
    Chunk.array(arr)
```

## ここがすごい

- 番号を数える変数を別に持たず、`foreachWithIndex` が番号を渡してくれるので、コードが短くなります。
- 結果の大きさを最初に決めて、組を直接入れるので、途中でリストを作る無駄がありません。
- 番号は `Int` として付くので、配列の添字とそのまま対応します。元の位置を取り出す処理と相性が良いです。
- 同じ仕組みで `zipWith` を使えば、番号以外の値とも組にできます。部品の作りが共通しています。

## まとめ

- 番号を付けるには、結果の配列を先に用意し、番号を渡しながら組を入れます。
- 番号付きのデータは、後で位置を使う処理に便利です。
- 小さな部品を組み合わせると、似た処理を少ないコードで書けます。
