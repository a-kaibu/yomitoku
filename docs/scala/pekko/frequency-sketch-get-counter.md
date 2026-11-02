---
title: "64 ビットの中から、1 つの小さな数を取り出す"
description: "Apache Pekko の FrequencySketch の getCounter。1 つの Long に詰めたカウンタの中から、ハッシュで決まった 1 つを読み出す。列番号と、Long の中の位置をビット演算で求め、右にずらしてマスクで取り出す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2021-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/FrequencySketch.scala"
lines: [207, 211]
format: 2
function: "FrequencySketch.getCounter"
difficulty: 2
tags: [ビット演算, データ構造, キャッシュ]
---

## ひとことで

Apache Pekko の `FrequencySketch` では、小さなカウンタを `Long` の中に詰めて持ちます。`getCounter` は、ハッシュ値で決まった 1 つのカウンタを読み出す関数です。書き込みと対になる読み出しです。

## コード

```scala:line-numbers=207
  private def getCounter(row: Int, hash: Int): Int = {
    val column = (hash & columnMask) >>> slotShift
    val slot = (hash & slotMask) << counterShift
    ((matrix(row)(column) >>> slot) & counterMask).toInt
  }
```

## 前提知識

- `Long` は 64 ビットの整数です。ここでは、4 ビットずつ区切ったカウンタを 16 個詰めて持ちます。
- `matrix(row)(column)` は、行 `row` の中の、`column` 番目の `Long` です。
- `&`（AND）は、指定したビットだけを残す演算です。`>>>`（論理右シフト）は、ビットを右にずらして、空いた上位を 0 で埋める演算です。
- `counterMask` は、カウンタ 1 つ分の幅のビットだけが 1 のマスクです。ここでは 4 ビットの 1111 です。
- 列番号（column）とスロット（slot）は、ハッシュ値の別々のビットから求めます。そのため、同じハッシュが同じカウンタを指します。

## 何をしているか

### 1. ハッシュから、Long の番号と、Long の中の位置を求める

`column` は、ハッシュの一部のビットから求めた `Long` の番号です。`slot` は、その `Long` の中で、カウンタが始まる位置（ビット数）です。

```scala:line-numbers=208
    val column = (hash & columnMask) >>> slotShift
    val slot = (hash & slotMask) << counterShift
```

### 2. Long を右にずらして、カウンタを一番下へ移す

`>>> slot` で、対象のカウンタを一番下の位置まで移します。その下にあるカウンタは、右に追い出されて消えます。

```scala:line-numbers=210
    ((matrix(row)(column) >>> slot) & counterMask).toInt
```

### 3. マスクで、カウンタの幅だけを残す

`& counterMask` で、カウンタ 1 つ分のビットだけを残します。残った値を `Int` にして返すと、そのカウンタの数になります。

```scala:line-numbers=210
    ((matrix(row)(column) >>> slot) & counterMask).toInt
```

## ここがすごい

- 配列の番号と、ビットの位置を、1 つのハッシュ値の別々の部分で決めています。1 回のハッシュ計算で、読む場所が決まります。
- 右にずらして、マスクで取り出すという、2 回の演算だけでカウンタを読めます。ループは使いません。
- 読み出し（`getCounter`）と書き込み（`incrementCounter`）が、同じ列番号とスロットの求め方を使っています。位置がずれて、別のカウンタを読む心配がありません。
- 読むときは値を変えないので、見積もりを求めても表の状態は変わりません。

## まとめ

- 小さな数を 1 つの整数に詰めると、読み出しはずらしとマスクで取り出せます。
- 読み書きで位置の求め方を揃えておくと、誤って別の数を読まなくて済みます。
- ビットの並びを理解しておくと、この種の表の仕組みが読みやすくなります。
