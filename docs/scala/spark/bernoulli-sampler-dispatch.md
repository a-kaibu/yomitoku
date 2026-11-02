---
title: "抽出率で、3 つの抽出方法を使い分ける"
description: "Spark の BernoulliSampler.sample。抽出率が極端に小さいときは飛ばし計算、大きいときは毎回の乱数比較と、場合に応じて方法を切り替えて速さと正しさを両立する。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/random/RandomSampler.scala"
lines: [159, 173]
format: 2
function: "BernoulliSampler.sample"
difficulty: 2
tags: [乱数, アルゴリズム, 最適化]
---

## ひとことで

Apache Spark の `BernoulliSampler` は、各要素を確率 `fraction` で標本に選ぶ抽出器です。`sample()` は、抽出率に応じて 3 つの方法を使い分けます。率が 0 や 1 なら結果が決まっているので計算しません。率が小さいときは「飛ばし計算」を使い、そのほかは要素ごとに乱数と比べます。

## コード

```scala:line-numbers=159
  override def sample(): Int = {
    if (fraction <= 0.0) {
      0
    } else if (fraction >= 1.0) {
      1
    } else if (fraction <= RandomSampler.defaultMaxGapSamplingFraction) {
      gapSampling.sample()
    } else {
      if (rng.nextDouble() <= fraction) {
        1
      } else {
        0
      }
    }
  }
```

## 前提知識

- ベルヌーイ抽出は、各要素を独立に、確率 `fraction` で選ぶ方法です。選ぶなら 1、選ばないなら 0 を返します。
- `rng.nextDouble()` は 0 以上 1 未満の一様な乱数です。これが `fraction` 以下なら選ぶ、という比較で確率が再現できます。
- 「飛ばし計算（gap sampling）」は、次に選ばれる要素までの個数を幾何分布の乱数から一度に求める方法です。
- `gapSampling` は、この飛ばし計算を行う部品です。毎回の乱数の数を減らせます。
- `RandomSampler.defaultMaxGapSamplingFraction` は、飛ばし計算を使ってよい率の上限を表す定数です。

## 何をしているか

### 1. 率が 0 や 1 なら、結果は決まっている

最初の 2 つの分岐では、`fraction` が 0 以下なら常に 0、1 以上なら常に 1 を返します。乱数を引く必要がありません。

```scala:line-numbers=160
    if (fraction <= 0.0) {
      0
    } else if (fraction >= 1.0) {
      1
```

### 2. 率が小さいときは、飛ばし計算に任せる

率が十分に小さいときは、`gapSampling.sample()` を呼びます。選ばれない要素が大半なので、毎回乱数を引くより、飛ばし計算の方が速いからです。

```scala:line-numbers=164
    } else if (fraction <= RandomSampler.defaultMaxGapSamplingFraction) {
      gapSampling.sample()
```

### 3. それ以外は、要素ごとに乱数と比べる

率が大きいときは、要素ごとに `nextDouble()` を引いて、`fraction` と比べます。率が大きいと、選ばれる要素が多く、飛ばし計算の利点が小さくなるからです。

```scala:line-numbers=167
      if (rng.nextDouble() <= fraction) {
        1
      } else {
        0
```

## ここがすごい

- 3 つの方法は、どれも同じ確率で選ぶので、結果の分布は変わりません。速さだけを条件で切り替えています。
- 率が小さい場合に乱数の数を減らせるのは、大きな効果です。データが大量で、選ばれるものが少ないときに差が大きく出ます。
- 率の上限を定数で決めているので、性能の調整を 1 か所で行えます。
- 率が 0 や 1 のときに乱数を引かないのは、無駄な計算をしない基本の工夫です。

## まとめ

- 確率的な選択は、率の大きさに応じて方法を変えると速くなります。
- 結果が決まっている場合は、計算せずに返します。
- 方法を変えても分布が同じなら、利用側は違いを意識せずに済みます。
