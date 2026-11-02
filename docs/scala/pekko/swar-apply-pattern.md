---
title: "8 バイトの中で、探すバイトの位置だけに印をつける"
description: "Apache Pekko の SWARUtil.applyPattern。語と見本の XOR を取り、一致したバイトが 0 になることを利用する。0 のバイトだけに最上位ビットが立つように、加算と論理演算で判定する。ループなしで 8 バイトを同時に調べる。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright 2024 The Netty Project"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/SWARUtil.scala"
lines: [133, 137]
format: 2
function: "SWARUtil.applyPattern"
difficulty: 3
tags: [ビット演算, 文字列処理, 最適化]
---

## ひとことで

Apache Pekko の `SWARUtil.applyPattern` は、64 ビットの語の中の 8 バイトのうち、探しているバイトと同じ位置に印をつけます。一致したバイトだけ、そのバイトの最上位ビットが 1 になり、ほかは 0 になります。`compilePattern` で作った見本と組み合わせて使います。

## コード

```scala:line-numbers=133
  def applyPattern(word: Long, pattern: Long): Long = {
    val input = word ^ pattern
    val tmp = (input & 0x7F7F7F7F7F7F7F7FL) + 0x7F7F7F7F7F7F7F7FL
    ~(tmp | input | 0x7F7F7F7F7F7F7F7FL)
  }
```

## 前提知識

- 2 つの値が等しければ、XOR（`^`）の結果は 0 になります。`word ^ pattern` で、一致したバイトが 0 のバイトになります。
- 「0 のバイトを探す」は、各バイトの値が 0 かどうかを、全部のバイトで同時に調べることです。
- `0x7F7F7F7F7F7F7F7F` は、各バイトの下位 7 ビットを 1 にした値です。最上位ビットは 0 です。
- 加算で桁上がりが隣のバイトに溢れないのは、下位 7 ビットを 0x7F と足しても、結果が 0xFE 以下に収まるからです。
- `~` は、ビットを反転させる演算です。

## 何をしているか

### 1. 語と見本の XOR を取る

`input = word ^ pattern` で、探しているバイトと同じ位置は 0 になります。違うバイトは、0 以外の値になります。

```scala:line-numbers=134
    val input = word ^ pattern
```

### 2. 下位 7 ビットが 0 でないバイトを、最上位ビットで印づける

`input & 0x7F...` で、各バイトの下位 7 ビットだけを取り出します。それに `0x7F...` を足すと、下位 7 ビットが 0 でないバイトだけ、最上位ビットが 1 になります。

```scala:line-numbers=135
    val tmp = (input & 0x7F7F7F7F7F7F7F7FL) + 0x7F7F7F7F7F7F7F7FL
```

### 3. 最上位ビットが 0 のバイトだけを残す

`tmp | input` で、最上位ビットが 1 のバイトは、元の値が 0 でないとまとめて示されます。`0x7F...` と OR を取って下位を埋め、最後に `~` で反転させます。これで、元のバイトが 0 だったところだけ、最上位ビットが 1 になります。

```scala:line-numbers=136
    ~(tmp | input | 0x7F7F7F7F7F7F7F7FL)
```

## ここがすごい

- 8 バイトの一致を、ループや `if` を使わずに、加算と論理演算だけで同時に判定します。
- 桁上がりが隣のバイトに影響しないように、下位 7 ビットに分けて計算しています。その工夫で、8 バイトが独立に扱えます。
- 結果は最上位ビットだけの値なので、`getIndex` や `getLastIndex` で、位置を直接求められます。
- 一致しない場所には何も印がつかないので、検索の結果がそのまま位置の情報になります。

## まとめ

- 語の中の特定のバイトを探すには、XOR で一致を 0 に変え、0 のバイトを印にします。
- 桁上がりを防ぐために、下位 7 ビットと最上位ビットを分けて計算すると、1 語の中で安全に並列処理できます。
- 結果を位置の情報として使えるように、印の形を揃えておくと、後の処理が簡単になります。
