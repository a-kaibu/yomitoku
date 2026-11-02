---
title: "先頭から指定の位置まで、ビットを一度に立てる"
description: "Apache Spark の BitSet.setUntil。先頭から指定の位置の手前まで、ビットを 1 にする。語の単位で全部を -1 で埋め、途中の語だけマスクで必要な桁を立てる。ビットを 1 つずつ立てずに済む。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [45, 53]
format: 2
function: "BitSet.setUntil"
difficulty: 3
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` で、先頭から指定の位置の手前までのビットを、まとめて 1 にする関数です。`setUntil(10)` は、0 から 9 までのビットを 1 にします。1 ビットずつ立てる代わりに、64 ビットの語の単位で一気に埋めます。

## コード

::: code-group

```scala:line-numbers=45 [日本語訳]
  def setUntil(bitIndex: Int): Unit = {
    val wordIndex = bitIndex >> 6 // 64 で割ります。
    Arrays.fill(words, 0, wordIndex, -1)
    if (wordIndex < words.length) {
      // 残りのビットを立てます（マスクが 0 になることもあります）。
      val mask = ~(-1L << (bitIndex & 0x3f))
      words(wordIndex) |= mask
    }
  }
```

```scala:line-numbers=45 [原文]
  def setUntil(bitIndex: Int): Unit = {
    val wordIndex = bitIndex >> 6 // divide by 64
    Arrays.fill(words, 0, wordIndex, -1)
    if (wordIndex < words.length) {
      // Set the remaining bits (note that the mask could still be zero)
      val mask = ~(-1L << (bitIndex & 0x3f))
      words(wordIndex) |= mask
    }
  }
```

:::

## 前提知識

- `words` は、`Long`（64 ビット）の配列です。`words(i)` の中の 64 個のビットが、集合の一部を表します。
- `-1` は、2 進数で全部の桁が 1 の値です。`Arrays.fill` で語を `-1` にすると、その語の 64 ビットがすべて 1 になります。
- `-1L << n` は、下から `n` 桁を 0 にした値です。`~` で反転すると、下から `n` 桁だけが 1 になります。
- `|=` は、ビットを足し合わせる演算です。元の 1 は残したまま、マスクの 1 を加えます。
- `bitIndex & 0x3f` は、64 で割った余りです。語の中で、どこまで埋めるかを表します。

## 何をしているか

### 1. 完全に埋まる語は、まとめて -1 にする

`bitIndex` を 64 で割った `wordIndex` より前の語は、すべての桁が指定の範囲に入っています。そこで `Arrays.fill` で `-1` を入れて、一度に埋めます。

```scala:line-numbers=46
    val wordIndex = bitIndex >> 6 // divide by 64
    Arrays.fill(words, 0, wordIndex, -1)
```

### 2. 途中の語は、マスクで必要な桁だけ立てる

`wordIndex` の語は、一部だけ埋めれば十分です。`-1L << (bitIndex & 0x3f)` で、残りの桁を 0 にした値を作り、`~` で反転して、下から必要な桁だけが 1 のマスクにします。

```scala:line-numbers=50
      val mask = ~(-1L << (bitIndex & 0x3f))
      words(wordIndex) |= mask
```

`words.length` の確認は、`bitIndex` が集合の範囲を超えるときに配列の外を書かないためのものです。

```scala:line-numbers=48
    if (wordIndex < words.length) {
      // Set the remaining bits (note that the mask could still be zero)
```

## ここがすごい

- 1 ビットずつ立てるのではなく、語の単位で埋めるので、大きな範囲でも語の数だけの計算で済みます。
- 途中の語だけマスクを使うので、範囲の端の処理が 1 か所に限られます。
- マスクの値が 0 になる場合（ちょうど語の境目にあるとき）も、そのまま正しく動きます。コメントの注意もそのことを指しています。
- `>> 6` と `& 0x3f` で、語の番号と語の中の位置を求めます。掛け算や割り算の関数を使わずに済みます。

## まとめ

- 範囲をまとめて 1 にするには、完全な語は `-1` で埋め、端の語だけマスクを使います。
- シフトとビットの反転で、下からの桁を作れます。
- 境目の場合にマスクが 0 になることを考えると、端の処理が正しく書けます。
