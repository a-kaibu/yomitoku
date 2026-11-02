---
title: "文字を 2 つずつ束ねて文字列のハッシュを作る"
description: "Scala 標準ライブラリの MurmurHash3.stringHash。1 文字 16 ビットの char を 2 つずつ 1 つの 32 ビット値にまとめ、文字数も混ぜて文字列のハッシュを作る。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/util/hashing/MurmurHash3.scala"
lines: [103, 113]
format: 2
function: "MurmurHash3.stringHash"
difficulty: 2
tags: [ハッシュ, ビット演算, 文字列処理, 標準ライブラリ]
---

## ひとことで

Scala の標準ライブラリで文字列のハッシュ値を計算する `stringHash` です。文字を 2 つずつ組にして 1 つの整数にまとめ、`mix` で順番に混ぜていきます。最後に文字数を混ぜて仕上げるので、長さの違う文字列同士が同じ値になりにくくなっています。

## コード

```scala:line-numbers=103
  final def stringHash(str: String, seed: Int): Int = {
    var h = seed
    var i = 0
    while (i + 1 < str.length) {
      val data = (str.charAt(i) << 16) + str.charAt(i + 1)
      h = mix(h, data)
      i += 2
    }
    if (i < str.length) h = mixLast(h, str.charAt(i).toInt)
    finalizeHash(h, str.length)
  }
```

## 前提知識

- `String` の中身は `char` の並びです。`char` は 16 ビットの符号なし整数で、`charAt(i)` で i 番目の文字を取り出せます。
- `<<` は左シフトです。`x << 16` は値を 16 ビット左へずらします。
- `+` と `|` は、下位 16 ビットに値が入っている場合はほぼ同じ結果になります。
- `while` は条件が真の間、ブロックを繰り返す制御構文です。`i += 2` は i に 2 を足します。
- `mix` と `mixLast` は、前のセクションで読んだ `MurmurHash3` の関数です。

## 何をしているか

### 1. 文字を 2 つずつ 1 つの整数にまとめる

ループの中では、2 文字分を 1 つの `Int` にまとめます。前の文字を上位 16 ビット、後ろの文字を下位 16 ビットに置きます。

```scala:line-numbers=107
      val data = (str.charAt(i) << 16) + str.charAt(i + 1)
```

`charAt` は 16 ビットの値しか返さないので、2 文字を並べても重なりません。だから 32 ビットの値の中に、2 文字分の情報がきちんと残ります。

### 2. 2 文字ごとに混ぜていく

まとめた値は `mix` で現在のハッシュに混ぜ込まれ、`i` は 2 進みます。文字列が偶数長なら、このループだけで全部の文字が処理されます。

### 3. 余った文字と文字数を混ぜる

文字数が奇数のときは、最後の 1 文字が残ります。残りがあれば `mixLast` で混ぜ、最後に `finalizeHash` に長さを渡します。

```scala:line-numbers=111
    if (i < str.length) h = mixLast(h, str.charAt(i).toInt)
    finalizeHash(h, str.length)
```

`finalizeHash` は長さを XOR で混ぜてから `avalanche` を通します。たとえば "ab" と "abab" の中身の 1 つ目の組が同じでも、長さが違うので最後の値が変わります。

## ここがすごい

- 1 文字ずつ `mix` すると、計算回数が 2 倍になります。2 文字をまとめることで、ループの回数と混ぜる処理の回数が半分になります。
- 文字列の長さを最後に混ぜる設計は、末尾の文字だけ違う文字列や、ゼロ文字を並べただけの文字列の衝突を減らします。
- 途中のブロックには `mix`、末尾の 1 ブロックには `mixLast` を使い分けています。撹拌の強さを必要な場所だけに使う、MurmurHash3 の典型的な作りです。
- Java の `String.hashCode` は 1 文字ずつ `31` 倍して足す方式です。MurmurHash3 は掛け算と回転を使うので、同じ並びの文字でも偏りの出方が違います。

## まとめ

- 文字列のハッシュは、データを少しずつまとめて混ぜ込む形で計算できます。
- 16 ビットの char 2 つを 1 つの Int にまとめると、ループの回数を減らせます。
- 最後に長さを混ぜると、長さの違う文字列を区別しやすくなります。
