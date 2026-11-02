---
title: "1 バイトを、64 ビットの中に 8 個並べて複製する"
description: "Apache Pekko の SWARUtil.compilePattern。探したい 1 バイトを、64 ビットの語の中の 8 バイトすべてに入れる。掛け算 1 回で複製し、その後の比較で一度に 8 バイトを調べられるようにする。SWAR（1 語の中の並列処理）の入口。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright 2024 The Netty Project"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/SWARUtil.scala"
lines: [123, 123]
format: 2
function: "SWARUtil.compilePattern"
difficulty: 2
tags: [ビット演算, 文字列処理, 最適化]
---

## ひとことで

Apache Pekko の `SWARUtil` は、64 ビットの整数の中に 8 バイトを並べて、一度にまとめて比べる技術（SWAR）を使います。`compilePattern` は、探したい 1 バイトを、その 8 バイトすべてに複製します。たとえば `0x41` なら、`0x4141414141414141` を作ります。

## コード

```scala:line-numbers=123
  def compilePattern(byteToFind: Byte): Long = (byteToFind & 0xFFL) * 0x101010101010101L
```

## 前提知識

- 1 バイトは、8 ビットの値です。`Long` は 64 ビットなので、8 バイトを 1 つに詰め込めます。
- SWAR は「SIMD Within A Register」の略で、1 つの整数の中で複数の値を同時に計算する考え方です。
- `& 0xFFL` は、符号を持つバイトを 0 から 255 の値として取り出す操作です。Java の `Byte` は符号付きなので、この処理が必要です。
- `0x0101010101010101` は、各バイトの最下位ビットだけが 1 の値です。この数をかけると、元の値が各バイトに 1 回ずつ写されます。
- 掛け算の結果が桁あふれを起こさないのは、各バイトの値が 1 を複製するだけで、隣のバイトに溢れないからです。

## 何をしているか

### 1. 探すバイトを、0 から 255 の値として取り出す

`byteToFind & 0xFFL` で、符号を外した 8 ビットの値にします。これで、負の値のバイトも正しく扱えます。

```scala:line-numbers=123
  def compilePattern(byteToFind: Byte): Long = (byteToFind & 0xFFL) * 0x101010101010101L
```

### 2. 0x0101… をかけて、8 バイトに複製する

`0x0101010101010101` をかけると、元の値が 8 バイトのそれぞれに入ります。たとえば `0x41` なら `0x41414141_41414141` になります。

この 1 回の掛け算で、8 バイトの「見本の形」ができあがります。後で、語の中の各バイトと比べるための準備です。

## ここがすごい

- 8 回のループで 1 バイトずつ書く代わりに、掛け算 1 回で 8 バイトを作ります。
- 作った値は、後で `applyPattern` で語と XOR し、一致したバイトを一度に見つけるために使われます。
- 符号のあるバイトを `& 0xFFL` で扱うので、負の値（0x80 以上）でも同じ仕組みで比べられます。
- 探す文字を変えても、この 1 行はそのまま使えます。探索の部分を、文字ごとに作り直す必要がありません。

## まとめ

- 1 バイトを 8 個並べるには、0x0101… をかける方法が使えます。
- 掛け算で複製すると、ループなしで一度に 8 バイトの見本を作れます。
- 符号を外してから計算すると、どの値でも正しく扱えます。
