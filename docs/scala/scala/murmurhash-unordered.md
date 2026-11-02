---
title: "順番に関係なく同じ値になる、集合のハッシュ"
description: "Scala の MurmurHash3.unorderedHash。要素の和・XOR・奇数の積の 3 つを集めてから混ぜるので、同じ要素を別の順で入れても同じハッシュになる。集合のハッシュに使われる。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/util/hashing/MurmurHash3.scala"
lines: [119, 136]
format: 2
function: "MurmurHash3.unorderedHash"
difficulty: 3
tags: [ハッシュ, 標準ライブラリ, ビット演算]
---

## ひとことで

Scala の標準ライブラリにある `MurmurHash3.unorderedHash` は、要素の順番に関係なく同じ値になるハッシュを計算します。`Set` のように順序を持たない集まりを、ハッシュの値にまとめるために使われます。要素ごとのハッシュを、和、XOR、積の 3 通りで集めて、最後に混ぜます。

## コード

```scala:line-numbers=119
  final def unorderedHash(xs: IterableOnce[Any], seed: Int): Int = {
    var a, b, n = 0
    var c = 1
    val iterator = xs.iterator
    while (iterator.hasNext) {
      val x = iterator.next()
      val h = x.##
      a += h
      b ^= h
      c *= h | 1
      n += 1
    }
    var h = seed
    h = mix(h, a)
    h = mix(h, b)
    h = mixLast(h, c)
    finalizeHash(h, n)
  }
```

## 前提知識

- ハッシュ値は、オブジェクトを代表する整数です。`x.##` は、Scala で `hashCode` と同じ役割をする演算子です。
- `Set(1, 2, 3)` と `Set(3, 2, 1)` は同じ集合です。だから、ハッシュも同じ値になってほしいわけです。
- 足し算、XOR、掛け算は、どれも交換法則が成り立ちます。順番を変えても結果が変わりません。
- `h | 1` は、最下位ビットを 1 にする操作です。結果は必ず奇数になります。
- `IterableOnce` は、1 回だけ順に要素を取り出せるコレクションの共通の型です。

## 何をしているか

### 1. 要素ごとのハッシュを 3 つの集計に入れる

ループの中で、要素のハッシュ `h` を 3 つの変数に足したり、XOR したり、掛けたりします。

```scala:line-numbers=125
      val h = x.##
      a += h
      b ^= h
      c *= h | 1
```

`a` は和、`b` は XOR、`c` は積です。`c` は、奇数の数を掛け続けるので、結果も奇数になります。0 に潰れないようにするための工夫です。

### 2. 3 つの値と要素数を混ぜる

ループが終わったら、3 つの値を `mix` と `mixLast` で `seed` に順に混ぜます。

```scala:line-numbers=132
    h = mix(h, a)
    h = mix(h, b)
    h = mixLast(h, c)
    finalizeHash(h, n)
```

最後の `finalizeHash` で要素数 `n` を混ぜるので、同じ要素でも個数が違えば、ハッシュは違う値になります。

## ここがすごい

- 和、XOR、積のどれも、順番を変えても同じ結果になります。そのため、要素の並びを事前にソートする必要がありません。
- 1 つの集計だけだと、ほかの組み合わせで衝突しやすくなります。3 つの集計を組み合わせて、衝突しにくくしています。
- `c` に奇数だけを掛けるのは、積が 0 に潰れると情報が失われるからです。`| 1` の 1 文字で、この問題を避けています。
- コレクションを 1 回だけ走査して、メモリを増やさずに計算しています。

## まとめ

- 順序に関係ないハッシュは、交換法則が成り立つ演算だけで集計します。
- 集計の種類を複数にすると、衝突を減らせます。
- 積を使うときは、0 にならないように奇数に揃えると安全です。
