---
title: "値を入れるか、既にあれば合成するかを 1 回の探索で決める"
description: "Apache Spark の OpenHashMap.changeValue。キーがなければ既定の値を入れ、あれば合成関数で値を更新する。キーの探索は 1 回だけで、null のキーは別の場所に保存する。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/OpenHashMap.scala"
lines: [116, 137]
format: 2
function: "OpenHashMap.changeValue"
difficulty: 3
tags: [ハッシュ, データ構造, 関数型]
---

## ひとことで

Spark の `OpenHashMap` は、キーと値の組を配列に並べて持つ辞書です。`changeValue` は「キーが無ければ既定の値を入れ、あれば合成して値を更新する」という、よくある操作を 1 回の探索で行います。たとえば単語の出現回数を数えるときに使えます。

## コード

```scala:line-numbers=116
  def changeValue(k: K, defaultValue: => V, mergeValue: (V) => V): V = {
    if (k == null) {
      if (haveNullValue) {
        nullValue = mergeValue(nullValue)
      } else {
        haveNullValue = true
        nullValue = defaultValue
      }
      nullValue
    } else {
      val pos = _keySet.addWithoutResize(k)
      if ((pos & OpenHashSet.NONEXISTENCE_MASK) != 0) {
        val newValue = defaultValue
        _values(pos & OpenHashSet.POSITION_MASK) = newValue
        _keySet.rehashIfNeeded(k, grow, move)
        newValue
      } else {
        _values(pos) = mergeValue(_values(pos))
        _values(pos)
      }
    }
  }
```

## 前提知識

- 辞書（マップ）は、キーから値を引く型です。`OpenHashMap` は、キーを `OpenHashSet` で管理し、値は別の配列に置きます。
- `null` は、値が無いことを表す特別な値です。ハッシュ表では、`null` を普通の場所に入れにくいので、別に覚えておきます（`haveNullValue` と `nullValue`）。
- `=> V` は、必要になるまで計算しない引数（名前渡し）です。`defaultValue` は、新しいキーのときだけ評価されます。
- `(V) => V` は、古い値を受け取って新しい値を返す関数です。カウンタなら `_ + 1` を渡せます。
- `pos & NONEXISTENCE_MASK` が 0 でなければ、その位置は新しく追加された印です。

## 何をしているか

### 1. null のキーは、別の変数で扱う

キーが `null` のときは、配列を使わず、`nullValue` に値を覚えます。まだ無ければ `defaultValue` を入れ、あれば `mergeValue` で合成します。

```scala:line-numbers=117
    if (k == null) {
      if (haveNullValue) {
        nullValue = mergeValue(nullValue)
      } else {
        haveNullValue = true
        nullValue = defaultValue
      }
      nullValue
```

### 2. 通常のキーは、1 回の探索で場所を決める

`addWithoutResize` は、キーの位置を返します。キーが無かったときは、その場で位置に印がつき、キーが入ります。戻り値の最上位ビットで、新しく追加されたかを確かめます。

```scala:line-numbers=126
      val pos = _keySet.addWithoutResize(k)
```

### 3. 新しいキーなら、既定の値を入れる

新しく追加されたときは、`defaultValue` を計算して値の配列に入れます。その後で、必要なら配列を拡張します。

```scala:line-numbers=127
      if ((pos & OpenHashSet.NONEXISTENCE_MASK) != 0) {
        val newValue = defaultValue
        _values(pos & OpenHashSet.POSITION_MASK) = newValue
        _keySet.rehashIfNeeded(k, grow, move)
        newValue
```

### 4. 既にあれば、合成して入れ直す

既存のキーなら、`mergeValue` に古い値を渡して、新しい値を入れます。

```scala:line-numbers=132
      } else {
        _values(pos) = mergeValue(_values(pos))
        _values(pos)
```

## ここがすごい

- キーの探索は 1 回だけです。「あるか調べてから入れる」という 2 回の探索をまとめています。
- 既定の値を名前渡しにしているので、既存のキーを更新するときは、既定の値を作る計算が走りません。
- `null` のキーは、配列の仕組みと分けて扱うので、ハッシュ表の中に特別な場合が入り込みません。
- 値の更新を関数で渡すので、カウンタでも、リストへの追加でも、同じ関数で書けます。

## まとめ

- 辞書の「無ければ入れ、あれば更新」は、1 回の探索で済ませると効率が良くなります。
- 新しいかどうかは、戻り値の印で伝えると、余分な確認が要りません。
- 既定の値や合成の関数を引数にすると、用途が違っても同じ関数で済みます。
