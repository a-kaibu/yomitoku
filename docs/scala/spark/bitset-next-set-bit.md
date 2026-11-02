---
title: "次に 1 が立っている位置を、64 ビット単位で飛ばしながら探す"
description: "Apache Spark の BitSet.nextSetBit。指定の位置以降で最初に 1 が立っているビットを探す。64 ビットの語ごとに調べ、0 の語は読み飛ばす。末尾の 0 の数で位置を求める。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/collection/BitSet.scala"
lines: [213, 237]
format: 2
function: "BitSet.nextSetBit"
difficulty: 3
tags: [ビット演算, データ構造, 最適化]
---

## ひとことで

Spark の `BitSet` は、0 と 1 の並びを、64 ビットずつの `Long` の配列で持つ集合です。`nextSetBit` は、指定の位置より後ろで、最初に 1 が立っているビットの番号を返します。見つからなければ -1 を返します。

## コード

::: code-group

```scala:line-numbers=213 [日本語訳]
  def nextSetBit(fromIndex: Int): Int = {
    var wordIndex = fromIndex >> 6
    if (wordIndex >= numWords) {
      return -1
    }

    // まず、今いる語の中で次の 1 を探します。
    val subIndex = fromIndex & 0x3f
    var word = words(wordIndex) >> subIndex
    if (word != 0) {
      return (wordIndex << 6) + subIndex + java.lang.Long.numberOfTrailingZeros(word)
    }

    // 残りの語を順に調べて、0 でない語の中の 1 を探します。
    wordIndex += 1
    while (wordIndex < numWords) {
      word = words(wordIndex)
      if (word != 0) {
        return (wordIndex << 6) + java.lang.Long.numberOfTrailingZeros(word)
      }
      wordIndex += 1
    }

    -1
  }
```

```scala:line-numbers=213 [原文]
  def nextSetBit(fromIndex: Int): Int = {
    var wordIndex = fromIndex >> 6
    if (wordIndex >= numWords) {
      return -1
    }

    // Try to find the next set bit in the current word
    val subIndex = fromIndex & 0x3f
    var word = words(wordIndex) >> subIndex
    if (word != 0) {
      return (wordIndex << 6) + subIndex + java.lang.Long.numberOfTrailingZeros(word)
    }

    // Find the next set bit in the rest of the words
    wordIndex += 1
    while (wordIndex < numWords) {
      word = words(wordIndex)
      if (word != 0) {
        return (wordIndex << 6) + java.lang.Long.numberOfTrailingZeros(word)
      }
      wordIndex += 1
    }

    -1
  }
```

:::

## 前提知識

- 1 ビットは 0 か 1 の値です。`BitSet` では、ビットが 1 のとき、その番号の要素が集合に入っていることを表します。
- `Long` は 64 ビットの整数です。`fromIndex >> 6` は、ビットの番号を 64 で割った値で、どの語にあるかを表します。`& 0x3f` は、64 で割った余りで、語の中の位置を表します。
- `numberOfTrailingZeros` は、下の桁から続く 0 の数を数える関数です。0 の数が分かれば、最初の 1 の位置が分かります。
- `>>` は、ビットを右にずらす演算です。語の中の指定位置より前のビットを捨てて、先頭に持ってきます。
- `return` は、関数の途中で値を返して抜ける書き方です。

## 何をしているか

### 1. 最初に、語の番号と、語の中の位置を求める

`fromIndex` を 64 で割って、どの語から探すかを決めます。範囲を超えていれば、探す場所が無いので -1 を返します。

```scala:line-numbers=215
    if (wordIndex >= numWords) {
      return -1
    }

```

### 2. 今の語の中に 1 があるかを調べる

語を `subIndex` ビットだけ右にずらして、指定位置より前のビットを捨てます。残りが 0 でなければ、下から最初の 1 の位置を計算して返します。

```scala:line-numbers=222
    if (word != 0) {
      return (wordIndex << 6) + subIndex + java.lang.Long.numberOfTrailingZeros(word)
    }

    // Find the next set bit in the rest of the words
```

### 3. 残りの語を順に見る

今の語に 1 が無ければ、次の語へ進みます。0 でない語を見つけたら、その語の下から最初の 1 の位置を返します。ここでは語の先頭から数えるので、ずらしは要りません。

```scala:line-numbers=228
    while (wordIndex < numWords) {
      word = words(wordIndex)
      if (word != 0) {
        return (wordIndex << 6) + java.lang.Long.numberOfTrailingZeros(word)
      }
      wordIndex += 1
    }
```

### 4. どこにも無ければ -1

最後の語まで 0 だったら、1 は残っていないので、-1 を返します。

```scala:line-numbers=236
    -1
```

## ここがすごい

- 1 ビットずつ確かめるのではなく、64 ビットずつ飛ばします。0 の語は 1 回の比較で読み飛ばせます。
- 最初の 1 の位置は、`numberOfTrailingZeros` という 1 つの命令で求めます。ループで桁を数えなくてよいのが速さの理由です。
- 語の境界を `>> 6` と `& 0x3f` で扱うので、掛け算や割り算の関数を使わずに済みます。
- 集合の要素を全部回る `iterator` も、この関数の繰り返しで作られています。コメントの例のように、`for` で順番に取り出せます。

## まとめ

- 1 が立っている位置を探すには、語ごとに飛ばすと速くなります。
- 最初の 1 の位置は、末尾の 0 の数で求められます。
- 範囲外や見つからない場合は、-1 のような特別な値で伝えます。
