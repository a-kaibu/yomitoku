---
title: "同じ式を、要素を取るたびに計算し直す無限の反復子"
description: "Scala の Iterator.continually。引数の式を名前渡しで受け取り、要素を取り出すたびに評価し直す。終わりのない反復子を、乱数や時刻の列として使える。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/Iterator.scala"
lines: [1140, 1143]
format: 2
function: "Iterator.continually"
difficulty: 1
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

Scala の `Iterator.continually` は、同じ式を何度でも評価して値を返す、終わりのない反復子を作ります。例えば `Iterator.continually(Random.nextInt())` は、乱数を無限に返す列になります。使うときに必要な分だけ取り出します。

## コード

```scala:line-numbers=1140
  def continually[A](elem: => A): Iterator[A] = new AbstractIterator[A] {
    def hasNext = true
    def next() = elem
  }
```

## 前提知識

- `Iterator` は、要素を先頭から一つずつ取り出す仕組みです。`hasNext` が `true` のあいだ、`next()` で続きを取れます。
- `elem: => A` は、名前渡しの引数です。呼び出されたときに式を評価します。引数の式は、最初に一度だけ評価されるわけではありません。
- `AbstractIterator` は、`hasNext` と `next` を実装すれば使える、反復子の土台となるクラスです。
- `new AbstractIterator[A] { ... }` は、その場で無名のクラスを作る書き方です。

## 何をしているか

### 1. 続きが必ずあることを示す

`hasNext` は常に `true` を返します。この反復子には終わりがありません。

```scala:line-numbers=1141
    def hasNext = true
```

### 2. 次の要素を、そのたびに式で作る

`next()` は、名前渡しの `elem` を評価して、その結果を返します。呼ぶたびに式が計算されるので、同じ値が返るとは限りません。

```scala:line-numbers=1142
    def next() = elem
```

## ここがすごい

- 名前渡しなので、式は使われるたびに評価されます。乱数や現在時刻のように、呼ぶたびに値が変わるものを、そのまま列にできます。
- 「終わりのない列」を、`hasNext` が常に `true` という一行で表しています。
- 必要な分だけ `take` などで取り出すので、無限でも困りません。
- 配列に全部を溜めずに済むので、メモリを使いません。

## まとめ

- `continually` は、式を要素を取るたびに計算する、無限の反復子を作ります。
- 名前渡しで式を受け取るため、値は毎回新しく作られます。
- 必要な分だけ `take` で取り出せば、無限の列も安全に使えます。
