---
title: "負の数を割った余りを、常に 0 以上にする"
description: "Apache Spark の Utils.nonNegativeMod。Scala の % は負の数の余りを負にするので、割る数を足して 0 以上の余りに直す。ハッシュ値などを配列の添字にするときに使う。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/Utils.scala"
lines: [1743, 1746]
format: 2
function: "Utils.nonNegativeMod"
difficulty: 1
tags: [数値計算, ハッシュ, 防御的プログラミング]
---

## ひとことで

Spark の `Utils` にある `nonNegativeMod` は、`x` を `mod` で割った余りを、必ず 0 以上で返します。Scala や Java の `%` は、`x` が負のとき余りも負になります。ハッシュ値を配列の添字に使うときは、その違いが大きな問題になるので、この関数で直します。

## コード

```scala:line-numbers=1743
  def nonNegativeMod(x: Int, mod: Int): Int = {
    val rawMod = x % mod
    rawMod + (if (rawMod < 0) mod else 0)
  }
```

## 前提知識

- 割り算の余り（剰余）は、`x % mod` で求めます。`7 % 3` は 1 です。
- Scala と Java の `%` は、割られる数（`x`）の符号に余りの符号を合わせます。たとえば `-7 % 3` は -1 になります。
- 配列の添字は 0 以上でなければなりません。負の余りをそのまま使うと、範囲外の添字で例外が起きます。
- `if (rawMod < 0) mod else 0` は、余りが負のときだけ `mod` を足す条件式です。

## 何をしているか

### 1. まず、普通の余りを求める

`rawMod` は、`x % mod` の結果です。負の `x` からは負の値が出ることがあります。

```scala:line-numbers=1744
    val rawMod = x % mod
```

### 2. 負なら、割る数を足して正の範囲に直す

`rawMod` が負のときだけ `mod` を足します。負の余りに `mod` を足すと、0 以上 `mod` 未満の値になります。`-1` は `3 - 1 = 2` になります。

```scala:line-numbers=1745
    rawMod + (if (rawMod < 0) mod else 0)
```

### 3. 0 以上の余りとして返す

正の余りなら、足す値は 0 なので、そのまま返します。結果は必ず 0 から `mod - 1` までの値です。

## ここがすごい

- 条件式を 1 つ書くだけで、`%` の符号の仕様を吸収しています。呼び出し側は、結果が負になることを心配しなくて済みます。
- 余りが負のときだけ足すので、正の値の場合は余計な計算がありません。
- 1 行の式で、分岐を値の計算に変えています。`if` が値を返す Scala の性質を生かした書き方です。
- ハッシュ値の `Int.MinValue` の絶対値は負のままになる問題がありますが、この関数は `%` を使うので、そのまま安全に扱えます。

## まとめ

- 負の値を正の範囲に収めるには、余りが負のときだけ割る数を足します。
- `%` の符号は言語の仕様なので、ハッシュの添字に使うときは必ず直します。
- 結果の範囲（0 から mod − 1）を確かめておくと、配列の添字として安心して使えます。
