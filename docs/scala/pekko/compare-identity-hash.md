---
title: "同じハッシュ値でも並べられる、オブジェクトの順番"
description: "Apache Pekko の Helpers.compareIdentityHash。System.identityHashCode を使い、オーバーフローさせずに 2 つのオブジェクトの順番を決める。並べ替えのたびに同じ結果になる。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/Helpers.scala"
lines: [49, 57]
format: 2
function: "Helpers.compareIdentityHash"
difficulty: 2
tags: [ソート, ハッシュ, 防御的プログラミング]
---

## ひとことで

Apache Pekko の `Helpers` にある `compareIdentityHash` は、2 つのオブジェクトの大小を決める関数です。オブジェクトの中身を見ずに、`System.identityHashCode` という、オブジェクトごとに決まる番号で比べます。並べ替えに使うと、同じ番号のものも安定した順番になります。

## コード

::: code-group

```scala:line-numbers=49 [日本語訳]
  def compareIdentityHash(a: AnyRef, b: AnyRef): Int = {
    /*
     * 比較でオーバーフローやアンダーフローが起きないようにし、
     * 並び順が本当に一貫するようにします。そうしないと、
     * 循環して終わりなく単調増加する並びができてしまうためです。
     */
    val diff = (System.identityHashCode(a) & 0xFFFFFFFFL) - (System.identityHashCode(b) & 0xFFFFFFFFL)
    if (diff > 0) 1 else if (diff < 0) -1 else 0
  }
```

```scala:line-numbers=49 [原文]
  def compareIdentityHash(a: AnyRef, b: AnyRef): Int = {
    /*
     * make sure that there is no overflow or underflow in comparisons, so
     * that the ordering is actually consistent and you cannot have a
     * sequence which cyclically is monotone without end.
     */
    val diff = (System.identityHashCode(a) & 0xFFFFFFFFL) - (System.identityHashCode(b) & 0xFFFFFFFFL)
    if (diff > 0) 1 else if (diff < 0) -1 else 0
  }
```

:::

## 前提知識

- `System.identityHashCode(obj)` は、そのオブジェクト自身に割り当てられた番号を返す標準の関数です。`hashCode` を上書きしていても、この番号は変わりません。
- 比較関数は、`a < b` なら負の数、等しいなら 0、大きければ正の数を返すのが約束です。
- `Int` の引き算は、大きな差があると溢れて符号が逆になることがあります。
- `& 0xFFFFFFFFL` は、`Int` の値を符号なしの `Long` として扱うためのマスクです。
- ソートは、比べた結果が一貫していないと、正しく終わらないことがあります。

## 何をしているか

### 1. 番号を符号なしの Long にする

2 つのオブジェクトの番号を、`& 0xFFFFFFFFL` で `Long` にします。`Int` のままでは、負の番号が混ざって大小がずれるからです。

```scala:line-numbers=55
    val diff = (System.identityHashCode(a) & 0xFFFFFFFFL) - (System.identityHashCode(b) & 0xFFFFFFFFL)
```

### 2. 差を取って、符号で大小を決める

2 つの番号の差 `diff` の符号で、戻り値を決めます。正なら `1`、負なら `-1`、ゼロなら `0` です。

```scala:line-numbers=56
    if (diff > 0) 1 else if (diff < 0) -1 else 0
```

差を `Long` で取っているので、`Int` の範囲の番号どうしを比べても溢れません。

## ここがすごい

- `Int` の差で比べると、`Int.MinValue` と正の値の差が溢れて、大小が逆に見えてしまいます。`Long` にすることで、この罠を避けています。
- 注釈のコメントにあるように、大小が循環すると、ソートが終わらなくなったり、結果がおかしくなったりします。一貫性を守るのが、この関数の最大の目的です。
- 番号は同じオブジェクトなら必ず同じなので、同じ参照を比べると 0 になります。並べ替えの結果が毎回同じになります。
- 番号が同じでも別のオブジェクトの場合には、`identityHashComparator` が本当の比較関数で補います。この関数の役割は、速い比較を提供することです。

## まとめ

- 比較関数で差を取るときは、`Int` の溢れを防ぐために `Long` を使います。
- 並べ替えで使う比較は、いつも一貫した大小を返す必要があります。
- オブジェクトの番号を使うと、中身に依存しない速い比較ができます。
