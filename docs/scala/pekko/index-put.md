---
title: "同じキーの集合に値を足す、やり直しつきの追加"
description: "Apache Pekko の Index.put。キーごとに並べ替えた集合を持つ並行マップに、値を入れる。集合が取り除かれた途中の状態に当たったら、末尾再帰で最初から試し直す。ConcurrentHashMap と synchronized を組み合わせた書き方。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/Index.scala"
lines: [39, 77]
format: 2
function: "Index.put"
difficulty: 3
tags: [並行処理, データ構造, 再帰]
---

## ひとことで

Apache Pekko の `Index` は、1 つのキーに複数の値を並べて持つ、並行処理に対応したマップです。`put` は、キーに対応する集合に値を入れます。集合が途中で空になっていた場合は、最初からやり直します。

## コード

::: code-group

```scala:line-numbers=39 [日本語訳]
  def put(key: K, value: V): Boolean = {
    // 末尾再帰で、うまくいくまで繰り返す put です。
    @tailrec
    def spinPut(k: K, v: V): Boolean = {
      var retry = false
      var added = false
      val set = container.get(k)

      if (set ne null) {
        set.synchronized {
          if (set.isEmpty) retry = true // 集合が空なら、途中で取り除かれたということなので、やり直しを知らせます。
          else { // そうでなければ、値を集合に足し、やり直しは不要だと知らせます。
            added = set.add(v)
            retry = false
          }
        }
      } else {
        val newSet = new ConcurrentSkipListSet[V](valueComparator)
        newSet.add(v)

        // 2 つの putIfAbsent が同時に走ったときの対応です。
        val oldSet = container.putIfAbsent(k, newSet)
        if (oldSet ne null) {
          oldSet.synchronized {
            if (oldSet.isEmpty) retry = true // 集合が空なら、途中で取り除かれたということなので、やり直しを知らせます。
            else { // そうでなければ、既存の集合に値を足し、やり直しは不要だと知らせます。
              added = oldSet.add(v)
              retry = false
            }
          }
        } else added = true
      }

      if (retry) spinPut(k, v)
      else added
    }

    spinPut(key, value)
  }
```

```scala:line-numbers=39 [原文]
  def put(key: K, value: V): Boolean = {
    // Tailrecursive spin-locking put
    @tailrec
    def spinPut(k: K, v: V): Boolean = {
      var retry = false
      var added = false
      val set = container.get(k)

      if (set ne null) {
        set.synchronized {
          if (set.isEmpty) retry = true // IF the set is empty then it has been removed, so signal retry
          else { // Else add the value to the set and signal that retry is not needed
            added = set.add(v)
            retry = false
          }
        }
      } else {
        val newSet = new ConcurrentSkipListSet[V](valueComparator)
        newSet.add(v)

        // Parry for two simultaneous putIfAbsent(id,newSet)
        val oldSet = container.putIfAbsent(k, newSet)
        if (oldSet ne null) {
          oldSet.synchronized {
            if (oldSet.isEmpty) retry = true // IF the set is empty then it has been removed, so signal retry
            else { // Else try to add the value to the set and signal that retry is not needed
              added = oldSet.add(v)
              retry = false
            }
          }
        } else added = true
      }

      if (retry) spinPut(k, v)
      else added
    }

    spinPut(key, value)
  }
```

:::

## 前提知識

- `ConcurrentHashMap` は、複数のスレッドから同時に使えるマップです。`get` や `putIfAbsent` は、ほかのスレッドと衝突しないように作られています。
- `ConcurrentSkipListSet` は、値を順に並べて持つ、並行処理に強い集合です。`valueComparator` で並び方を決めます。
- `synchronized` は、ある 1 つのオブジェクトを使って、同時に 1 つのスレッドだけが中に入れるようにする仕組みです。
- `@tailrec` は、末尾の再帰をループに変えることをコンパイラに確かめさせる注釈です。`spinPut` を自分自身で呼び直せます。
- `ne null` は、値が `null` ではないかを調べる書き方です。`eq` は同じオブジェクトかを表します。

## 何をしているか

### 1. キーに集合があるかを調べる

まず `container.get(k)` で、キーに対応する集合を探します。集合が見つかったら、その集合に値を入れる処理へ進みます。

```scala:line-numbers=45
      val set = container.get(k)

```

### 2. 集合が見つかれば、ロックして値を足す

集合を `synchronized` で囲み、中身が空かどうかを調べます。空なら、ほかのスレッドが集合を取り除いた途中なので、やり直しを知らせます（`retry = true`）。空でなければ、値を足します。

```scala:line-numbers=48
        set.synchronized {
          if (set.isEmpty) retry = true // IF the set is empty then it has been removed, so signal retry
          else { // Else add the value to the set and signal that retry is not needed
            added = set.add(v)
            retry = false
          }
        }
```

### 3. 集合が無ければ、新しく作って入れる

集合が無いときは、新しい集合を作って値を 1 つ入れ、`putIfAbsent` で登録します。すでに別のスレッドが登録していたら、その集合にロックして値を足します。こちらも空なら、やり直しです。

```scala:line-numbers=56
        val newSet = new ConcurrentSkipListSet[V](valueComparator)
        newSet.add(v)

        // Parry for two simultaneous putIfAbsent(id,newSet)
        val oldSet = container.putIfAbsent(k, newSet)
        if (oldSet ne null) {
          oldSet.synchronized {
            if (oldSet.isEmpty) retry = true // IF the set is empty then it has been removed, so signal retry
            else { // Else try to add the value to the set and signal that retry is not needed
              added = oldSet.add(v)
              retry = false
            }
          }
        } else added = true
      }

```

### 4. やり直しが必要なら、最初からもう一度

`retry` が真なら、`spinPut` を同じ引数で呼び直します。偽なら、`added` を返して終わります。`@tailrec` なので、呼び直しはスタックを増やさないループになります。

```scala:line-numbers=72
      if (retry) spinPut(k, v)
      else added
    }

```

## ここがすごい

- ロックを集合の単位で取るので、キーが違えば同時に動けます。マップ全体を 1 つのロックで止めることがありません。
- 「集合が取り除かれた途中」を、空かどうかで判断します。ロックの中で確かめるので、競合する操作の結果を正しく見分けられます。
- `putIfAbsent` で、同時に 2 つのスレッドが新しい集合を作る競合を防ぎます。負けた側は、勝った側の集合に値を足します。
- `@tailrec` の再帰で、やり直しをループとして書けます。失敗が続いても、スタックが深くなりません。

## まとめ

- 並行マップでは、キー単位のロックと `putIfAbsent` を組み合わせると、競合に強くなります。
- 途中の状態を空かどうかで判定し、やり直すと、取り除きと追加が同時に起きても正しく動きます。
- やり直しは末尾の再帰で書くと、安全で読みやすくなります。
