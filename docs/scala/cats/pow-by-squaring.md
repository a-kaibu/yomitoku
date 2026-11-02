---
title: "2 乗を繰り返して、累乗を速く求める"
description: "Cats の algebra にある StaticMethods.pow。指数を 2 進数として読み、2 乗を重ねながら掛けるので、指数が大きくても掛け算の回数が対数に比例する。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Cats Contributors."
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "algebra-core/src/main/scala/algebra/instances/StaticMethods.scala"
lines: [34, 47]
format: 2
function: "StaticMethods.pow"
difficulty: 2
tags: [アルゴリズム, 再帰, 数値計算]
---

## ひとことで

Cats の代数（algebra）の部品にある `pow` は、`Long` の累乗を計算します。`base` を `exponent` 回掛けるのではなく、2 乗を繰り返しながら必要なところだけ掛けていきます。指数が大きくても、掛け算の回数は指数の 2 進数の桁数くらいで済みます。

## コード

```scala:line-numbers=34
  final def pow(base: Long, exponent: Long): Long = {
    @tailrec def loop(t: Long, b: Long, e: Long): Long =
      if (e == 0L) t
      else if ((e & 1) == 1) loop(t * b, b * b, e >>> 1L)
      else loop(t, b * b, e >>> 1L)

    if (exponent >= 0L) loop(1L, base, exponent)
    else {
      if (base == 0L) throw new ArithmeticException("zero can't be raised to negative power")
      else if (base == 1L) 1L
      else if (base == -1L) if ((exponent & 1L) == 0L) -1L else 1L
      else 0L
    }
  }
```

## 前提知識

- 累乗 `base^exponent` は、`base` を `exponent` 回掛けた値です。素直に掛けると、指数が大きいときに時間がかかります。
- 2 進数では、指数は「2 のべき乗の和」として表せます。たとえば 13 は 8 + 4 + 1 です。
- `e & 1` は、最下位ビットを取り出す計算です。1 なら、今の桁は立っています。
- `e >>> 1L` は、指数を 1 ビット右にずらして、次の桁へ進みます。
- `@tailrec` は、末尾の再帰をループに変えることをコンパイラに確かめさせる注釈です。

## 何をしているか

### 1. 最下位の桁が立っていれば、結果に掛ける

`loop` は、結果 `t`、今の底 `b`、残りの指数 `e` の 3 つを持ちます。`e` の最下位ビットが 1 なら、今の `b` を結果 `t` に掛けます。

```scala:line-numbers=37
      else if ((e & 1) == 1) loop(t * b, b * b, e >>> 1L)
```

### 2. 底は毎回 2 乗しておく

どちらの場合でも、底 `b` は `b * b` で 2 乗されます。次の桁では、2 乗した底を使うからです。たとえば 2^13 では、2, 4, 16, 256 の順に底が変わり、必要な桁だけ結果に掛かります。

```scala:line-numbers=38
      else loop(t, b * b, e >>> 1L)
```

### 3. 指数が 0 になったら終わり

指数が 0 になれば、残りの桁はすべて処理済みなので、結果 `t` を返します。

```scala:line-numbers=36
      if (e == 0L) t
```

## ここがすごい

- 掛け算の回数は、指数の桁数に比例します。指数が 10 億でも、30 回程度の掛け算で済みます。
- 途中の結果が大きくなりすぎても、`Long` の範囲で溢れるだけで、計算はそのまま続きます。コメントにあるように、溢れは仕様として受け入れています。
- 負の指数の場合は、底が 0 なら例外、1 と -1 なら特別な値を返します。ほかの場合は、整数では 1 より小さいので 0 になります。
- 末尾再帰として書いているので、指数の桁数が増えてもスタックは増えません。

## まとめ

- 累乗は、指数を 2 進数として読み、2 乗を繰り返すと速く求められます。
- 桁の立っているところだけ掛けると、掛け算の回数を大きく減らせます。
- 整数の計算では、溢れや特別な底の扱いを明確に決めておくと安全です。
