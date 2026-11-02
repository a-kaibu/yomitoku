---
title: "次に選ばれる位置を、対数で一度に決める"
description: "Spark の GapSampling.advance。何個飛ばしたら次の標本が選ばれるかを、幾何分布から対数を使って 1 回の計算で求める。一件ずつ乱数を引かずに済むサンプリング。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/random/RandomSampler.scala"
lines: [269, 272]
format: 2
function: "GapSampling.advance"
difficulty: 3
tags: [乱数, アルゴリズム, 数値計算]
---

## ひとことで

Apache Spark の `RandomSampler` で、確率 `f` の標本抽出を行うときの `advance` です。要素を 1 つずつ乱数で選ぶ代わりに、次に選ばれるまでに何個飛ばすかを 1 回の計算で決めます。その飛ばす数は、幾何分布という確率分布に従う値です。

## コード

```scala:line-numbers=269
  private def advance(): Unit = {
    val u = math.max(rng.nextDouble(), epsilon)
    countForDropping = (math.log(u) / lnq).toInt
  }
```

## 前提知識

- 標本抽出（サンプリング）は、全体から確率 `f` で要素を選ぶ処理です。各要素は独立に、確率 `f` で選ばれます。
- 幾何分布は、「成功するまでに失敗した回数」の分布です。確率 `f` で成功するとき、失敗が k 回続く確率は `f(1-f)^k` です。
- `math.log` は自然対数です。0 に近い値に log を取ると、絶対値の大きい負の数になります。
- `math.log1p(-f)` は `log(1 - f)` を、`f` が小さいときも精度よく計算する関数です。
- `math.max(x, epsilon)` は、log(0) を防ぐために、下限を決める書き方です。

## 何をしているか

### 1. 乱数を 0 より大きい値に切り上げる

`u` は 0 から 1 の乱数です。`log(0)` は計算できないので、`epsilon` より小さければ `epsilon` にそろえます。

```scala:line-numbers=270
    val u = math.max(rng.nextDouble(), epsilon)
```

### 2. 対数で、飛ばす個数を求める

`log(u) / lnq` は、幾何分布からの乱数に当たる値です。`lnq` は `log(1 - f)` で、負の数なので、割り算の結果は正になります。`toInt` で切り捨てると、飛ばす個数が決まります。

```scala:line-numbers=271
    countForDropping = (math.log(u) / lnq).toInt
```

`lnq` は、コンストラクタで 1 回だけ計算しておきます。

```scala:line-numbers=250
  private val lnq = math.log1p(-f)
```

### 3. 残りの個数を数えながら、要素を読む

`sample` は、`countForDropping` が 0 より大きければ、その要素は選ばず、カウントを 1 減らします。0 になったときに、次の選ばれる要素を 1 つ決めて、また `advance` で飛ばす個数を求めます。

## ここがすごい

- 要素ごとに乱数を引くと、要素数と同じ回数の乱数が必要です。この方法では、選ばれる要素の数の分だけ乱数を引きます。`f` が小さいとき、大きな差になります。
- 対数の式で、幾何分布の逆関数を直接計算しています。一様な乱数を、望みの分布へ変換する標準的な方法です。
- `epsilon` で log(0) を防いでいるので、乱数がたまたま 0 でも、計算が壊れません。
- `lnq` を毎回計算せず、最初に 1 回だけ計算しておくのも、細かいけれど効く工夫です。

## まとめ

- 確率的な選択は、次に選ばれるまでの個数を幾何分布から求めると、乱数の回数を減らせます。
- 逆関数を対数で書くと、一様な乱数から望みの分布の値を作れます。
- 0 に近い値の log は、下限を設けて守ります。
