---
title: "立っているいちばん下と上のビットの位置を、一命令で求める"
description: "Data.IntSet の内部の lowestBitSet と highestBitSet。ビット列の先頭または末尾にある 0 の数を数えて、立っているビットの位置を求める。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/IntSet/Internal.hs
lines: [2080, 2082]
function: "lowestBitSet"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 低レイヤ]
---

## ひとことで

`lowestBitSet` は、ビット列の中で、いちばん下（最も小さい位置）にある 1 ビットの番号を返します。`highestBitSet` は、いちばん上の 1 ビットの番号を返します。

どちらも、ビットを 1 つずつ調べる代わりに、CPU の命令で 0 の並びの長さを数えて、答えを求めます。

## コード

```haskell:line-numbers=2080
lowestBitSet x = countTrailingZeros x

highestBitSet x = WORD_SIZE_IN_BITS - 1 - countLeadingZeros x
```

## 前提知識

- **ビットの番号**: 右端（最も小さい位置）を 0 とし、左へ 1 ずつ増えます。
- **`countTrailingZeros`**: 下位側にある 0 の数を数える関数です。0 の数は、いちばん下の 1 ビットの番号と同じです。
- **`countLeadingZeros`**: 上位側にある 0 の数を数える関数です。
- **`WORD_SIZE_IN_BITS`**: 語のビット数です。`#if` の中で使われ、環境に応じて値が決まります。

## 何をしているか

### 1. いちばん下の 1 ビットを探す

```haskell:line-numbers=2080
lowestBitSet x = countTrailingZeros x
```

`countTrailingZeros x` は、下位の 0 の数を返します。その数が、いちばん下の 1 ビットの位置です。

具体例で見ます。`x` が `0b1100`（12）なら、下位に 0 が 2 個あるので、答えは 2 です。

### 2. いちばん上の 1 ビットを探す

```haskell:line-numbers=2082
highestBitSet x = WORD_SIZE_IN_BITS - 1 - countLeadingZeros x
```

`countLeadingZeros x` で上位の 0 の数を数え、全体のビット数から引きます。`64 - 1 - 上の 0 の数` が、いちばん上の 1 ビットの位置になります。

## ここがすごい

ビットを 1 つずつ調べる方法は、最悪で 64 回のループになります。この関数は、CPU の命令 1 回で答えを得ます。`IntSet` の探索や取り出しは頻繁に行われるので、この差が効きます。

また、命令が使えない環境のための、別の書き方も `#if` の中に用意されています。速さを優先しつつ、どこでも動くことを保つ工夫です。

## まとめ

- ビット列の端の 1 を探すには、0 の数を数える命令が速い。
- 立っているビットの位置は、0 の数から計算できる。
- 環境ごとの違いは、`#if` で切り替えると安全に保てる。
