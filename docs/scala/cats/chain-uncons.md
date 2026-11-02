---
title: "先頭を取り出すとき、木を平らにしながら進む"
description: "Cats の Chain.uncons。木の形をした Chain の先頭要素と残りを、右の枝を積んだ一時的なリストを使って、ループで取り出す。平均して O(1) で先頭が得られる。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Chain.scala"
lines: [82, 115]
format: 2
function: "Chain.uncons"
difficulty: 3
tags: [データ構造, 再帰, 関数型]
---

## ひとことで

Cats の `Chain` は、要素を木の形で持つ連結リストに似たデータ構造です。`uncons` は、先頭の要素と残りの `Chain` を取り出します。木の左側をたどって先頭を見つけ、途中で通った右側の枝を、後で使えるように積んでおきます。

## コード

```scala:line-numbers=82
  final def uncons: Option[(A, Chain[A])] =
    this match {
      case non: Chain.NonEmpty[A] =>
        var c: NonEmpty[A] = non
        var rights: Chain.NonEmpty[A] = null
        var result: (A, Chain[A]) = null
        while (result eq null) {
          c match {
            case Singleton(a) =>
              val next =
                if (rights eq null) nil
                else rights
              result = (a, next)
            case Append(l, r) =>
              rights =
                if (rights eq null) r
                else Append(r, rights)
              c = l
            case Wrap(seq) =>
              val tail = fromSeq(seq.tail)
              val next =
                if (rights eq null) tail
                else {
                  tail match {
                    case non: Chain.NonEmpty[A] => Append(non, rights)
                    case _                      => rights
                  }
                }
              result = (seq.head, next)
          }
        }
        Some(result)
      case _ => None
    }
```

## 前提知識

- `Chain` は、`concat` で連結を速くするために、要素を木のノードで持つデータ構造です。
- `uncons` は「先頭を取り出す（un-cons）」という意味で、`List` の `head` と `tail` を 1 つにまとめた操作です。
- `Option[(A, Chain[A])]` は、先頭と残りの組、または空なら `None` を返します。
- `var` は、ループの中で変わる変数です。`rights` は、後で処理する右側の枝を積むための変数です。
- `Singleton`、`Append`、`Wrap` は、`Chain` の内部の 3 種類のノードです。

## 何をしているか

### 1. 木の左側へ進みながら、右側の枝を積む

`Append(l, r)` のノードに出会ったときは、右側 `r` を `rights` に積み、左側 `l` を次に調べます。

```scala:line-numbers=95
            case Append(l, r) =>
              rights =
                if (rights eq null) r
                else Append(r, rights)
              c = l
```

このループで、左端の要素まで一直線にたどり着きます。途中の右側は、あとで順番に使うために積まれています。

### 2. 先頭の要素と、残りの木を作る

`Singleton(a)` に着いたら、その `a` が先頭です。積んであった `rights` を残りとして、先頭と組にします。

```scala:line-numbers=90
            case Singleton(a) =>
              val next =
                if (rights eq null) nil
                else rights
              result = (a, next)
```

### 3. Wrap は中身の Seq から先頭を取る

`Wrap(seq)` は、通常の `Seq` を包んだノードです。その先頭を取り出し、残りを `fromSeq` で `Chain` に戻して、積まれた枝とつなぎ直します。

```scala:line-numbers=100
            case Wrap(seq) =>
              val tail = fromSeq(seq.tail)
              val next =
                if (rights eq null) tail
                else {
                  tail match {
                    case non: Chain.NonEmpty[A] => Append(non, rights)
                    case _                      => rights
                  }
                }
              result = (seq.head, next)
```

## ここがすごい

- 木を左から順にたどるので、1 回の `uncons` は、左の深さに比例する時間で終わります。連続して取り出すと、平均して O(1) になるように設計されています。
- 右側の枝を `Append(r, rights)` の形で積むだけで、木を作り直しません。コピーをせずに残りの木ができます。
- `var` と `while` を使ったループにしているので、深い木でもスタックを使い切りません。
- 空かどうかを `NonEmpty` の型で先に分けているので、空の場合は `None` をすぐ返せます。

## まとめ

- 木の形のデータ構造は、左端をたどりながら右の枝を積むと、先頭を効率よく取り出せます。
- 途中の枝を積むことで、木を組み直さずに残りを作れます。
- 再帰の代わりに、明示的なスタックとループで書くと、深さに強くなります。
