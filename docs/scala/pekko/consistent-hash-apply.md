---
title: "リングに仮想ノードを並べ、同じ位置の衝突を解決する"
description: "Apache Pekko の ConsistentHash.apply。各ノードを複数の仮想ノードとしてハッシュの円に並べ、位置と番号を 1 つの Long にまとめてソートし、同じ位置の衝突は決まった順で解決する。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/routing/ConsistentHash.scala"
lines: [134, 181]
format: 2
function: "ConsistentHash.apply"
difficulty: 3
tags: [データ構造, ハッシュ, 並行処理, アルゴリズム]
---

## ひとことで

Apache Pekko の `ConsistentHash` を作る `apply` です。1 つのノードを複数の「仮想ノード」としてハッシュの円に並べることで、ノード間の負荷を均等に近づけます。位置が同じ仮想ノードが出た場合は、決まったルールで持ち主を 1 つに決めます。

## コード

::: code-group

```scala:line-numbers=134 [日本語訳]
  def apply[T: ClassTag](nodes: Iterable[T], virtualNodesFactor: Int): ConsistentHash[T] = {
    if (virtualNodesFactor < 1) throw new IllegalArgumentException("virtualNodesFactor must be >= 1")
    val nodeArray = nodes.toArray
    val total = nodeArray.length * virtualNodesFactor
    // 各仮想ノードは「リング上の位置 << 32 | 番号」の 1 つの Long にまとめ、プリミティブな並べ替えで位置順に並ぶようにします。
    // 同じ位置のものは、挿入された順に並びます。
    val points = new Array[Long](total)
    var n = 0
    while (n < nodeArray.length) {
      val nodeHash = hashFor(nodeArray(n).toString)
      var r = 1
      while (r <= virtualNodesFactor) {
        val i = n * virtualNodesFactor + r - 1
        points(i) = (concatenateNodeHash(nodeHash, r).toLong << 32) | i
        r += 1
      }
      n += 1
    }
    Arrays.sort(points)

    def hashAt(i: Int): Int = (points(i) >> 32).toInt
    def nodeAt(i: Int): T = nodeArray((points(i) & 0xFFFFFFFFL).toInt / virtualNodesFactor)

    val ring = immutable.TreeMap.newBuilder[Int, T]
    var collisions = immutable.Map.empty[Int, List[T]]
    var i = 0
    while (i < total) {
      val hash = hashAt(i)
      var end = i + 1
      while (end < total && hashAt(end) == hash) end += 1
      if (end == i + 1) ring += hash -> nodeAt(i)
      else {
        // 珍しいケースです。同じリング位置に複数の仮想ノードがあるときは、`:+` と同じ方法で解決します。
        var claimants = List.empty[T]
        var j = i
        while (j < end) {
          val node = nodeAt(j)
          claimants = node :: claimants.filterNot(sameNode(_, node))
          j += 1
        }
        val (owner, others) = ownerOf(claimants)
        ring += hash -> owner
        if (others.nonEmpty) collisions = collisions.updated(hash, others)
      }
      i = end
    }
    new ConsistentHash(ring.result(), collisions, virtualNodesFactor)
  }
```

