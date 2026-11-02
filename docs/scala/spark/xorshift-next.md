---
title: "数ビットずつシフトして乱数を作る xorshift"
description: "Spark の XORShiftRandom の next。Java の Random の内部を置き換え、3 回のシフトと XOR だけで 64 ビットの状態を更新する軽い乱数生成器。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/random/XORShiftRandom.scala"
lines: [44, 50]
format: 2
function: "XORShiftRandom.next"
difficulty: 2
tags: [乱数, ビット演算, 最適化]
---

## ひとことで

Apache Spark の `XORShiftRandom` で、次の乱数を作る `next` です。64 ビットの状態を、シフトと XOR を 3 回ずつ使って書き換え、そこから必要なビット数だけ取り出します。掛け算を使わず、とても軽い計算で乱数を作ります。

## コード

```scala:line-numbers=44
  override protected def next(bits: Int): Int = {
    var nextSeed = seed ^ (seed << 21)
    nextSeed ^= (nextSeed >>> 35)
    nextSeed ^= (nextSeed << 4)
    seed = nextSeed
    (nextSeed & ((1L << bits) -1)).asInstanceOf[Int]
  }
```

## 前提知識

- 乱数生成器は、内部の「状態」を少しずつ変えながら、数値を出していきます。同じ状態から始めると、同じ数列が出ます。
- `Random` は Java の標準の乱数クラスです。`next(bits)` という protected なメソッドを上書きすると、`nextInt` や `nextDouble` などがすべてこの関数を使うようになります。
- `<<` は左シフト、`>>>` は符号なしの右シフト、`^` は XOR です。
- `1L << bits` は、`Long` の 1 を `bits` 個分だけ左にずらした値です。`- 1` すると、下位 `bits` 個のビットだけが 1 のマスクになります。
- `private var seed` は、クラスの中で変わり続ける状態を保持する変数です。

## 何をしているか

### 1. 状態を左右にシフトして XOR する

最初の 2 行で、`seed` を 21 ビット左にずらした値と XOR し、その結果を 35 ビット右にずらした値とまた XOR します。

```scala:line-numbers=45
    var nextSeed = seed ^ (seed << 21)
    nextSeed ^= (nextSeed >>> 35)
```

上位のビットを下位へ運ぶことで、1 回の XOR で全ビットが少しずつ混ざります。

### 2. もう 1 回シフトして状態を更新する

3 回目のシフトで、下位へ広がったビットを上位へ運び、状態を完成させます。

```scala:line-numbers=47
    nextSeed ^= (nextSeed << 4)
    seed = nextSeed
```

更新した `nextSeed` を `seed` に保存します。次に呼ばれたとき、この新しい値から計算が続きます。

### 3. 必要なビット数だけ取り出す

最後に、`(1L << bits) - 1` で下位 `bits` ビットのマスクを作り、状態と AND して取り出します。`asInstanceOf[Int]` は、そのまま `Int` として返すための型変換です。

## ここがすごい

- xorshift は、掛け算を使わずにシフトと XOR だけで乱数を作る方式です。計算が軽く、Java の `Random` より速く動きます。
- 1 回の `next` の中で、状態を完全に更新してから結果を取り出すので、同じ呼び出しで 2 回使っても、順序が崩れません。
- `next(bits)` だけを上書きすると、`nextInt` や `nextLong` や `nextGaussian` などもすべて同じ乱数源を使うようになります。小さな場所を変えるだけで、Random の API 全体を置き換えています。
- 空の状態（すべて 0 のビット列）になると、xorshift は 0 から抜け出せません。このため、初期化のときに `hashSeed` で状態を必ず 0 でない値にしています。

## まとめ

- 乱数は、状態をシフトと XOR で変えていくだけで作れます。
- 標準の乱数クラスの `next` を上書きすると、その上の API がまとめて使えます。
- 軽い乱数には xorshift が向いていますが、初期値の作り方に注意が要ります。
