---
title: "足りなければ、配列を新しく作ってコピーする"
description: "Scala の ArrayBuffer の ensureSize。必要な長さを resizeUp で求め、増やす必要がなければ元の配列をそのまま返し、増やすときだけ新しい配列へ中身をコピーする。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/mutable/ArrayBuffer.scala"
lines: [334, 342]
format: 2
function: "ArrayBuffer.ensureSize"
difficulty: 2
tags: [データ構造, メモリ管理, 標準ライブラリ]
---

## ひとことで

Scala の `ArrayBuffer` で、内部の配列の容量を確保する関数 `ensureSize` です。必要な大きさ `targetSize` を満たしているなら、元の配列をそのまま返します。足りないときだけ、新しい大きな配列を作って、今の要素をコピーします。

## コード

```scala:line-numbers=334
  private def ensureSize(array: Array[AnyRef], curSize: Int, targetSize: Int): Array[AnyRef] = {
    val newLen = resizeUp(array.length, targetSize)
    if (newLen < 0) array
    else {
      val res = new Array[AnyRef](newLen)
      System.arraycopy(array, 0, res, 0, curSize)
      res
    }
  }
```

## 前提知識

- `ArrayBuffer` は、内部の配列を持ち、足りなくなると配列を作り直します。配列の中身の長さ（`size0`）と、確保された長さ（`array.length`）は別物です。
- `System.arraycopy` は、配列の一部を別の配列へ高速にコピーする Java の標準の関数です。
- `new Array[AnyRef](n)` は、長さ `n` の空の配列を作ります。
- `resizeUp` は、前に読んだ関数で、新しい長さを求めます。増やす必要がなければ `-1` を返します。
- `private def` は、このクラスの中だけで使える関数です。

## 何をしているか

### 1. 増やす必要がなければ、元の配列を返す

`resizeUp` の戻り値が負なら、今の配列で十分です。そのまま `array` を返して、コピーを省きます。

```scala:line-numbers=335
    val newLen = resizeUp(array.length, targetSize)
    if (newLen < 0) array
```

### 2. 増やすときは、新しい配列を作る

増やすときは、`new Array` で新しい長さの配列を作り、今の要素をコピーします。コピーする数は、今の中身の数 `curSize` だけです。

```scala:line-numbers=338
      val res = new Array[AnyRef](newLen)
      System.arraycopy(array, 0, res, 0, curSize)
```

### 3. 新しい配列を返す

コピーが終わった新しい配列を返します。呼び出し側は、この配列を `ArrayBuffer` の内部として使い続けます。

```scala:line-numbers=340
      res
```

## ここがすごい

- 必要ないときにコピーしないので、要素を追加するたびに無駄な配列を作らずに済みます。
- コピーするのは、実際に入っている要素の数だけです。確保された余りの部分は、コピーしません。
- 「増やす」と「そのまま返す」を 1 つの関数で扱うので、呼び出し側は配列の状態を気にせずに済みます。
- 配列の作り直しを 1 か所にまとめているので、コピーの方法を変えたいときも、この関数だけを直せば済みます。

## まとめ

- 配列の容量を確保するときは、足りるかをまず確かめ、必要なときだけコピーします。
- コピーは、実際の要素の数だけで済ませます。
- 容量を決める計算と、コピーを分けて書くと、読みやすくなります。
