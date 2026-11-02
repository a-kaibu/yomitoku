---
title: "添字を 2 段の木の番号に分けて、要素を取り出す"
description: "Scala の Vector の apply。添字から、中央の部分木の段と、その中の位置を、シフトとマスクで求めて取り出す。配列を分けて持つ Vector の添字計算の一例。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/immutable/Vector.scala"
lines: [455, 465]
format: 2
function: "Vector.apply"
difficulty: 3
tags: [データ構造, ビット演算, 最適化]
---

## ひとことで

Scala の不変なベクタ `Vector` の `apply` は、添字 `index` の要素を取り出します。`Vector` の中身は、配列を複数の段に分けて持つ木の形です。この関数では、添字から「どの配列か」と「その中の位置」を、シフトとマスクだけで求めます。

## コード

```scala:line-numbers=455
  @inline def apply(index: Int): A = {
    if(index >= 0 && index < length0) {
      val io = index - len1
      if(io >= 0) {
        val i2 = io >>> BITS
        val i1 = io & MASK
        if(i2 < data2.length) data2(i2)(i1)
        else suffix1(io & MASK)
      } else prefix1(index)
    }.asInstanceOf[A] else throw ioob(index)
  }
```

## 前提知識

- `Vector` は、要素を一定の大きさの配列に分け、それを木のように並べた不変のデータ構造です。添字でのアクセスが速いのが特徴です。
- `>>>` は符号なしの右シフト、`&` は AND です。`io & MASK` は、下位の決まったビットを取り出します。
- `prefix1` や `suffix1` などは、先頭側や末尾側の小さな配列です。中央の大きな部分は `data2` にあります。
- `length0` は、全体の要素数です。添字が範囲内か確かめるために使います。
- `ioob(index)` は、範囲外のときに例外を作る関数です。

## 何をしているか

### 1. 範囲の確認と、先頭側の配列の判定

まず、添字が範囲内か確かめます。次に、`len1` より前の位置なら、先頭側の小さな配列 `prefix1` から取ります。

```scala:line-numbers=456
    if(index >= 0 && index < length0) {
      val io = index - len1
      if(io >= 0) {
```

### 2. 中央の添字を、2 段に分ける

中央の部分では、`io >>> BITS` で配列の番号 `i2`、`io & MASK` で配列の中の位置 `i1` を求めます。

```scala:line-numbers=459
        val i2 = io >>> BITS
        val i1 = io & MASK
```

下位のビットが配列の中の位置、残りの上位ビットが配列の番号です。2 進数で添字を読むようなものです。

### 3. 配列の番号が範囲内なら、2 段目から取る

`i2` が `data2` の長さ未満なら、`data2(i2)(i1)` で取ります。末尾の部分にあたるときは `suffix1` から取ります。

```scala:line-numbers=461
        if(i2 < data2.length) data2(i2)(i1)
        else suffix1(io & MASK)
```

## ここがすごい

- 添字を 2 進数として、上位と下位に分けるだけで、目的の配列と位置がわかります。計算が割り算なしのシフトとマスクで済みます。
- 大きな配列を一度に持たず、固定の大きさの配列に分けているので、要素の追加や変更で全体をコピーしません。
- 範囲外の添字は、まず 1 つの比較で弾いて、例外を投げます。安全な書き方です。
- 先頭・中央・末尾の 3 つの場所に分けて持つので、先頭や末尾への追加も速く行えます。

## まとめ

- 添字は、シフトとマスクで、配列の番号と位置に分けられます。
- 大きなデータを、固定の大きさの配列に分けて持つと、変更のコストを抑えられます。
- 範囲の確認を先にすると、安全に速く取り出せます。
