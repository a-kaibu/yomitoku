---
title: "区間に入るかで 0 か 1 を決める、区間サンプラー"
description: "Spark の BernoulliCellSampler.sample。乱数が区間 [lb, ub) に入ったら 1 を返し、complement が真なら結果を反転する。区間の幅がゼロ以下のときは乱数を引かない。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/random/RandomSampler.scala"
lines: [116, 124]
format: 2
function: "BernoulliCellSampler.sample"
difficulty: 2
tags: [乱数, アルゴリズム, 数値計算]
---

## ひとことで

Apache Spark の `BernoulliCellSampler` は、乱数が決めた区間 `[lb, ub)` に入ったときだけ、要素を標本に選びます。区間を広げたり狭めたりすることで、乱数による分割（セル）を作れます。`complement` が真なら、選ぶかどうかを反対にします。

## コード

```scala:line-numbers=116
  override def sample(): Int = {
    if (ub - lb <= 0.0) {
      if (complement) 1 else 0
    } else {
      val x = rng.nextDouble()
      val n = if ((x >= lb) && (x < ub)) 1 else 0
      if (complement) 1 - n else n
    }
  }
```

## 前提知識

- `[lb, ub)` は、`lb` を含み、`ub` を含まない区間です。たとえば `[0.2, 0.5)` は 0.2 以上 0.5 未満です。
- 一様な乱数 `x` が区間に入る確率は、区間の幅 `ub - lb` に等しくなります。
- 「補集合（complement）」は、もとの条件の反対です。区間の外を選びたいときに使います。
- 1 - n は、0 と 1 を入れ替える式です。
- `if ... else` は、式として値を返せる書き方です。

## 何をしているか

### 1. 区間の幅がゼロ以下なら、乱数を使わない

最初の分岐では、区間が空（`ub - lb` が 0 以下）なら、乱数を引かずに結果を決めます。区間に入る要素はないので、補集合のときだけ 1 を返します。

### 2. 乱数が区間に入るかを調べる

それ以外のときは、乱数 `x` を 1 つ引いて、`lb <= x < ub` なら `n` を 1、そうでなければ 0 にします。

```scala:line-numbers=120
      val x = rng.nextDouble()
      val n = if ((x >= lb) && (x < ub)) 1 else 0
```

### 3. 補集合なら、結果を反転する

`complement` が真なら、`1 - n` で 0 と 1 を入れ替えます。区間の中の要素を外して、外の要素を選ぶ形になります。

```scala:line-numbers=122
      if (complement) 1 - n else n
```

## ここがすごい

- 区間の上限と下限を変えるだけで、同じ仕組みで違う割合の標本が作れます。`[0, 0.5)` と `[0.5, 1)` にすれば、データを半分ずつ、重なりなく分けられます。
- 区間の幅がゼロ以下なら乱数を引かないので、無駄な計算が起きません。
- 補集合を `1 - n` で作るので、分岐を増やさずに反対の選択ができます。
- 乱数を使う式が 1 行に収まっていて、読みやすい形になっています。

## まとめ

- 乱数を区間に当てはめると、確率的な分割が作れます。
- 区間の幅がゼロなら、乱数を使わずに決められます。
- 補集合は、0 と 1 を入れ替えるだけで作れます。
