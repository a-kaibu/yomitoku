---
title: "配列を縮めるとき、必要な分だけ新しい配列にコピーする"
description: "Scala 標準ライブラリの ArrayBuffer.downsize。要素を減らしたとき、配列の大きさを目標の長さに合わせる。目標が今の大きさ以上なら何もせず、0 なら空の共有配列を使い、それ以外は新しい配列に必要な分だけコピーする。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/mutable/ArrayBuffer.scala"
lines: [351, 360]
format: 2
function: "ArrayBuffer.downsize"
difficulty: 3
tags: [データ構造, メモリ管理, 最適化]
---

## ひとことで

Scala の `ArrayBuffer` は、要素を入れる配列を、必要に応じて大きくしたり小さくしたりします。`downsize` は、要素を減らした後に、配列を小さくする処理です。配列の中の残っている要素だけを新しい配列にコピーして、使わない領域を手放します。

## コード

```scala:line-numbers=351
  private def downsize(array: Array[AnyRef], targetSize: Int): Array[AnyRef] = {
    val newLen = resizeDown(array.length, targetSize)
    if (newLen < 0) array
    else if (newLen == 0) emptyArray
    else {
      val res = new Array[AnyRef](newLen)
      System.arraycopy(array, 0, res, 0, targetSize)
      res
    }
  }
```

## 前提知識

- `ArrayBuffer` は、要素を後ろに足せる可変の配列です。内部では、固定の大きさの配列を持ち、足りなくなると作り直します。
- 配列の大きさを変えるには、新しい配列を作り、要素をコピーします。Java や Scala の配列は、大きさを後から変えられないからです。
- `System.arraycopy` は、配列の一部を別の配列へまとめてコピーする、高速な関数です。
- 空の配列を毎回作ると無駄なので、大きさ 0 の配列を 1 つだけ用意して、使い回します（`emptyArray`）。
- `resizeDown` は、目標の大きさを受け取って、縮める必要があるかを判定し、縮めるならその大きさを返します。

## 何をしているか

### 1. 縮める必要があるかを、大きさで判定する

`resizeDown` は、目標の長さが今の配列の長さ以上なら、縮めないという意味で -1 を返します。そうでなければ、0 以上の目標の長さを返します。`downsize` はこの値を見て、次の処理を決めます。

```scala:line-numbers=352
    val newLen = resizeDown(array.length, targetSize)
    if (newLen < 0) array
```

### 2. 縮めない場合は、今の配列をそのまま返す

新しい長さが -1 なら、配列を作り直しません。元の配列をそのまま使うので、コピーも起きません。

```scala:line-numbers=353
    if (newLen < 0) array
```

### 3. 長さが 0 なら、空の配列を共有する

目標が 0 のときは、空の配列を毎回作らずに、用意しておいた `emptyArray` を使います。

```scala:line-numbers=354
    else if (newLen == 0) emptyArray
```

### 4. それ以外は、必要な分だけコピーした新しい配列を作る

それ以外は、目標の長さの新しい配列を作り、先頭から目標の長さの分だけ要素をコピーします。使わなくなった後ろの領域は、新しい配列に含まれないので、解放されます。

```scala:line-numbers=356
      val res = new Array[AnyRef](newLen)
      System.arraycopy(array, 0, res, 0, targetSize)
      res
```

## ここがすごい

- 縮める必要がなければ、配列を一切作りません。判定だけで済むので、無駄な処理がありません。
- 空の配列を 1 つだけ共有しているので、0 にするたびに新しい配列を作らずに済みます。
- コピーは `System.arraycopy` を使うので、要素を 1 つずつ代入するより速く動きます。
- 目標の長さを 0 以上に直してから使うので、負の値が来ても安全です。

## まとめ

- 配列を縮めるときは、必要な長さだけ新しい配列を作り、残りを手放します。
- 縮める必要がない場合は、判定だけで元の配列を使い続けると効率的です。
- 空の値は共有すると、小さな無駄を積み重ねずに済みます。
