---
title: "同じ値を n 回つなぐのを、2 進法で速く求める"
description: "Cats の Semigroup.repeatedCombineN。同じ値を n 回結合するとき、結合の結果を 2 倍ずつ重ねて、必要な分だけ結合する。結合の回数が n ではなく log n に比例する。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "kernel/src/main/scala/cats/kernel/Semigroup.scala"
lines: [77, 85]
format: 2
function: "Semigroup.repeatedCombineN"
difficulty: 3
tags: [アルゴリズム, 関数型, 再帰]
---

## ひとことで

Cats の `Semigroup`（結合できる型の約束）にある `repeatedCombineN` は、ある値 `a` を `n` 回つないだ結果を求めます。`n` 回そのまま結合する代わりに、`a` 同士を結合して 2 倍ずつ大きくし、`n` の 2 進数の桁に合わせて必要なものだけを足していきます。

## コード

```scala:line-numbers=77
  protected[this] def repeatedCombineN(a: A, n: Int): A = {
    @tailrec def loop(b: A, k: Int, extra: A): A =
      if (k == 1) combine(b, extra)
      else {
        val x = if ((k & 1) == 1) combine(b, extra) else extra
        loop(combine(b, b), k >>> 1, x)
      }
    if (n == 1) a else loop(a, n - 1, a)
  }
```

## 前提知識

- `Semigroup` は、2 つの値を結合する `combine` を持つ型の約束です。文字列の連結や数の足し算がその例です。
- 結合則（`combine(combine(a, b), c)` と `combine(a, combine(b, c))` が同じ）が成り立つ型では、結合の順番を変えて計算しても結果は同じです。
- `a` を 2 回結合すると `a + a`、4 回なら `(a + a) + (a + a)` のように、2 倍ずつ増やせます。
- `k >>> 1` は、`k` を 2 進数で 1 桁ずらす操作です。`(k & 1) == 1` は、今の桁が立っているかを表します。
- `@tailrec` は、末尾の再帰をループに変えることをコンパイラに確かめさせる注釈です。

## 何をしているか

### 1. 最初の値を、今の桁の結果に取っておく

`loop` は、今の `b`（2 倍ずつ大きくした値）、残りの回数 `k`、途中の答え `extra` を持ちます。`k` の最下位ビットが 1 なら、今の `b` を `extra` に結合します。

```scala:line-numbers=81
        val x = if ((k & 1) == 1) combine(b, extra) else extra
```

### 2. 2 倍に育てて、回数を半分にする

次の段では、`b` 同士を結合して 2 倍にし、回数 `k` を 1 桁右にずらします。これで、2 進数の次の桁へ進めます。

```scala:line-numbers=82
        loop(combine(b, b), k >>> 1, x)
```

### 3. 残り 1 回になったら、最後に結合する

`k` が 1 になったら、今の `b` を `extra` に結合して終わります。`repeatedCombineN` は、最初に `loop(a, n - 1, a)` を呼ぶので、`a` を 1 つ分先に持った形から始まります。

```scala:line-numbers=79
      if (k == 1) combine(b, extra)
```

## ここがすごい

- 結合の回数は、おおよそ `2 * log2(n)` で済みます。`n` が 100 万でも、結合は数十回です。
- 途中の答え `extra` を持ち回るので、同じ値を何度も作り直しません。2 進数の桁ごとに、必要なものだけを足していきます。
- `n == 1` の場合は、そのまま `a` を返して、無駄な計算を避けています。
- 結合則を使っているので、結合の順番を変えても正しい値になります。この前提が、この高速化の根拠です。

## まとめ

- 同じ値を n 回結合するには、2 倍ずつ育てる方法が使えます。
- 回数を 2 進数で読むと、必要な結合だけを選べます。
- 結合則が成り立つ型なら、結合の順番を組み替えても安全です。
