---
title: "種の 1 つから 128 ビット分の初期状態を作る"
description: "Spark の XORShiftRandom.hashSeed。8 バイトの種を MurmurHash3 で 2 回ハッシュし、上位と下位の 32 ビットを合わせて、0 とも偏りとも違う初期状態を作る。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/random/XORShiftRandom.scala"
lines: [61, 66]
format: 2
function: "XORShiftRandom.hashSeed"
difficulty: 2
tags: [乱数, ハッシュ, ビット演算]
---

## ひとことで

Spark の `XORShiftRandom` で、利用者の渡した種（シード）から、乱数生成器の初期状態を作る `hashSeed` です。種の 8 バイトを MurmurHash3 で 2 回ハッシュして、上位と下位の 32 ビットをそれぞれ作り、1 つの `Long` にまとめます。

## コード

```scala:line-numbers=61
  private[random] def hashSeed(seed: Long): Long = {
    val bytes = ByteBuffer.allocate(java.lang.Long.BYTES).putLong(seed).array()
    val lowBits = MurmurHash3.bytesHash(bytes, MurmurHash3.arraySeed)
    val highBits = MurmurHash3.bytesHash(bytes, lowBits)
    (highBits.toLong << 32) | (lowBits.toLong & 0xFFFFFFFFL)
  }
```

## 前提知識

- シード（種）は、乱数の数列の出発点を決める値です。同じシードからは、同じ数列が生まれます。
- xorshift の状態は、すべてのビットが 0 だと永遠に 0 のままになります。そのため、初期状態には 0 以外の値を使う必要があります。
- `ByteBuffer.allocate(8).putLong(seed).array()` は、`Long` の値を 8 バイトの配列に変換する書き方です。
- `Long` は 64 ビットの整数です。`toLong` は `Int` を `Long` に変換します。
- `<<` で 32 ビット左にずらし、`|` で OR を取ると、上位 32 ビットと下位 32 ビットを 1 つの `Long` に合わせられます。

## 何をしているか

### 1. 種をバイト列にして、1 回目のハッシュを取る

最初の 2 行で、`Long` の種を 8 バイトのバイト列にします。そして `MurmurHash3.bytesHash` に `arraySeed` を渡して、下位 32 ビット用の値 `lowBits` を作ります。

### 2. 1 回目の結果を種にして、2 回目のハッシュを取る

次の行では、`lowBits` を種にして、同じバイト列を再びハッシュします。これで上位 32 ビット用の `highBits` ができます。

同じデータでも、種が違えば結果が全く違うので、2 つの値は互いに関係がありながら、別の値になります。

### 3. 2 つの 32 ビットを 1 つの Long に合わせる

最後の行で、`highBits` を 32 ビット左に動かし、`lowBits` の下位 32 ビットと OR で合わせます。

```scala:line-numbers=65
    (highBits.toLong << 32) | (lowBits.toLong & 0xFFFFFFFFL)
```

`lowBits.toLong & 0xFFFFFFFFL` は、`Int` を `Long` に変換したときに符号が上位へ広がるのを防ぐ、マスクの処理です。

## ここがすごい

- 初期状態を 0 にしないために、種を「ハッシュの値」に変えています。種が 0 でも、MurmurHash3 の結果は 0 にならないように設計されているので、xorshift が固まる心配が減ります。
- 2 回のハッシュの連鎖で、種の情報を 64 ビット全体に広げています。種が少ししか違わなくても、初期状態は大きく違うので、最初の数字が似すぎるのを防げます。
- `toLong` で符号が広がる問題を、`0xFFFFFFFFL` でのマスクで防いでいます。負の `Int` を扱うときによく必要になる一手間です。
- 種からの変換をまとめて `private[random]` の関数にしておくと、乱数生成器の作り方を一か所で管理できます。

## まとめ

- 乱数生成器の初期状態は、0 にならないように種から作ります。
- ハッシュを連鎖させると、少しの違いを 64 ビット全体に広げられます。
- `Int` から `Long` へ変換するときは、符号の広がりに注意します。
