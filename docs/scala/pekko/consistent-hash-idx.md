---
title: "時計回りで次のノードを探す、ハッシュリング"
description: "Apache Pekko の ConsistentHash.idx。ソート済みのハッシュ値の配列から二分探索の結果を読み、キーを担当するノードの位置を、リングの端を回り込みながら決める。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/routing/ConsistentHash.scala"
lines: [95, 102]
format: 2
function: "ConsistentHash.idx"
difficulty: 3
tags: [データ構造, アルゴリズム, ハッシュ, 探索]
---

## ひとことで

Apache Pekko の `ConsistentHash` で、キーの持ち主になるノードを探すための小さな関数 `idx` です。ノードはハッシュ値の円（リング）に並べられていて、キーは時計回りに最初に出会うノードが担当します。二分探索の戻り値を読み替えるだけで、その位置を求めています。

## コード

::: code-group

```scala:line-numbers=95 [日本語訳]
  private def idx(i: Int): Int = {
    if (i >= 0) i // 完全に一致
    else {
      val j = math.abs(i + 1)
      if (j >= nodeHashRing.length) 0 // 最後より後なら先頭を使う
      else j // 時計回りで次のノード
    }
  }
```

```scala:line-numbers=95 [原文]
  private def idx(i: Int): Int = {
    if (i >= 0) i // exact match
    else {
      val j = math.abs(i + 1)
      if (j >= nodeHashRing.length) 0 // after last, use first
      else j // next node clockwise
    }
  }
```

:::

## 前提知識

- 一貫性ハッシュ（consistent hashing）は、サーバーの追加や削除があっても、担当が大きく入れ替わらないようにする分散の方法です。
- ハッシュ値を並べた配列を「リング」と見なし、キーのハッシュ値から時計回りに次の値を探します。
- `Arrays.binarySearch` は、ソート済みの配列から値を探します。見つかれば位置を、見つからなければ `-(挿入位置) - 1` を返します。
- `math.abs` は絶対値を返します。
- `nodeHashRing` は、ノードのハッシュ値をソートした配列です。

## 何をしているか

### 1. 見つかった場合は、その位置をそのまま使う

`i >= 0` なら、キーのハッシュ値がリングの中にあります。そのときの位置 `i` が担当ノードの位置です。コメントの「exact match」がこの意味です。

### 2. 見つからなければ、挿入位置から次のノードを選ぶ

見つからない場合、`binarySearch` の戻り値は負の数です。`i + 1` の絶対値は、キーを挿入すべき位置、つまり時計回りに次のノードの位置になります。

### 3. リングの端を回り込む

挿入位置が配列の長さ以上なら、リングの終端を越えてしまっています。そのときは先頭の 0 番目のノードを使います。

```scala:line-numbers=112
    nodeRing(idx(Arrays.binarySearch(nodeHashRing, hashFor(key))))
```

`nodeFor` は、この `idx` の結果でノードの配列 `nodeRing` を引いて、担当ノードを返します。

## ここがすごい

- ノードが増えても、新しいノードのハッシュ値を挿入するだけで済み、既存のキーの多くは同じノードのままです。これが一貫性ハッシュの利点です。
- 担当ノードの探索は、ソート済みの配列の二分探索で `O(log n)` です。リングの仕組みを、標準の探索関数で表しています。
- 負の戻り値を `abs(i + 1)` に変換する 1 行は、「見つからなかった位置」を自然に得るための定番の書き方です。
- リングの端で 0 番に戻る処理は、円であることをコードで表す小さな工夫です。

## まとめ

- 一貫性ハッシュは、ノードをリングに並べ、キーを時計回りの次のノードへ割り当てる方法です。
- 二分探索の「見つからなかったときの戻り値」を読み替えると、挿入位置がわかります。
- 配列の端は、先頭に戻して円として扱います。
