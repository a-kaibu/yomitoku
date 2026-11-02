---
title: "ビットマップで枝の位置を 1 命令で数える"
description: "Scala の不変 HashMap（CHAMP）が使うビット計算。ハッシュの一部を枝番号にし、ビットマップの立っているビットを数えて配列の位置を求める。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/immutable/ChampCommon.scala"
lines: [31, 37]
format: 2
function: "indexFrom"
difficulty: 3
tags: [データ構造, ビット演算, ハッシュ]
---

## ひとことで

Scala の不変な `HashMap` は、CHAMP という木構造で値を持ちます。この関数群は、その木の各ノードで「どの枝を選ぶか」と「枝が配列のどこにあるか」を、ビット演算だけで求めるための部品です。枝の有無をビットマップで表し、立っているビットの数を数えることで、配列の位置を一瞬で決めます。

## コード

```scala:line-numbers=31
  final def maskFrom(hash: Int, shift: Int): Int = (hash >>> shift) & BitPartitionMask

  final def bitposFrom(mask: Int): Int = 1 << mask

  final def indexFrom(bitmap: Int, bitpos: Int): Int = bitCount(bitmap & (bitpos - 1))

  final def indexFrom(bitmap: Int, mask: Int, bitpos: Int): Int = if (bitmap == -1) mask else indexFrom(bitmap, bitpos)
```

## 前提知識

- ハッシュ値は 32 ビットの整数です。その一部を切り出して、木の何段目でどの枝に進むかを決めます。
- `>>>` は符号なしの右シフト、`&` は AND、`1 << n` は 1 を n ビット左へずらした値です。
- ビットマップは、0 か 1 のビットを並べて「ある番号の枝があるか」を表すための整数です。
- `bitCount(x)` は、x の中で 1 になっているビットの数を返す関数です。このファイルでは `java.lang.Integer.bitCount` を `import` して使っています。
- `final val` は定数です。`final def` は上書きできない関数です。

## 何をしているか

### 1. ハッシュの一部を枝番号にする

`maskFrom` は、ハッシュを `shift` ビットだけ右にずらし、下位の決まった数のビットを切り出します。木の段が 1 つ深くなるたびに、別のビットを使うわけです。

```scala:line-numbers=31
  final def maskFrom(hash: Int, shift: Int): Int = (hash >>> shift) & BitPartitionMask
```

### 2. 枝番号を、1 つだけ立ったビットにする

`bitposFrom` は、枝番号 `mask` を 1 のビットの位置にします。たとえば番号が 3 なら、2 進数で 1000 のような値になります。

```scala:line-numbers=33
  final def bitposFrom(mask: Int): Int = 1 << mask
```

この値を使うと、ビットマップの中にその枝があるかを `&` の 1 回で調べられます。

### 3. 前にある枝の数を数えて、配列の位置にする

`indexFrom` は、`bitpos - 1` で「その位置より下の全部のビット」をマスクにし、ビットマップと AND を取ります。残った 1 の数を `bitCount` で数えると、その枝が配列の何番目に入っているかがわかります。

```scala:line-numbers=35
  final def indexFrom(bitmap: Int, bitpos: Int): Int = bitCount(bitmap & (bitpos - 1))
```

ビットマップが全部 1 のときは、`bitCount` を使わずに `mask` をそのまま返します。どの位置より下にも、すべてのビットが立っているからです。

## ここがすごい

- 枝が増えたときに、配列を「ビットで飛ばした位置」に詰めて持つので、空の枝の分の領域を取りません。木のノードが小さく済みます。
- 配列の添字を探すのに、線形探索や二分探索をしません。`bitCount` は小さな計算なので、位置の計算に比較がいりません。
- 全部 1 の特別扱いは、よくある最適化です。ビットが全部立っていれば、数える必要がなく答えが決まります。
- 同じハッシュ値を使いながら段ごとに違うビットを使うので、木の深さを抑えつつ、枝を広く分けられます。

## まとめ

- 枝の有無はビットマップ、枝の位置は立っているビットの数で表せます。
- `1 << n` と `bitCount` を組み合わせると、配列の添字を計算だけで求められます。
- 空きを詰めて持つと、メモリを節約しながら高速に値を探せます。
