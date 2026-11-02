---
title: "立っているビットの数を、語ごとの 1 の数の合計で求める"
description: "Apache Spark の BitSet.cardinality。64 ビットの語ごとに、1 が立っている数を数えて合計する。ビットを 1 つずつ見ないので、大きな集合でも語の数だけの計算で済む。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [190, 198]
format: 2
function: "BitSet.cardinality"
difficulty: 2
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` で、集合に入っている要素の数を求めるのが `cardinality` です。0 と 1 の並びを 64 ビットずつ数えて、語ごとに 1 の数を足し合わせます。1 ビットずつ見るより、ずっと速く終わります。

## コード

```scala:line-numbers=190
  def cardinality(): Int = {
    var sum = 0
    var i = 0
    while (i < numWords) {
      sum += java.lang.Long.bitCount(words(i))
      i += 1
    }
    sum
  }
```

## 前提知識

- 「カーディナリティ」は、集合の要素の数のことです。`BitSet` では、1 が立っているビットの数と同じです。
- `BitSet` は、`Long`（64 ビット）の配列 `words` で持ちます。`numWords` は、その語の数です。
- 「ポップカウント」は、2 進数の中の 1 の数を数える操作です。例えば `1011` なら 3 です。
- Java の `Long.bitCount` は、64 ビットの値の 1 の数を返す関数です。多くの CPU では、1 つの命令で計算されます。
- `while` の中で `i += 1` と書くのは、Scala で添字を進めるときの定番の書き方です。

## 何をしているか

### 1. 合計を 0 にして、語を先頭から順に見る

`sum` は、今までに数えた 1 の数の合計です。`i` は、今見ている語の番号です。

```scala:line-numbers=191
    var sum = 0
    var i = 0
```

### 2. 語ごとに 1 の数を数えて、合計に足す

`bitCount` は、語の中の 1 の数を返します。その値を `sum` に足して、次の語へ進みます。

```scala:line-numbers=193
    while (i < numWords) {
      sum += java.lang.Long.bitCount(words(i))
      i += 1
    }
```

### 3. 合計を返す

すべての語を見終わったら、`sum` が集合の要素の数になります。

```scala:line-numbers=197
    sum
  }
```

## ここがすごい

- 1 ビットずつ確かめると、ビットの数だけ繰り返しが必要です。この関数は、語の数（ビットの数の 64 分の 1）だけ繰り返します。
- 1 の数を数える処理を、`Long.bitCount` という専用の関数に任せています。多くの環境で、ハードウェアの命令に置き換えられています。
- 語の配列をそのまま順に読むので、メモリの並びに沿った速い読み方になります。
- 要素の数を毎回数えるのではなく、必要なときにまとめて数えます。集合に要素を入れるたびに数を更新する処理が要らない分、単純です。

## まとめ

- 集合の大きさは、語ごとの 1 の数の合計で求められます。
- 1 の数を数える処理は、専用の関数に任せると速く、読みやすくなります。
- ビットを語にまとめておくと、大量のビットも少ない回数で扱えます。
