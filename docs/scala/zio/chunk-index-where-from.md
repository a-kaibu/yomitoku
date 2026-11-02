---
title: "指定した位置以降で、条件に合う最初の位置を探す"
description: "ZIO の Chunk.indexWhere(f, from)。先頭から走査するが、from より前の位置は条件を調べない。最初に条件を満たす位置を返し、見つからなければ -1 を返す。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2018-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Chunk.scala"
lines: [599, 611]
format: 2
function: "Chunk.indexWhere"
difficulty: 2
tags: [イテレータ, データ構造, 防御的プログラミング]
---

## ひとことで

ZIO の `Chunk` は、要素をまとめて持つ不変の列です。`indexWhere` は、条件を満たす最初の位置を返します。`from` を指定すると、その位置以降だけを対象にします。見つからなければ `-1` を返します。

## コード

```scala:line-numbers=599
  override final def indexWhere(f: A => Boolean, from: Int): Int = {
    val iterator = self.chunkIterator
    var i        = 0
    var result   = -1
    while (result < 0 && iterator.hasNextAt(i)) {
      val a = iterator.nextAt(i)
      if (i >= from && f(a)) {
        result = i
      }
      i += 1
    }
    result
  }
```

## 前提知識

- `Chunk[A]` は、要素を順番に持つ、まとめ単位のデータです。
- `f: A => Boolean` は、要素を受け取って、条件を満たすかを答える関数です。
- `chunkIterator` は、チャンクの要素を位置で取り出す反復子です。`hasNextAt` と `nextAt` で位置ごとに読みます。
- `-1` は、見つからなかったことを表す慣習的な値です。Scala の標準の `indexWhere` と同じ約束です。
- `result < 0` は、まだ見つかっていない状態を表します。

## 何をしているか

### 1. 位置 `i` を先頭から進めながら、要素を取り出す

反復子で、位置 `i` の要素 `a` を取り出します。`i` は、先頭から一つずつ増えます。

```scala:line-numbers=603
    while (result < 0 && iterator.hasNextAt(i)) {
      val a = iterator.nextAt(i)
```

### 2. `from` 以降の位置で条件に合えば、その位置を記録する

`i >= from` かつ `f(a)` が真なら、`result` にその位置を入れます。`result` が負でなくなった時点で、ループは止まります。

```scala:line-numbers=605
      if (i >= from && f(a)) {
        result = i
      }
```

### 3. 位置を進め、見つかった位置か `-1` を返す

最後に `i` を一つ進め、ループを抜けたら `result` を返します。見つからなければ `-1` のままです。

```scala:line-numbers=608
      i += 1
    }
    result
```

## ここがすごい

- 見つかった時点でループを止めるので、残りの要素は調べません。
- `from` より前の位置は、条件を調べずに飛ばします。範囲の指定を、一箇所の条件で表しています。
- 結果は、見つかった位置か `-1` だけの一つの型（`Int`）で返ります。
- ただし、`from` より前の位置も、反復子の上では一つずつ読みます。先頭から走査する形なので、大きい `from` では無駄が残ります。

## まとめ

- `indexWhere(f, from)` は、`from` 以降で条件を満たす最初の位置を返します。
- 見つからなければ `-1` です。
- 見つかった時点で止まりますが、`from` より前の位置も読みながら進みます。
