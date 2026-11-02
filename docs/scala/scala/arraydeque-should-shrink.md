---
title: "半分以下しか使っていない配列だけを縮める"
description: "Scala の ArrayDeque.shouldShrink。配列が大きく、使われている要素が 2/5 未満のときだけ縮める。行ったり来たりの追加と削除で、確保と解放を繰り返さないための判定。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/mutable/ArrayDeque.scala"
lines: [496, 500]
format: 2
function: "ArrayDeque.shouldShrink"
difficulty: 3
tags: [データ構造, 最適化, メモリ管理]
---

## ひとことで

Scala の `ArrayDeque`（両端から出し入れできる可変のキュー）の内部で、配列を縮めるかどうかを決める `shouldShrink` です。配列の中の使われている要素の数が、全体の 2/5 より少ないときだけ縮めます。少し減っただけで縮めると、すぐまた広げることになるため、その無駄を防いでいます。

## コード

::: code-group

```scala:line-numbers=496 [日本語訳]
  @inline private[this] def shouldShrink(len: Int) = {
    // 配列の確保と解放を繰り返さないよう、配列が大きいときだけ縮めます。
    // かつ、使われている部分が 2/5 未満のときだけ縮めます。
    array.length > ArrayDeque.StableSize && array.length - len - (len >> 1) > len
  }
```

```scala:line-numbers=496 [原文]
  @inline private[this] def shouldShrink(len: Int) = {
    // To avoid allocation churn, only shrink when array is large
    // and less than 2/5 filled.
    array.length > ArrayDeque.StableSize && array.length - len - (len >> 1) > len
  }
```

:::

## 前提知識

- `ArrayDeque` は、先頭と末尾のどちらからも要素を追加・削除できる可変のコレクションです。内部では配列を使い、円のように前後をつなげて持っています。
- 配列を「縮める」のは、使っていない領域を解放するためです。メモリを節約できます。
- 配列の確保と解放を何度も繰り返すと、メモリの管理に時間がかかります。これを「確保の回りくどさ（allocation churn）」と呼ぶことがあります。
- `>> 1` は 1 ビット右にずらす操作で、2 で割った整数部分になります。
- `&&` は両方が真のときだけ真になる論理演算子です。

## 何をしているか

### 1. 配列が十分大きいことを確かめる

まず、配列の長さが `StableSize` より大きいことを確かめます。小さい配列は、縮めても得られるメモリがわずかなので、縮めません。

```scala:line-numbers=499
    array.length > ArrayDeque.StableSize && array.length - len - (len >> 1) > len
```

この 1 つの式に、大きさの条件と使用率の条件が両方入っています。

### 2. 使われていない部分が多いかを式で比べる

式の後半 `array.length - len - (len >> 1) > len` は、使われている要素 `len` が、全体の約 2/5 より少ないことを表しています。

計算すると、`array.length > 2.5 * len` になります。だから、`len` が全体の 2/5 より小さいときに真になります。

## ここがすごい

- 縮める条件を「全体の 2/5 未満」と少し厳しくしているので、ちょっと減ったくらいで縮めて、すぐまた広げる無駄を避けています。
- 小さい配列は縮めないので、少しの要素の増減で配列を作り直すことが起きません。
- 割り算を使わず、`len >> 1` のビットシフトで半分を求めています。計算が軽く、整数の丸めもはっきりしています。
- 条件を 1 つの式にまとめて、判定の関数を小さく保っています。

## まとめ

- 配列を縮めるのは、十分に大きく、使用率が低いときだけにすると、無駄な確保を避けられます。
- 縮める条件に余裕を持たせると、行ったり来たりする操作で配列が揺れません。
- 半分の計算は、ビットシフトで済ませられます。
