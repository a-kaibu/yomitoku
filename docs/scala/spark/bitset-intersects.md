---
title: "2 つの集合に共通の要素があるかを、途中で止めながら調べる"
description: "Apache Spark の BitSet.intersects。2 つの集合に 1 つでも共通の要素があるかを判定する。語ごとに AND を取り、0 でない語が見つかった時点で真を返す。全部を調べ終わるまで待たない。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [257, 267]
format: 2
function: "BitSet.intersects"
difficulty: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` にある `intersects` は、2 つの集合に共通の要素が 1 つでもあるかを判定します。共通部分の全部を作る必要はなく、1 つ見つかった時点で真を返します。

## コード

```scala:line-numbers=257
  def intersects(other: BitSet): Boolean = {
    assert(numWords == other.numWords)
    var ind = 0
    while (ind < numWords) {
      if ((words(ind) & other.words(ind)) != 0) {
        return true
      }
      ind += 1
    }
    false
  }
```

## 前提知識

- 「交わる（intersect）」は、2 つの集合に共通の要素があることを意味します。
- `BitSet` では、語ごとの AND を取ると、両方に 1 が立っている位置が 1 として残ります。その値が 0 でなければ、共通の要素があるということです。
- `return true` は、関数の途中で値を返して、そこで終わる書き方です。
- `assert(numWords == other.numWords)` は、2 つの語の数が同じであることを確かめます。違えば例外が起きます。
- `false` は、最後まで共通部分が見つからなかった場合の答えです。

## 何をしているか

### 1. 語の数が同じことを確かめる

2 つの集合は、同じ語の数で作られている前提です。違うときは、例外で気づけるようにします。

```scala:line-numbers=258
    assert(numWords == other.numWords)
```

### 2. 語ごとに AND を取り、0 でなければすぐ返す

語を先頭から順に調べます。`words(ind) & other.words(ind)` が 0 でなければ、その語のどこかに共通の要素があります。そこで `return true` で終わります。

```scala:line-numbers=260
    while (ind < numWords) {
      if ((words(ind) & other.words(ind)) != 0) {
        return true
      }
      ind += 1
    }
```

### 3. 最後まで共通が無ければ、偽を返す

すべての語を調べても 0 のままなら、共通の要素はありません。そのとき `false` を返します。

```scala:line-numbers=266
    false
  }
```

## ここがすごい

- 共通の要素が見つかった時点で止まるので、残りの語を調べる必要がありません。見つかる場合ほど速く終わります。
- 共通部分の集合を作らないので、結果を保存するためのメモリが要りません。
- 語の AND の 1 回の計算で、64 個のビットをまとめて調べます。
- 「あるかどうか」だけが知りたいとき、全部の差集合や共通部分を作るより、ずっと軽い方法です。

## まとめ

- 共通の要素があるかだけ知りたいときは、共通部分を作らずに、途中で止められる判定を使います。
- 語ごとの AND は、0 かどうかで共通があるかを調べられます。
- 早く答えを返す形にすると、無駄な計算を省けます。