```scala:line-numbers=134 [原文]
  def apply[T: ClassTag](nodes: Iterable[T], virtualNodesFactor: Int): ConsistentHash[T] = {
    if (virtualNodesFactor < 1) throw new IllegalArgumentException("virtualNodesFactor must be >= 1")
    val nodeArray = nodes.toArray
    val total = nodeArray.length * virtualNodesFactor
    // each virtual node is encoded as (ring position << 32 | index), so that a primitive sort orders
    // them by ring position, and by insertion order for the same position
    val points = new Array[Long](total)
    var n = 0
    while (n < nodeArray.length) {
      val nodeHash = hashFor(nodeArray(n).toString)
      var r = 1
      while (r <= virtualNodesFactor) {
        val i = n * virtualNodesFactor + r - 1
        points(i) = (concatenateNodeHash(nodeHash, r).toLong << 32) | i
        r += 1
      }
      n += 1
    }
    Arrays.sort(points)

    def hashAt(i: Int): Int = (points(i) >> 32).toInt
    def nodeAt(i: Int): T = nodeArray((points(i) & 0xFFFFFFFFL).toInt / virtualNodesFactor)

    val ring = immutable.TreeMap.newBuilder[Int, T]
    var collisions = immutable.Map.empty[Int, List[T]]
    var i = 0
    while (i < total) {
      val hash = hashAt(i)
      var end = i + 1
      while (end < total && hashAt(end) == hash) end += 1
      if (end == i + 1) ring += hash -> nodeAt(i)
      else {
        // rare: several virtual nodes at the same ring position, resolve them like `:+` does
        var claimants = List.empty[T]
        var j = i
        while (j < end) {
          val node = nodeAt(j)
          claimants = node :: claimants.filterNot(sameNode(_, node))
          j += 1
        }
        val (owner, others) = ownerOf(claimants)
        ring += hash -> owner
        if (others.nonEmpty) collisions = collisions.updated(hash, others)
      }
      i = end
    }
    new ConsistentHash(ring.result(), collisions, virtualNodesFactor)
  }
```

:::

## 前提知識

- 一貫性ハッシュでは、ノードをハッシュの円に置き、キーを時計回りの次のノードへ割り当てます（前の記事の `idx` を参照）。
- 仮想ノード（virtual node）は、1 つの実ノードを複数の点として円に置いたものです。点が増えると、担当の偏りが小さくなります。
- `Array[Long]` を `Arrays.sort` でソートすると、プリミティブな値として速く並べ替えられます。
- `<<` と `|` で、上位 32 ビットに位置、下位 32 ビットに番号を入れられます。
- `TreeMap` は、キーの順で並んだ不変の連想配列です。

## 何をしているか

### 1. 仮想ノードの位置と番号を 1 つの Long にする

各ノードのハッシュ値と仮想ノードの番号 `r` から位置を作り、位置を上位、添字 `i` を下位にして 1 つの `Long` に詰めます。

```scala:line-numbers=147
        points(i) = (concatenateNodeHash(nodeHash, r).toLong << 32) | i
```

この `Long` を並べると、位置の順に並びます。同じ位置なら、添字の小さい順です。

### 2. ソートして、位置ごとに 1 つのノードを置く

`Arrays.sort(points)` で並べた後、同じ位置が続いているかを調べます。1 つだけなら、そのまま `TreeMap` に追加します。

```scala:line-numbers=164
      if (end == i + 1) ring += hash -> nodeAt(i)
```

### 3. 同じ位置の複数のノードは、同じ規則で 1 つに決める

同じ位置に複数のノードがあれば、`ownerOf` で持ち主を 1 つに決めます。決まらなかったノードは `collisions` に残します。

## ここがすごい

- 位置と番号を 1 つの `Long` に詰めると、並べ替えに比較関数が要りません。`Long` の標準のソートだけで、位置の順と挿入の順が同時に決まります。
- 仮想ノードを使うと、ノードの追加や削除で動くキーの量が少なくなり、負荷の偏りも小さくなります。
- 同じ位置の衝突は、ごく珍しい場合だけ通る道です。コメントにもあるように、普段は速い道を、珍しい場合だけ丁寧な道を通ります。
- 衝突の解決を `:+` と同じルールにしておくと、後から 1 つずつ追加した結果と、まとめて作った結果が一致します。

## まとめ

- 一貫性ハッシュでは、1 つのノードを複数の仮想ノードとして円に置くと、負荷が均等に近づきます。
- 位置と番号を 1 つの `Long` にまとめると、標準の並べ替えで順序を決められます。
- 衝突はまれなので、速い道と丁寧な道を分けて書くと効率的です。
