---
title: "キーと値を交互に並べた配列で、二分探索する"
description: "Apache Pekko の ImmutableIntMap.get。キーと値を 1 本の配列に交互に入れ、キーだけを二分探索する。割り当てなしで、見つからないときは Int.MinValue を返す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2016-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/ImmutableIntMap.scala"
lines: [67, 80]
format: 2
function: "ImmutableIntMap.get"
difficulty: 3
tags: [データ構造, 探索, 最適化]
---

## ひとことで

Apache Pekko の `ImmutableIntMap` は、`Int` のキーと `Int` の値を持つ不変な連想配列です。`get` は、キーで値を探します。キーと値を 1 本の配列に交互に並べておき、キーの位置だけを二分探索するので、割り当てをせずに `O(log n)` で見つかります。

## コード

::: code-group

```scala:line-numbers=67 [日本語訳]
  final def get(key: Int): Int = {
    // indexForKey と同じ二分探索を、性能のためにここにも書いています。
    @tailrec def find(lo: Int, hi: Int): Int =
      if (lo <= hi) {
        val lohi = lo + hi // 配列の半分だけを探すので、キーの本当の添字を得るための 2 での割り算は不要です。
        val k = kvs(lohi & ~1) // キーは偶数の位置にあるので、lo+hi から最下位ビットを外して、キーの添字を得ます。
        if (k == key)
          kvs(lohi | 1) // lohi が奇数なら値の位置をすでに指しています。偶数なら最下位ビットを 1 にして、値の位置にします。
        else if (k < key) find((lohi >>> 1) + 1, hi)
        else /* if (k > key) */ find(lo, (lohi >>> 1) - 1)
      } else Int.MinValue

    find(0, size - 1)
  }
```

```scala:line-numbers=67 [原文]
  final def get(key: Int): Int = {
    // same binary search as in `indexforKey` replicated here for performance reasons.
    @tailrec def find(lo: Int, hi: Int): Int =
      if (lo <= hi) {
        val lohi = lo + hi // Since we search in half the array we don't need to div by 2 to find the real index of key
        val k = kvs(lohi & ~1) // Since keys are in even slots, we get the key idx from lo+hi by removing the lowest bit if set (odd)
        if (k == key)
          kvs(lohi | 1) // lohi, if odd, already points to the value-index, if even, we set the lowest bit to add 1
        else if (k < key) find((lohi >>> 1) + 1, hi)
        else /* if (k > key) */ find(lo, (lohi >>> 1) - 1)
      } else Int.MinValue

    find(0, size - 1)
  }
```

:::

## 前提知識

- 連想配列（Map）は、キーから値を引くデータ構造です。キーが整数なら、キーを昇順に並べておくと二分探索で探せます。
- 二分探索は、真ん中と比べて探す範囲を半分にする探し方です。
- `lo` と `hi` は、探す範囲の両端の添字です。`lohi` は両端の和で、真ん中を求めるのに使います。
- `& ~1` は、最下位ビットを 0 にする操作です。偶数の位置にそろえるために使います。
- `Int.MinValue` は、`Int` の最小の値で、ここでは「見つからない」の印です。

## 何をしているか

### 1. 真ん中の位置を、キーの位置に直す

キーと値は交互に並んでいるので、両端の和 `lohi` から、キーの位置を作ります。最下位ビットを外すと、必ず偶数の位置、つまりキーの位置になります。

```scala:line-numbers=72
        val k = kvs(lohi & ~1) // Since keys are in even slots, we get the key idx from lo+hi by removing the lowest bit if set (odd)
```

### 2. 見つかったら、直後の値を返す

キーが見つかったら、その直後の値の位置を返します。`lohi | 1` は、奇数の位置、つまり値の位置を指します。

```scala:line-numbers=74
          kvs(lohi | 1) // lohi, if odd, already points to the value-index, if even, we set the lowest bit to add 1
```

### 3. キーが大きければ右、小さければ左

見つからないときは、`k < key` なら右半分、`k > key` なら左半分に範囲を狭めて、同じ関数を再帰で呼びます。

```scala:line-numbers=75
        else if (k < key) find((lohi >>> 1) + 1, hi)
        else /* if (k > key) */ find(lo, (lohi >>> 1) - 1)
```

範囲が空になったら `Int.MinValue` を返して、見つからなかったことを知らせます。

## ここがすごい

- キーと値を 1 本の配列に並べると、配列は 1 つで済み、オブジェクトの箱が要りません。`Map` のような別の箱を作らないので、割り当てがゼロです。
- 探索の範囲を「キーの数の半分」として扱い、添字を後から 2 倍して求めています。コメントにあるように、割り算を減らす工夫です。
- 再帰の呼び出しが末尾にあるので、`@tailrec` でループに変わり、スタックを増やしません。
- `Int.MinValue` を「見つからない」にするので、戻り値だけで結果が分かります。ただし、値として `Int.MinValue` を保存できないという制限を、ドキュメントに明記しています。

## まとめ

- 整数のキーの連想配列は、キーと値を交互に並べた配列で軽く持てます。
- 二分探索の添字を、ビット演算で正しい位置に直せます。
- 割り当てをしない探索は、大量の検索で効果が大きくなります。
