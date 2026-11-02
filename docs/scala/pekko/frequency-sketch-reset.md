---
title: "詰め込んだカウンタを、すべて一度に半分にする"
description: "Apache Pekko の FrequencySketch の reset。1 つの Long に詰めた小さな数を、ビットを 1 つ右にずらして一度に半分にする。隣のカウンタから入り込むビットを消し、奇数だった数を記録して全体の合計も直す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2021-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/FrequencySketch.scala"
lines: [229, 243]
format: 2
function: "FrequencySketch.reset"
difficulty: 3
tags: [ビット演算, データ構造, キャッシュ]
---

## ひとことで

Apache Pekko の `FrequencySketch` では、出現回数を一定数ごとに半分にして、古い情報を薄めます。`reset` は、その半分にする処理です。1 つの `Long` に詰め込まれた小さなカウンタを、まとめて 1 ビットずつ右にずらすことで、すべてのカウンタを一度に半分にします。

## コード

```scala:line-numbers=229
  private def reset(): Unit = {
    var row = 0
    while (row < depth) {
      var column = 0
      var odd = 0
      while (column < rowWidth) {
        odd += java.lang.Long.bitCount(matrix(row)(column) & oddMask)
        matrix(row)(column) = (matrix(row)(column) >>> 1) & resetMask
        column += 1
      }
      rowSizes(row) = (rowSizes(row) - odd) >>> 1
      row += 1
    }
    updatedSize = rowSizes.max
  }
```

## 前提知識

- カウンタを 1 ビット右にずらすと、値が半分になります。ただし、奇数の場合は 0.5 が切り捨てられます。
- `Long` の中のカウンタは、隣り合って並んでいます。全体を右にずらすと、ある位置のカウンタの最下位のビットが、隣のカウンタの上位のビットに入り込みます。
- `oddMask` は、各カウンタの最下位のビットだけを選ぶマスクです。ここでは、切り捨てられる 0.5 の数を数えるために使います。
- `resetMask` は、各カウンタの上位ビットを消すマスクです。ずらしたあとに、隣から入り込んだビットを取り除きます。
- `rowSizes` は、各行の合計の数です。半分にしたときに、この合計も直す必要があります。

## 何をしているか

### 1. 奇数だったカウンタの数を数える

各 `Long` について、最下位のビットが 1 のカウンタの数を `bitCount` で数えて、`odd` に足します。この数は、半分にするときに切り捨てた 0.5 の合計に当たります。

```scala:line-numbers=235
        odd += java.lang.Long.bitCount(matrix(row)(column) & oddMask)
```

### 2. 全体を右に 1 ビットずらし、入り込んだビットを消す

`>>> 1` で `Long` 全体を右にずらします。すると、隣のカウンタの最下位のビットが、このカウンタの上位に入ります。これを `resetMask` で消して、正しい値に戻します。

```scala:line-numbers=236
        matrix(row)(column) = (matrix(row)(column) >>> 1) & resetMask
```

### 3. 行の合計も、切り捨ての分だけ直す

`rowSizes(row)` から `odd` を引き、2 で割ります。切り捨てられた分を反映した合計になります。最後に、すべての行の最大を `updatedSize` にして、次の数え方の基準にします。

```scala:line-numbers=239
      rowSizes(row) = (rowSizes(row) - odd) >>> 1
```

```scala:line-numbers=242
    updatedSize = rowSizes.max
```

## ここがすごい

- 16 個のカウンタを、1 つのずらしと 1 つのマスクで一度に半分にします。個別に読んで書き直す処理に比べて、ずっと少ない命令で済みます。
- ずらしで入り込むビットを、マスクでまとめて消すので、隣のカウンタを壊しません。
- 切り捨ての誤差を `odd` で数えて合計に反映させるので、全体の見積もりの基準が大きくずれません。
- 行ごとに同じ処理を繰り返すだけの単純な構造です。読んで確かめやすい作りになっています。

## まとめ

- 小さな数を一括で半分にするには、全体をずらして、ずれ込んだビットを消します。
- 奇数の切り捨てを数えておくと、合計の値を正しく保てます。
- 古い情報を薄める処理は、定期的に呼び出すことで、新しい情報が目立つようになります。
