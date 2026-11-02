---
title: "衝突したら、ずらす量を増やしながら空きを探す"
description: "Apache Spark の OpenHashSet.getPos。ハッシュ値の位置に要素がなければ探索を終え、あれば同じ値を探す。違う値なら、ずらす量を 1, 2, 3 と増やしながら次の位置を調べる二次探査を行う。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/OpenHashSet.scala"
lines: [173, 188]
format: 2
function: "OpenHashSet.getPos"
difficulty: 3
tags: [ハッシュ, データ構造, アルゴリズム]
---

## ひとことで

Spark の `OpenHashSet` は、要素を配列に順番に並べて持つ集合です。`getPos` は、ある値が配列のどこにあるかを返します。ハッシュ値から最初の位置を決め、そこがずれていたら、ずらす量を増やしながら次の位置を調べます。

## コード

::: code-group

```scala:line-numbers=173 [日本語訳]
  def getPos(k: T): Int = {
    var pos = hashcode(hasher.hash(k)) & _mask
    var delta = 1
    while (true) {
      if (!_bitset.get(pos)) {
        return INVALID_POS
      } else if (keyExistsAtPos(k, pos)) {
        return pos
      } else {
        // 二次探査です。ずらす量を 1, 2, 3, ... と増やしながら次の位置を調べます。
        pos = (pos + delta) & _mask
        delta += 1
      }
    }
    throw new RuntimeException("Should never reach here.")
  }
```

```scala:line-numbers=173 [原文]
  def getPos(k: T): Int = {
    var pos = hashcode(hasher.hash(k)) & _mask
    var delta = 1
    while (true) {
      if (!_bitset.get(pos)) {
        return INVALID_POS
      } else if (keyExistsAtPos(k, pos)) {
        return pos
      } else {
        // quadratic probing with values increase by 1, 2, 3, ...
        pos = (pos + delta) & _mask
        delta += 1
      }
    }
    throw new RuntimeException("Should never reach here.")
  }
```

:::

## 前提知識

- 「ハッシュ」は、値から整数を作る関数です。同じ値からは同じ整数が作られます。`hashcode` は、そのハッシュ値をさらに混ぜて散らす関数です。
- 「オープンアドレッシング」は、同じ位置が埋まっていたら、配列の別の位置に入れる方式です。Java の `HashMap` のように、位置ごとに別のリストを持つ方式とは違います。
- 「ビットセット」は、各位置が使われているかを 1 ビットずつ覚える配列です。`_bitset.get(pos)` は、その位置に要素があるかを返します。
- `& _mask` は、容量が 2 の累乗のときに、値を容量の範囲に収める速い書き方です。`mask` は `capacity - 1` です。
- 「線形探査」は、埋まっていたら隣の位置を見る方式です。隣へ隣へ進むので、同じ場所に固まりやすくなります。

## 何をしているか

### 1. 最初の位置を決める

まず、`k` のハッシュ値を混ぜて、容量の範囲に収めます。これが最初に見る位置です。

```scala:line-numbers=174
    var pos = hashcode(hasher.hash(k)) & _mask
```

### 2. その位置が空なら、無いと判断する

ビットセットがその位置を空と示していれば、同じ値はここまでの探索で見つからないと分かります。`INVALID_POS` を返して終わります。

```scala:line-numbers=177
      if (!_bitset.get(pos)) {
        return INVALID_POS
```

### 3. 同じ値が見つかれば、その位置を返す

位置が使われていて、そこに入っている値が `k` と同じなら、その位置を返します。`keyExistsAtPos` は、値の比較を行う補助の関数です。

```scala:line-numbers=179
      } else if (keyExistsAtPos(k, pos)) {
        return pos
```

### 4. 違う値なら、ずらす量を増やして次を見る

同じ位置に別の値がいたら、今の `delta` だけ位置をずらします。`delta` は 1、2、3 と増えていくので、次に見る場所は 1、3、6 と離れていきます。

```scala:line-numbers=181
      } else {
        // quadratic probing with values increase by 1, 2, 3, ...
        pos = (pos + delta) & _mask
        delta += 1
      }
```

ずらす量を増やすと、隣り合う位置に固まる現象（一次クラスタリング）が起きにくくなります。`_mask` で囲っているので、配列の端を越えても先頭に戻ります。

## ここがすごい

- 容量を 2 の累乗にしておくと、`& _mask` だけで範囲に収まり、割り算が要りません。
- 空の位置が見つかった時点で探索を止めるので、無い値を調べるときも、長く探しすぎません。
- 余分なリストを作らず、1 つの配列とビットセットだけで集合を表しています。メモリを節約できるので、大量の要素を扱う Spark の内部で役立ちます。
- 増やすずらし幅を 1、2、3 と揃えると、容量が 2 の累乗のとき、すべての位置を一度ずつ回れることが知られています。

## まとめ

- 配列を使う集合は、ハッシュ値から最初の位置を決めて、衝突したら位置をずらして探します。
- ずらし幅を増やす二次探査は、固まりを防ぐための簡単な工夫です。
- 容量を 2 の累乗にすると、ビット演算で位置を速く求められます。
