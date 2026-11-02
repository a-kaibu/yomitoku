---
title: "64 ビットの中の 4 ビットの数を、溢れさせずに 1 増やす"
description: "Apache Pekko の FrequencySketch の incrementCounter。1 つの Long に、小さな数を詰め込んでいる。対象の数が上限に達していなければ、その数のビットだけに 1 を足す。上限なら何もせず、増えなかったことを返す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2021-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/FrequencySketch.scala"
lines: [213, 222]
format: 2
function: "FrequencySketch.incrementCounter"
difficulty: 3
tags: [ビット演算, データ構造, キャッシュ]
---

## ひとことで

Apache Pekko の `FrequencySketch` では、1 つの `Long`（64 ビット）の中に、小さな数（カウンタ）を何個も詰め込んでいます。`incrementCounter` は、その中の 1 つのカウンタを 1 増やします。ただし、上限に達していれば増やさず、結果として増えなかったことを返します。

## コード

```scala:line-numbers=213
  private def incrementCounter(row: Int, hash: Int): Boolean = {
    val column = (hash & columnMask) >>> slotShift
    val slot = (hash & slotMask) << counterShift
    val mask = counterMask << slot
    if ((matrix(row)(column) & mask) != mask) {
      matrix(row)(column) += (1L << slot)
      rowSizes(row) += 1
      true
    } else false
  }
```

## 前提知識

- `Long` は 64 ビットの整数です。ここでは、4 ビットずつ区切って、小さな数を 16 個まで入れています。
- カウンタの上限は、4 ビットで表せる最大の値（15）です。上限に達すると、それ以上は増えません。
- `slot` は、対象のカウンタが `Long` の中で始まるビットの位置です。`counterShift` でずらして決めます。
- `mask` は、そのカウンタのビットだけが 1 になった値です。`counterMask << slot` で作ります。
- `1L << slot` は、カウンタの一番下のビットに 1 を足す値です。

## 何をしているか

### 1. 対象の `Long` と、カウンタの位置を決める

`column` は、表の中の `Long` の番号です。`slot` は、その `Long` の中で、カウンタが始まるビットの位置です。

```scala:line-numbers=214
    val column = (hash & columnMask) >>> slotShift
    val slot = (hash & slotMask) << counterShift
```

### 2. カウンタのビットが全部 1 なら、上限なので何もしない

`mask` は、カウンタの場所のビットだけを表します。`matrix(row)(column) & mask` がそれと等しければ、カウンタは上限に達しています。その場合は増やしません。

```scala:line-numbers=216
    val mask = counterMask << slot
    if ((matrix(row)(column) & mask) != mask) {
```

### 3. 上限でなければ、そのカウンタに 1 を足す

上限でなければ、`1L << slot` を足します。このカウンタの一番下のビットが 1 増えるので、カウンタの値は 1 増えます。行の増加数も 1 増やして、`true` を返します。

```scala:line-numbers=218
      matrix(row)(column) += (1L << slot)
      rowSizes(row) += 1
      true
```

## ここがすごい

- 1 つの `Long` に 16 個のカウンタを詰めるので、配列を 16 分の 1 にできます。メモリを強く節約しています。
- 上限をビットで確かめてから足すので、カウンタが隣のカウンタへあふれることがありません。ビットの境界を守っています。
- ビットの位置と幅を、定数の `counterShift` と `counterMask` で決めています。カウンタの幅を変えるときも、この関数の形は変わりません。
- 増えたかどうかを `Boolean` で返すので、呼び出し側は全体の数を正しく数えられます。

## まとめ

- 小さな数は、1 つの整数にビットを区切って詰めると、メモリを節約できます。
- 上限のビットを確かめてから足すと、隣の数へのあふれを防げます。
- 増えたかどうかを返すと、呼び出し側が正しく集計できます。
