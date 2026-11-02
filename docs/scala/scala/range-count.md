---
title: "範囲の要素数を、符号とオーバーフローに気をつけて数える"
description: "Scala の Range.count。開始・終了・刻み幅から要素数を求める。符号のビット操作で絶対値を作り、符号なしの割り算で溢れを防ぐ。要素数が 2^32 個のときの特別な扱いも含む。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/immutable/Range.scala"
lines: [588, 613]
format: 2
function: "Range.count"
difficulty: 3
tags: [数値計算, ビット演算, 標準ライブラリ]
---

## ひとことで

Scala の `Range` で、開始・終了・刻み幅から要素数を数える `count` です。`1 to 10` のような範囲の個数を、ループを回さずに求めます。符号を扱うビット操作と、符号なしの割り算を組み合わせて、負の刻み幅や `Int` の端の値でも正しく数えられるようにしています。

## コード

::: code-group

```scala:line-numbers=588 [日本語訳]
  def count(start: Int, end: Int, step: Int, isInclusive: Boolean): Int = {
    if (step == 0)
      throw new IllegalArgumentException("step cannot be 0.")

    val isEmpty =
      if (start == end) !isInclusive
      else if (start < end) step < 0
      else step > 0

    if (isEmpty) 0
    else {
      val stepSign = step >> 31 // step が 0 以上なら 0、負なら -1 になる値です。
      val gap = ((end - start) ^ stepSign) - stepSign // step が 0 以上なら (end - start)、負なら -(end - start) です。
      val absStep = (step ^ stepSign) - stepSign // step が 0 以上なら step、負なら -step です。

      val div = Integer.divideUnsigned(gap, absStep)
      if (isInclusive) {
        if (div == -1) // 符号なしの int の最大値
          -1 // 特別な場合です。要素が 2^32 個あると、結果は 0 に溢れてしまうため。
        else
          div + 1
      } else {
        if (absStep * div != gap) div + 1 else div
      }
    }
  }
```

```scala:line-numbers=588 [原文]
  def count(start: Int, end: Int, step: Int, isInclusive: Boolean): Int = {
    if (step == 0)
      throw new IllegalArgumentException("step cannot be 0.")

    val isEmpty =
      if (start == end) !isInclusive
      else if (start < end) step < 0
      else step > 0

    if (isEmpty) 0
    else {
      val stepSign = step >> 31 // if (step >= 0) 0 else -1
      val gap = ((end - start) ^ stepSign) - stepSign // if (step >= 0) (end - start) else -(end - start)
      val absStep = (step ^ stepSign) - stepSign // if (step >= 0) step else -step

      val div = Integer.divideUnsigned(gap, absStep)
      if (isInclusive) {
        if (div == -1) // max unsigned int
          -1 // corner case: there are 2^32 elements, which would overflow to 0
        else
          div + 1
      } else {
        if (absStep * div != gap) div + 1 else div
      }
    }
  }
```

:::

## 前提知識

- `Range` は、開始、終了、刻み幅で決まる整数の並びです。`isInclusive` は、終了の値を含むかどうかを表します。
- 「空」の範囲は、開始が終了より後ろにあるなど、要素が 1 つもない範囲です。
- `>> 31` は、32 ビットの符号ビットを全部の桁にコピーする算術シフトです。正なら 0、負なら -1 になります。
- `(x ^ s) - s` は、符号 `s` が -1 のときに値を反転させ、0 のときはそのままにする、絶対値の定番の書き方です。
- `Integer.divideUnsigned` は、`Int` を符号なしとして割る Java の関数です。大きな差でも正しく割れます。

## 何をしているか

### 1. 空の範囲は、0 で返す

まず、開始と終了の位置関係と刻み幅の符号から、範囲が空かどうかを判定します。空なら 0 を返します。

```scala:line-numbers=597
    if (isEmpty) 0
```

### 2. 符号のビット操作で、差と刻み幅の絶対値を作る

符号を表す `stepSign` を作り、差 `gap` と刻み幅の絶対値 `absStep` を、符号に応じた向きに揃えます。

```scala:line-numbers=599
      val stepSign = step >> 31 // if (step >= 0) 0 else -1
      val gap = ((end - start) ^ stepSign) - stepSign // if (step >= 0) (end - start) else -(end - start)
      val absStep = (step ^ stepSign) - stepSign // if (step >= 0) step else -step
```

`if` を使わずに絶対値を作れるので、分岐が減ります。

### 3. 符号なしの割り算で要素数を求める

`div` は、差を刻み幅で符号なしに割った値です。閉区間では `div + 1` が要素数になります。ただし、要素が 2^32 個のとき、結果は `-1` になるので、特別に扱います。

```scala:line-numbers=603
      val div = Integer.divideUnsigned(gap, absStep)
```

```scala:line-numbers=611
      }
```

開区間では、割り切れなければ `div + 1`、割り切れれば `div` にします。

## ここがすごい

- 符号の処理を、ビット演算の定番の式だけで行っています。`if` で正負を分けるより、短く速い書き方です。
- 差を符号なしで割るので、`Int` の端から端までの範囲でも、差が溢れずに正しく割れます。
- 要素数が 2^32 のときの `-1` は、「範囲が大きすぎて `Int` に入らない」を表す合図です。コメントで理由が説明されています。
- 開区間と閉区間の計算を、最後の 1 つの `if` で分けているので、同じ式を 2 回書かずに済みます。

## まとめ

- 範囲の要素数は、差を刻み幅で割ると求まります。
- 符号の処理は、ビット演算で `if` なしに書けます。
- `Int` の端では、符号なしの割り算とオーバーフローの扱いに気をつけます。
