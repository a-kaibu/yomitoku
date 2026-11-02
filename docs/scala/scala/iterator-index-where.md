---
title: "先頭から条件を満たす最初の位置を、ループで探す"
description: "Scala 標準ライブラリの Iterator.indexWhere。条件を満たす最初の要素の位置（0 から数える）を返す。見つからなければ -1 を返す。開始位置を指定でき、そこまでは drop で飛ばす。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/Iterator.scala"
lines: [427, 435]
format: 2
function: "Iterator.indexWhere"
difficulty: 1
tags: [イテレータ, 標準ライブラリ, 関数型]
---

## ひとことで

Scala の `Iterator` には、条件を満たす最初の要素の位置を返す `indexWhere` があります。位置は 0 から数えます。見つからなければ -1 を返します。`from` を指定すると、その位置から後ろを探します。

## コード

```scala:line-numbers=427
  def indexWhere(p: A => Boolean, from: Int = 0): Int = {
    var i = math.max(from, 0)
    val dropped = drop(from)
    while (dropped.hasNext) {
      if (p(dropped.next())) return i
      i += 1
    }
    -1
  }
```

## 前提知識

- `Iterator` は、要素を 1 つずつ取り出す仕組みです。取り出した分だけ先へ進み、元に戻ることはありません。
- `p: A => Boolean` は、要素を受け取って、条件を満たすかを真偽値で返す関数です。
- `math.max(from, 0)` は、開始位置が負にならないように、0 と比べて大きい方を取ります。
- `drop(from)` は、先頭から `from` 個の要素を捨てた新しい `Iterator` を返します。
- `return i` は、関数の途中で値を返して、そこで終わる書き方です。

## 何をしているか

### 1. 番号を開始位置で初期化し、読み飛ばす

`i` は、今見ている要素の位置です。負の開始位置は 0 に直します。`drop(from)` で、開始位置より前の要素を捨てた `Iterator` を作ります。

```scala:line-numbers=428
    var i = math.max(from, 0)
    val dropped = drop(from)
```

### 2. 1 つずつ取り出して、条件を調べる

`hasNext` で続きがあるかを調べ、`next()` で要素を 1 つ取り出します。条件 `p` を満たせば、今の番号 `i` を `return` で返して終わります。

```scala:line-numbers=430
    while (dropped.hasNext) {
      if (p(dropped.next())) return i
```

### 3. 満たさなければ、番号を 1 増やして次へ

条件を満たさなければ、番号 `i` を 1 増やして、次の要素へ進みます。

```scala:line-numbers=432
      i += 1
```

### 4. 最後まで無ければ -1

要素が尽きてもどれも条件を満たさなければ、-1 を返します。

```scala:line-numbers=434
    -1
```

## ここがすごい

- 条件を満たした時点で `return` するので、残りの要素は取り出しません。`Iterator` の遅延評価と合わさって、無駄な読み取りが起きません。
- 番号の数え方を、開始位置に合わせて最初に決めています。`from` があっても、同じループで扱えます。
- `drop` で飛ばすので、開始位置より前の要素の条件判定は行いません。
- 見つからない場合を -1 で表すのは、Java の `indexOf` と同じ慣習です。`Option` ではなく整数で返すので、配列の添字と同じように使えます。

## まとめ

- 条件を満たす最初の位置を探すには、番号を数えながら 1 つずつ調べ、見つかった時点で返します。
- 開始位置は `drop` で飛ばしてから探すと、書き方が単純になります。
- 見つからないときの -1 は、添字として使う場面での慣習です。
