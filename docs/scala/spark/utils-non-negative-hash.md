---
title: "ハッシュ値を、負にならない整数に直す"
description: "Apache Spark の Utils.nonNegativeHash。オブジェクトのハッシュ値を、0 以上の整数にする。null は 0 とし、Int.MinValue だけは絶対値が作れないので 0 として扱う。配列の添字や分散の計算に使う。"
language: scala
project: "Apache Spark"
repo: https://github.com/apache/spark
license: "Apache-2.0"
copyright: "copyright ownership."
commit: "71a1c3f09f1865472a11e22153376a0676db14e1"
file: "core/src/main/scala/org/apache/spark/util/Utils.scala"
lines: [1751, 1762]
format: 2
function: "Utils.nonNegativeHash"
difficulty: 2
tags: [ハッシュ, 防御的プログラミング, 数値計算]
---

## ひとことで

Spark の `Utils.nonNegativeHash` は、どんなオブジェクトのハッシュ値も、0 以上の整数に直して返します。ハッシュ値を配列の添字や、データの振り分けに使うときに、負の値で事故が起きないようにするための関数です。

## コード

::: code-group

```scala:line-numbers=1751 [日本語訳]
  def nonNegativeHash(obj: AnyRef): Int = {

    // 念のための確認です。null は 0 にします。
    if (obj eq null) return 0

    val hash = obj.hashCode
    // math.abs は Int.MinValue に対しては負のままになるので、特別に 0 として扱います。
    val hashAbs = if (Int.MinValue != hash) math.abs(hash) else 0

    // ほかに守るべき場合は、今のところありません。
    hashAbs
  }
```

```scala:line-numbers=1751 [原文]
  def nonNegativeHash(obj: AnyRef): Int = {

    // Required ?
    if (obj eq null) return 0

    val hash = obj.hashCode
    // math.abs fails for Int.MinValue
    val hashAbs = if (Int.MinValue != hash) math.abs(hash) else 0

    // Nothing else to guard against ?
    hashAbs
  }
```

:::

## 前提知識

- ハッシュ値は、`hashCode` が返す `Int` の値です。同じ内容のオブジェクトは同じ値を返すように作られています。
- `Int` は 32 ビットの整数で、範囲は -2147483648 から 2147483647 までです。
- `math.abs(x)` は、`x` の絶対値を返します。ただし `Int.MinValue` の絶対値は、`Int` の範囲に入らないので、負のままになります。
- `obj eq null` は、オブジェクトが `null` かどうかを調べる書き方です。
- `return 0` は、関数の途中で値を返して、そこで終わる書き方です。

## 何をしているか

### 1. null なら、0 を返す

`null` にはハッシュ値の計算がそもそもできません。そこで、`null` のときは 0 を返して終わります。

```scala:line-numbers=1753
    // Required ?
    if (obj eq null) return 0
```

### 2. ハッシュ値の絶対値を作る

`hashCode` の値を取り出します。`Int.MinValue` だけは絶対値が作れないので、そのときは 0 にします。それ以外は `math.abs` で、正の値に直します。

```scala:line-numbers=1756
    val hash = obj.hashCode
    // math.abs fails for Int.MinValue
    val hashAbs = if (Int.MinValue != hash) math.abs(hash) else 0
```

### 3. 0 以上の値として返す

作った `hashAbs` は、0 以上の整数です。関数はこの値を返します。

```scala:line-numbers=1760
    // Nothing else to guard against ?
    hashAbs
```

## ここがすごい

- 負になりうる値を、確実に 0 以上に直します。配列の添字に使っても、範囲外の例外が起きません。
- `Int.MinValue` の特別扱いを、1 か所の条件で書いています。境界の値で壊れる、という落とし穴をコメントの通りに守っています。
- `null` を先に返すので、後の計算で `null` を参照しません。防御のための条件が、先頭にまとまっています。
- コメントに「ほかに守るべき場合」を残してあるので、後から条件を足すときの目印になっています。

## まとめ

- ハッシュ値を正の数にするには、絶対値を取りますが、`Int.MinValue` は別に扱います。
- `null` は先に 0 として返すと、後の計算が安全になります。
- 境界の値（最小値など）は、計算の結果が範囲に収まるかを必ず確かめます。
