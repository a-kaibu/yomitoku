---
title: "64 ビットの値を、上下の 32 ビットを混ぜて 32 ビットに縮める"
description: "Apache Pekko の HashCode.hash(seed, Long)。Long の上位 32 ビットと下位 32 ビットを XOR して、Int に切り捨てる。その値を seed の前の項に足す。上位のビットの違いを、下位にも反映させる。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/HashCode.scala"
lines: [57, 57]
format: 2
function: "HashCode.hash(Long)"
difficulty: 2
tags: [ハッシュ, ビット演算, 数値計算]
---

## ひとことで

Apache Pekko の `HashCode` で、`Long` の値をハッシュに混ぜる 1 行です。64 ビットの値は、そのままでは `Int` に入りません。上位の 32 ビットと下位の 32 ビットを XOR で混ぜ、下位 32 ビットを取り出すことで、情報をできるだけ残したまま縮めます。

## コード

```scala:line-numbers=57
  def hash(seed: Int, value: Long): Int = firstTerm(seed) + (value ^ (value >>> 32)).asInstanceOf[Int]
```

## 前提知識

- `Long` は 64 ビット、`Int` は 32 ビットです。`Int` に変換すると、上位の 32 ビットは捨てられます。
- そのまま下位 32 ビットを取り出すと、上位だけが違う 2 つの値が、同じハッシュになってしまいます。
- `>>> 32` は、64 ビットの値を 32 ビット右にずらす操作です。上位 32 ビットが下位に移ります。
- `^`（XOR）は、ビットごとに違うときだけ 1 にする演算です。上位と下位を XOR すると、両方の情報が下位に残ります。
- `firstTerm(seed)` は、`seed` に素数の定数をかけた値で、ハッシュの初期の項です。

## 何をしているか

### 1. 上位と下位の 32 ビットを混ぜる

`value ^ (value >>> 32)` で、上位 32 ビットを下位へ XOR します。上位だけが違う値も、この段階で下位のビットが変わります。

### 2. Int に切り捨てて、ハッシュの項として足す

`.asInstanceOf[Int]` で、下位 32 ビットを取り出します。`firstTerm(seed)` に足して、ハッシュの計算を続けます。

```scala:line-numbers=57
  def hash(seed: Int, value: Long): Int = firstTerm(seed) + (value ^ (value >>> 32)).asInstanceOf[Int]
```

## ここがすごい

- 1 行で、64 ビットの情報を 32 ビットに縮めても、上位の違いが下位に残ります。
- `Long` のハッシュと `Int` のハッシュを、同じ形の式で作れるので、組み合わせる部品として扱いやすいです。
- `>>> 32` は符号を入れない右シフトなので、負の値でも上位の情報を正しくずらせます。
- 同じ考え方は、Java の `Long.hashCode` にも使われています。標準の作りに合わせた書き方です。

## まとめ

- 大きな整数を小さくするときは、上位と下位を XOR してから切り捨てると、情報が残ります。
- 符号を入れない右シフトを使うと、負の値でも正しく上位を取り出せます。
- ハッシュの項は、seed をかけた値と足し合わせると、複数の値を混ぜやすくなります。
