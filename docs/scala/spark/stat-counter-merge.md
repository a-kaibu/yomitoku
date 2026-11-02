---
title: "片方がとても小さくても正しい、統計のまとめ方"
description: "Spark の StatCounter.merge(other)。2 つの統計（個数・平均・二乗和）を 1 つにまとめる。個数の差が 10 倍以上あるときは、大きい方の平均に近い式を使い、誤差と計算量を抑える。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "Copyright 2014 and onwards The Apache Software Foundation."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/StatCounter.scala"
lines: [60, 86]
format: 2
function: "StatCounter.merge(other)"
difficulty: 3
tags: [数値計算, 並行処理, アルゴリズム]
---

## ひとことで

Apache Spark の `StatCounter` を、別の `StatCounter` とまとめる `merge(other)` です。データを複数の分割で別々に集計してから、最後に 1 つにまとめる場面で使われます。個数、平均、二乗和を、2 つのデータの合計として正しく結びつけます。

## コード

::: code-group

```scala:line-numbers=60 [日本語訳]
  def merge(other: StatCounter): StatCounter = {
    if (other == this) {
      merge(other.copy())  // 変な順序でフィールドを上書きしないように、コピーを使います。
    } else {
      if (n == 0) {
        mu = other.mu
        m2 = other.m2
        n = other.n
        maxValue = other.maxValue
        minValue = other.minValue
      } else if (other.n != 0) {
        val delta = other.mu - mu
        if (other.n * 10 < n) {
          mu = mu + (delta * other.n) / (n + other.n)
        } else if (n * 10 < other.n) {
          mu = other.mu - (delta * n) / (n + other.n)
        } else {
          mu = (mu * n + other.mu * other.n) / (n + other.n)
        }
        m2 += other.m2 + (delta * delta * n * other.n) / (n + other.n)
        n += other.n
        maxValue = math.max(maxValue, other.maxValue)
        minValue = math.min(minValue, other.minValue)
      }
      this
    }
  }
```

```scala:line-numbers=60 [原文]
  def merge(other: StatCounter): StatCounter = {
    if (other == this) {
      merge(other.copy())  // Avoid overwriting fields in a weird order
    } else {
      if (n == 0) {
        mu = other.mu
        m2 = other.m2
        n = other.n
        maxValue = other.maxValue
        minValue = other.minValue
      } else if (other.n != 0) {
        val delta = other.mu - mu
        if (other.n * 10 < n) {
          mu = mu + (delta * other.n) / (n + other.n)
        } else if (n * 10 < other.n) {
          mu = other.mu - (delta * n) / (n + other.n)
        } else {
          mu = (mu * n + other.mu * other.n) / (n + other.n)
        }
        m2 += other.m2 + (delta * delta * n * other.n) / (n + other.n)
        n += other.n
        maxValue = math.max(maxValue, other.maxValue)
        minValue = math.min(minValue, other.minValue)
      }
      this
    }
  }
```

:::

## 前提知識

- 分散を別々に集計してまとめられれば、大量のデータを分けて並列に処理できます。
- 2 つの集まりの平均は、個数で重みをつけた平均で求まります。たとえば個数 3 の平均 2 と、個数 1 の平均 6 をまとめると、`(2*3 + 6*1) / 4 = 3` です。
- `n` は個数、`mu` は平均、`m2` は平均からのずれの二乗の合計です。
- `other == this` は、同じオブジェクトを自分にまとめる場合です。フィールドを書き換えながら読むと結果が狂うため、コピーを使います。
- 「二乗和の補正」は、2 つの平均がずれているときに、その差の分を加える式です。

## 何をしているか

### 1. 片方が極端に小さいときは、大きい方の平均を基準にする

個数の差が 10 倍以上のときは、大きい方の平均に少しだけ小さい方を混ぜる式を使います。

```scala:line-numbers=72
        if (other.n * 10 < n) {
          mu = mu + (delta * other.n) / (n + other.n)
        } else if (n * 10 < other.n) {
          mu = other.mu - (delta * n) / (n + other.n)
```

たとえば個数 100 万件の平均に、1 件の平均を混ぜる場合、丸めの誤差は大きい方の平均の計算でほとんど出ません。

### 2. 二乗和は、平均のずれの補正を加えて合わせる

2 つの二乗和 `m2` を足し、平均がずれている分を `delta * delta * n * other.n / (n + other.n)` で加えます。この補正がないと、2 つの平均の差が分散に反映されません。

```scala:line-numbers=79
        m2 += other.m2 + (delta * delta * n * other.n) / (n + other.n)
        n += other.n
```

### 3. 最大と最小は、比べて大きい方と小さい方を取る

最大と最小は、比べるだけで正しくなります。

## ここがすごい

- 平均を 1 つの式で求めるのではなく、個数の比率で式を切り替えています。大きい方の値が小さい方の影響で動きすぎないようにしています。
- 二乗和の補正は、平均の差の二乗に個数の積を掛けた値なので、統計の定義から導ける式です。経験で決めた値ではありません。
- 自分自身とまとめる場合を、コピーで分けて扱っています。コメントにあるように、フィールドを書き換える順序の罠を避けています。
- `n == 0` の場合は、相手の値をそのまま写すので、空の統計との結合が簡単になります。

## まとめ

- 統計をまとめるときは、個数で重みを付けた平均と、平均のずれの補正を組み合わせます。
- 個数に大きな差があるときは、計算の式を切り替えると精度が保ちやすくなります。
- 自分自身とまとめる場合は、コピーを使って順序の罠を避けます。
