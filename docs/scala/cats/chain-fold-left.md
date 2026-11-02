---
title: "Chain の要素を、先頭から順に畳み込む"
description: "Cats の Chain.foldLeft。初期値から始めて、Chain の要素を先頭から順に、途中の結果と組み合わせる。内部では Iterator を使い、変数を書き換えながら進める。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/data/Chain.scala"
lines: [237, 242]
format: 2
function: "Chain.foldLeft"
difficulty: 1
tags: [関数型, イテレータ, 標準ライブラリ]
---

## ひとことで

Cats の `Chain` にある `foldLeft` は、要素を先頭から順に 1 つずつ取り出し、途中の結果と組み合わせて、最後に 1 つの値にまとめます。たとえば足し算を渡せば合計が、文字列の連結を渡せばつながった文字列が得られます。

## コード

```scala:line-numbers=237
  final def foldLeft[B](z: B)(f: (B, A) => B): B = {
    var result = z
    val iter = iterator
    while (iter.hasNext) { result = f(result, iter.next()) }
    result
  }
```

## 前提知識

- `foldLeft` は、列を左から畳み込む操作です。初期値 `z` と、途中の結果と要素から次の結果を作る関数 `f` を受け取ります。
- `Chain` は、連結を木の形で持つ型です。木の中身を順に取り出すには、`iterator` が使われます。
- `Iterator` は、要素を 1 つずつ取り出す仕組みです。`hasNext` で続きがあるかを確かめ、`next()` で 1 つ取り出します。
- `var result = z` は、途中の結果を覚えておく変数です。ループの中で値を入れ替えていきます。
- `f(result, iter.next())` の形で、途中の結果と次の要素から新しい結果を作ります。

## 何をしているか

### 1. 途中の結果を、初期値にする

`result` は、畳み込みの途中の結果です。最初は `z`（初期値）を入れます。`iter` は、要素を先頭から取り出す `Iterator` です。

```scala:line-numbers=238
    var result = z
    val iter = iterator
```

### 2. 続きがある間、要素を取り出して結果を更新する

`iter.hasNext` が真の間、`iter.next()` で次の要素を取り出し、`f` で `result` を更新します。ループの本体は 1 行です。

```scala:line-numbers=240
    while (iter.hasNext) { result = f(result, iter.next()) }
```

### 3. 最後の結果を返す

要素を取り終わったら、`result` が畳み込みの結果です。それを返します。

```scala:line-numbers=241
    result
```

## ここがすごい

- `Chain` の木の形を気にせず、`iterator` に任せて先頭から順に取り出します。木の作りが複雑でも、この関数は変わりません。
- 途中の結果を 1 つの変数で持つので、中間のリストや配列を作りません。
- 関数を渡すだけで、合計、最大値、連結など、いろいろな畳み込みが同じ形で書けます。
- 結果の型 `B` は要素の型と違っても構いません。要素の並びから、数や文字列を作れます。

## まとめ

- 畳み込みは、初期値と、途中の結果を更新する関数の組で書きます。
- 木の形のデータも、`Iterator` に任せると、先頭から順に畳み込めます。
- 途中の結果を変数で持つと、余分な領域を使わずに済みます。
