---
title: "最後に一致したバイトの位置を、末尾の 0 の数から求める"
description: "Apache Pekko の SWARUtil.getLastIndex。applyPattern の結果で、一致したバイトのうち最も後ろ（下位側）のものを探す。末尾の 0 の数から位置を求め、8 で割る。見つからなければ -1 を返す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright 2024 The Netty Project"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/SWARUtil.scala"
lines: [157, 159]
format: 2
function: "SWARUtil.getLastIndex"
difficulty: 3
tags: [ビット演算, 文字列処理, 最適化]
---

## ひとことで

Apache Pekko の `SWARUtil.getLastIndex` は、一致したバイトのうち、いちばん後ろにあるものの番号を返します。`getIndex` が先頭から探すのに対して、こちらは後ろから探す関数です。一致がなければ -1 を返します。

## コード

```scala:line-numbers=157
  def getLastIndex(word: Long): Int =
    if (word == 0) -1
    else (java.lang.Long.SIZE - 1 - java.lang.Long.numberOfTrailingZeros(word)) >>> 3
```

## 前提知識

- `applyPattern` の結果は、一致したバイトの最上位ビットだけが 1 になった値です。
- `Long.numberOfTrailingZeros(x)` は、`x` の下（最下位）から続く 0 の数を返す関数です。最下位の 1 の位置を表します。
- ビッグエンディアンでは、語の上の桁が先頭のバイトです。そのため、下の桁に近いほど、後ろのバイトになります。
- `Long.SIZE` は、`Long` のビット数で、64 です。
- 「後ろから見る」ときは、最下位の 1 の位置を 64 − 1 から引いて、上の桁からの位置に直します。

## 何をしているか

### 1. 一致がなければ、-1 を返す

語が 0 なら、どのバイトも一致していません。そのときは -1 を返します。

```scala:line-numbers=158
    if (word == 0) -1
```

### 2. 最下位の 1 の位置を、上の桁からの位置に直す

`numberOfTrailingZeros(word)` で、最も下の 1 の位置を求めます。そこから `SIZE - 1` を引くと、上から数えた位置になります。その値を `>>> 3` で 8 で割ると、バイトの番号が得られます。

```scala:line-numbers=159
    else (java.lang.Long.SIZE - 1 - java.lang.Long.numberOfTrailingZeros(word)) >>> 3
```

## ここがすごい

- 後ろから探す処理も、1 回の命令と引き算だけで済みます。ループで末尾から 1 つずつ調べる必要がありません。
- 一致がないときの -1 は、`indexOf` などと同じ約束で、呼び出し側が分かりやすくなります。
- `getIndex` と対になっていて、先頭と末尾の両方を、同じ印の形から求められます。
- ビットの位置とバイトの位置を、3 ビットずらす 1 つの操作で変換しています。

## まとめ

- 末尾の一致を探すには、最下位の 1 の位置を求めて、上の桁からの位置に直します。
- 語の中の位置を、ビット数からバイト数に変えるには、8 で割るだけで足ります。
- 見つからないときの値を決めておくと、呼び出し側の分岐が明快になります。
