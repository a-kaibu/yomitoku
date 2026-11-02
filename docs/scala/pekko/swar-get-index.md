---
title: "最初に一致したバイトの位置を、先頭の 0 の数から求める"
description: "Apache Pekko の SWARUtil.getIndex。applyPattern の結果（一致したバイトの最上位ビットだけが 1）の先頭の 0 の数を数え、8 で割る。最初に一致したバイトの番号を、ループなしで求める。見つからなければ 8 を返す。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright 2024 The Netty Project"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/SWARUtil.scala"
lines: [147, 148]
format: 2
function: "SWARUtil.getIndex"
difficulty: 2
tags: [ビット演算, 文字列処理, 最適化]
---

## ひとことで

Apache Pekko の `SWARUtil.getIndex` は、`applyPattern` の結果から、最初に一致したバイトの番号を求めます。結果の 64 ビットのうち、上から最初に 1 が現れる位置を数えて、8 で割るだけです。ループは使いません。

## コード

```scala:line-numbers=147
  def getIndex(word: Long): Int =
    java.lang.Long.numberOfLeadingZeros(word) >>> 3
```

## 前提知識

- `applyPattern` の結果は、一致したバイトの最上位ビットだけが 1 になった値です。1 バイトは 8 ビットなので、各バイトの最上位ビットは 8 ビットごとに並びます。
- `Long.numberOfLeadingZeros(x)` は、`x` の上（最上位）から続く 0 の数を返す関数です。
- 8 ビットごとの位置を、先頭から数える前に 0 の数を数えると、最初の 1 の位置が分かります。その数を 8 で割ると、何バイト目かが分かります。
- `>>> 3` は、3 ビット右にずらす操作で、8 で割ることと同じです。
- この実装は、バイトの並びを、ビッグエンディアン（上の桁から先頭のバイト）で扱う前提です。

## 何をしているか

### 1. 最上位から続く 0 の数を数える

`numberOfLeadingZeros(word)` は、語の上の桁から、1 が現れるまでの 0 の数を返します。一致したバイトがあれば、その最上位ビットが、この 0 の数の直後に来ます。

```scala:line-numbers=148
    java.lang.Long.numberOfLeadingZeros(word) >>> 3
```

### 2. 8 で割って、バイトの番号にする

0 の数は、ビットの数です。8 ビットごとに 1 バイトなので、`>>> 3`（8 で割る）でバイトの番号が得られます。一致したバイトがなければ、0 の数は 64 になるので、答えは 8 になります。これは「見つからなかった」を表す値です。

## ここがすごい

- 先頭から 1 つずつ調べる代わりに、1 回の命令で 0 の数を求めます。8 バイトの探索が、定数時間で終わります。
- 見つからない場合も、同じ式で 8 が返るので、特別な分岐がいりません。
- 8 で割る処理を `>>> 3` で行うので、割り算の命令を使いません。
- 「見つからなかったら 8」という規則は、文字列の長さの範囲外を表すのに便利な値です。

## まとめ

- 先頭に一致した印があるかは、先頭の 0 の数で判定できます。
- ビット数をバイト数に直すには、3 ビット右にずらすだけで足ります。
- 見つからない場合を、自然にバイト数の上限として返すと、呼び出し側が分かりやすくなります。
