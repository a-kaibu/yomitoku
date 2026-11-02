---
title: "連結を O(1) にする、リストのつなぎ方"
description: "Cats の Chain.concat。2 つの Chain を木のノードでつなぐだけなので、要素数に関係なく一定時間でつなげる。空のときは余計なノードを作らない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Chain.scala"
lines: [1168, 1176]
format: 2
function: "Chain.concat"
difficulty: 2
tags: [データ構造, 関数型, 最適化]
---

## ひとことで

Cats の `Chain` という、連結が速いデータ構造の連結を行う `concat` です。2 つの `Chain` をそのまま 1 つの木のノードとしてつなぐので、要素がいくつあっても一定の時間で終わります。どちらかが空なら、もう片方をそのまま返します。

## コード

```scala:line-numbers=1168
  def concat[A](c: Chain[A], c2: Chain[A]): Chain[A] =
    c match {
      case non: NonEmpty[A] =>
        c2 match {
          case non2: NonEmpty[A] => Append(non, non2)
          case _                 => non
        }
      case _ => c2
    }
```

## 前提知識

- Cats は Scala の関数型プログラミングを支えるライブラリです。`Chain` はその中の、要素を後ろに足したり連結したりするのが得意なデータ構造です。
- `List` の `++` は、左側の要素を全部たどってコピーするので、左が長いと遅くなります。
- `Chain` は、要素を木構造で持つことで、連結を「ノードを 1 つ作るだけ」にしています。
- `case non: NonEmpty[A] =>` は、型が `NonEmpty` のときに変数 `non` に束縛するパターンマッチです。
- `_` は「何でもよい」を表す書き方です。

## 何をしているか

### 1. 左が空でないなら、右を確認する

`concat` は、まず左の `c` が空かどうかを調べます。空でなければ `NonEmpty` という型に分けて、さらに右の `c2` を調べます。

```scala:line-numbers=1170
      case non: NonEmpty[A] =>
        c2 match {
          case non2: NonEmpty[A] => Append(non, non2)
          case _                 => non
```

左右ともに空でない場合だけ、2 つをつなぐノードを作ります。

### 2. 片方が空なら、もう片方を返す

右が空のときは、左の `non` をそのまま返します。左が空のときは、最後の `case _ => c2` で右を返します。

このように、空の連結でノードを 1 つも作らないことで、無駄な割り当てを減らしています。

### 3. Append ノードで木をつなぐ

空でないもの同士を `Append(non, non2)` で包むと、2 つのデータはもとの形のまま、木の左右の枝になります。コピーは行わないので、要素数が多くても時間は変わりません。

## ここがすごい

- 配列や `List` の連結は、要素を移動またはコピーするので、要素数に比例して時間がかかります。`Chain` は木のノードを 1 つ作るだけなので、一定の時間で終わります。
- 連結を何回も重ねても、木の形が深くなるだけです。ただし、後で中身を取り出すとき（`uncons` など）に木をたどり直して整理する仕組みがあり、取り出しの計算は償却 O(1) になるように作られています。
- 空の場合を先に調べ、ノードを作らないようにしている点も、細かい工夫です。
- 「連結が速い代わりに、先頭からの取り出しは少し工夫が要る」という割り切りは、このデータ構造の設計の中心です。

## まとめ

- 連結を速くしたいときは、要素をコピーせず、木のノードでつなぐ方法があります。
- 空の場合は何もしないで、もう片方をそのまま返すと無駄がありません。
- 速さが得意な操作と苦手な操作を決めて作るのが、データ構造の設計です。
