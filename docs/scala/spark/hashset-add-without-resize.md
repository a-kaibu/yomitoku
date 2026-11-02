---
title: "空きを見つけたら、その場に入れて印をつける"
description: "Apache Spark の OpenHashSet.addWithoutResize。要素を入れる位置を探し、空いていればそこに入れて、ビットセットに印をつける。すでに同じ値があれば、その位置を返す。戻り値の最上位ビットで「新しく入ったか」を区別する。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/OpenHashSet.scala"
lines: [135, 154]
format: 2
function: "OpenHashSet.addWithoutResize"
difficulty: 3
tags: [ハッシュ, データ構造, ビット演算]
---

## ひとことで

Spark の `OpenHashSet` に要素を入れるときの、中心になる関数です。要素の入る位置を探し、空いていればそこに入れて、ビットセットに「使用中」の印をつけます。すでに同じ値があれば、入れずにその位置を返します。

## コード

::: code-group

```scala:line-numbers=135 [日本語訳]
  def addWithoutResize(k: T): Int = {
    var pos = hashcode(hasher.hash(k)) & _mask
    var delta = 1
    while (true) {
      if (!_bitset.get(pos)) {
        // 新しい要素です。
        _data(pos) = k
        _bitset.set(pos)
        _size += 1
        return pos | NONEXISTENCE_MASK
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

```scala:line-numbers=135 [原文]
  def addWithoutResize(k: T): Int = {
    var pos = hashcode(hasher.hash(k)) & _mask
    var delta = 1
    while (true) {
      if (!_bitset.get(pos)) {
        // This is a new key.
        _data(pos) = k
        _bitset.set(pos)
        _size += 1
        return pos | NONEXISTENCE_MASK
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

- `OpenHashSet` は、要素を配列に直接並べて持つ集合です。同じ位置に入れられないときは、別の位置へずらします（オープンアドレッシング）。
- ビットセットは、各位置が使われているかを 1 ビットずつ覚える仕組みです。`get(pos)` で確かめ、`set(pos)` で印をつけます。
- `_mask` は、容量から 1 を引いた値です。容量が 2 の累乗なら、`& _mask` で配列の範囲に収まります。
- `NONEXISTENCE_MASK` は、最上位ビットを表す値 `1 << 31` です。位置にこのビットを立てると、「新しく追加された」という印になります。
- `|`（ビットの OR）は、ビットを立てる演算です。`pos | NONEXISTENCE_MASK` は、位置の番号を変えずに、最上位ビットだけを立てます。

## 何をしているか

### 1. 最初の位置を決めて、探し始める

`k` のハッシュ値を混ぜて、配列の範囲に収めた位置から探し始めます。`delta` は、衝突したときにずらす量です。

```scala:line-numbers=136
    var pos = hashcode(hasher.hash(k)) & _mask
    var delta = 1
    while (true) {
```

### 2. 空いていれば、そこに入れて印をつける

ビットセットの印が無ければ、その位置は空いています。`k` を配列に入れ、ビットを立て、要素数を 1 増やします。戻り値には、最上位ビットを立てた位置を返します。

```scala:line-numbers=140
        // This is a new key.
        _data(pos) = k
        _bitset.set(pos)
        _size += 1
        return pos | NONEXISTENCE_MASK
```

戻り値の最上位ビットは、「新しく入った」の印です。位置の番号は下位ビットに残るので、両方を 1 つの整数で返せます。

### 3. 同じ値があれば、その位置を返す

位置が使われていて、その値が `k` と同じなら、何もせずに位置だけを返します。最上位ビットは立たないので、呼び出し側は「既に入っていた」と区別できます。

```scala:line-numbers=146
        return pos
      } else {
```

### 4. 違う値なら、ずらして次を見る

別の値がいたときは、ずらす量を増やして次の位置を見ます。`_mask` で囲っているので、配列の端を越えても先頭に戻ります。

```scala:line-numbers=149
        pos = (pos + delta) & _mask
        delta += 1
      }
    }
```

## ここがすごい

- 1 回の探索で、「入れる」と「既にある」を同時に判定します。二度探す必要がありません。
- 戻り値の 1 ビットに「新しいか」を入れて、1 つの `Int` に 2 つの情報を詰めています。余分な配列や、オブジェクトを作らずに済みます。
- 要素数を増やすのは、空きに入れたときだけです。同じ値を何度入れても、数が増えません。
- 配列を拡張する処理は、この関数の外に分けています。拡張が必要かどうかは後で判断するので、この関数は速さに集中できます。

## まとめ

- 集合への追加は、探索と挿入を 1 回の走査で済ませると速くなります。
- 戻り値のビットで「新規か既存か」を伝えると、余分な確認を減らせます。
- 拡張の処理を分けておくと、探索の部分を単純に保てます。
