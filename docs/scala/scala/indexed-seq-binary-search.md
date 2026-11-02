---
title: "ソート済みの列から、二分探索で位置を見つける"
description: "Scala の IndexedSeq.binarySearch。範囲の中央を調べ、目的の値より小さければ右半分、大きければ左半分へ絞る。見つからなければ挿入位置を返す。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/IndexedSeq.scala"
lines: [137, 150]
format: 2
function: "IndexedSeq.binarySearch"
difficulty: 3
tags: [アルゴリズム, 探索, 再帰]
---

## ひとことで

Scala の `IndexedSeq` は、添字で直接要素を取り出せる列です。`search` は、ソート済みの列から値を探します。`binarySearch` は、探す範囲を毎回半分に絞る二分探索です。見つかればその位置を、見つからなければ値を入れるべき位置を、`SearchResult` で返します。

## コード

```scala:line-numbers=137
  @tailrec
  private[this] def binarySearch[B >: A](elem: B, from: Int, to: Int)
                                        (implicit ord: Ordering[B]): SearchResult = {
    if (from < 0) binarySearch(elem, 0, to)
    else if (to > length) binarySearch(elem, from, length)
    else if (to <= from) InsertionPoint(from)
    else {
      val idx = from + (to - from - 1) / 2
      math.signum(ord.compare(elem, apply(idx))) match {
        case -1 => binarySearch(elem, from, idx)(ord)
        case  1 => binarySearch(elem, idx + 1, to)(ord)
        case  _ => Found(idx)
      }
    }
```

## 前提知識

- 二分探索は、ソート済みの列で、中央の値と比べて探す範囲を半分にする探索です。要素数が多くても、ほぼ `log n` 回の比較で終わります。
- `from` と `to` は、探す範囲の開始と終わりです。`to` は範囲に含まれない位置を指します。
- `ord.compare(x, y)` は、`x` と `y` を比べて、小さければ負、等しければ 0、大きければ正の値を返します。
- `math.signum` は、数の符号を `-1`、`0`、`1` のどれかにする関数です。
- `SearchResult` は、`Found(index)`（見つかった位置）か `InsertionPoint(index)`（入れる位置）のどちらかです。

## 何をしているか

### 1. 範囲が無効なときは、範囲を正しく直して調べ直す

`from` が負なら `0` から、`to` が長さを超えるなら長さまでに直して、もう一度呼びます。範囲が空（`to <= from`）なら、`from` を挿入位置として返します。

```scala:line-numbers=140
    if (from < 0) binarySearch(elem, 0, to)
    else if (to > length) binarySearch(elem, from, length)
    else if (to <= from) InsertionPoint(from)
```

### 2. 範囲の中央の位置を求め、値と比べる

`idx` は、範囲の中央付近の位置です。`from + (to - from - 1) / 2` の形で求めるので、`from` と `to` を足して溢れることがありません。その位置の値と `elem` を比べます。

```scala:line-numbers=144
      val idx = from + (to - from - 1) / 2
      math.signum(ord.compare(elem, apply(idx))) match {
```

### 3. 小さければ左半分、大きければ右半分へ、同じ探索を続ける

`elem` が小さければ `[from, idx)` を、大きければ `[idx + 1, to)` を調べます。等しければ `Found(idx)` で終わります。`@tailrec` が付いているので、再帰は繰り返しとして実行されます。

```scala:line-numbers=146
        case -1 => binarySearch(elem, from, idx)(ord)
        case  1 => binarySearch(elem, idx + 1, to)(ord)
        case  _ => Found(idx)
```

## ここがすごい

- 探す範囲を毎回半分にするので、要素が多くても、比較の回数はわずかです。
- `from + (to - from - 1) / 2` という書き方で、大きな添字でも値が溢れません。よく知られた落とし穴を避けています。
- 見つからない場合も、挿入位置を返すので、ソートされた列に新しい値を入れる位置がわかります。
- `@tailrec` で末尾再帰にしているので、深い再帰でもスタックを増やさず、繰り返しとして動きます。

## まとめ

- `binarySearch` は、ソート済みの列で探す範囲を毎回半分に絞ります。
- 見つかれば `Found`、見つからなければ挿入位置を `InsertionPoint` で返します。
- 中央の位置は、溢れない形で求めています。
