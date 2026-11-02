---
title: "各要素に、先頭から数えた番号をつける"
description: "Cats の NonEmptyList.zipWithIndex。各要素を、(要素, 番号) の組にする。先頭は 0、残りは 1 から始め、ミュータブルなビルダーに足していく。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/NonEmptyList.scala"
lines: [478, 487]
format: 2
function: "NonEmptyList.zipWithIndex"
difficulty: 2
tags: [イテレータ, データ構造, 関数型]
---

## ひとことで

`zipWithIndex` は、リストの各要素に、先頭から数えた番号を組にしてつけます。例えば `NonEmptyList("a", "b")` なら `(("a", 0), ("b", 1))` のようになります。インデックス付きで要素を処理したいときに使います。

## コード

```scala:line-numbers=478
  def zipWithIndex: NonEmptyList[(A, Int)] = {
    val bldr = List.newBuilder[(A, Int)]
    var idx = 1
    val it = tail.iterator
    while (it.hasNext) {
      bldr += ((it.next(), idx))
      idx += 1
    }
    NonEmptyList((head, 0), bldr.result())
  }
```

## 前提知識

- 「インデックス」は、先頭から何番目かを表す番号です。ふつうは 0 から数えます。
- `(A, Int)` は、要素と番号の組（タプル）です。
- `List.newBuilder` は、要素を末尾に足していき、最後にリストにする道具です。`+=` で要素を足します。
- `tail.iterator` は、残りの要素を先頭から順に取り出す反復子です。`hasNext` と `next()` で一つずつ進みます。
- `var` は、後から値を変えられる変数です。`idx` や `it` が該当します。

## 何をしているか

### 1. 番号 `idx` を 1 から数えながら、残りの要素を組にする

`idx` は 1 から始まります。残りの要素を一つずつ取り出し、`(要素, idx)` の組をビルダーに足します。足すたびに `idx` を 1 増やします。

```scala:line-numbers=480
    var idx = 1
    val it = tail.iterator
    while (it.hasNext) {
      bldr += ((it.next(), idx))
      idx += 1
    }
```

### 2. 先頭だけは番号 0 で組にして、リストを作る

先頭の要素は、残りとは別に `(head, 0)` の組にします。ビルダーの結果と合わせて `NonEmptyList` を作れば完成です。

```scala:line-numbers=486
    NonEmptyList((head, 0), bldr.result())
```

## ここがすごい

- 先頭は番号 0、残りは 1 からと、番号の始まりを明確に分けています。これで、どの要素も一度ずつ正しい番号を受け取ります。
- 結果は、`NonEmptyList` の型のままです。空にならないという約束を、番号付きでも保てます。
- `var` とビルダーを使い、一度のループで全体を作っています。途中で新しい中間リストをたくさん作りません。
- 反復子を使うので、残りのリストを先頭から一方向にたどるだけで済みます。

## まとめ

- `zipWithIndex` は、各要素を `(要素, 番号)` の組にします。
- 先頭は 0、残りは 1 から番号をつけます。
- ビルダーと反復子を使い、一度のループで非空のリストを作ります。
