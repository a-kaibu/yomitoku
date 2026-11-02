---
title: "途中の値を持ちながら、要素を先頭から順に畳み込む"
description: "fs2 の Chunk.foldLeft。初期値から始めて、要素を先頭から順に、途中の結果と組み合わせる。ループの中で結果の変数を書き換える、もっとも基本的な畳み込み。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [182, 186]
format: 2
function: "Chunk.foldLeft"
difficulty: 1
tags: [関数型, イテレータ, 標準ライブラリ]
---

## ひとことで

fs2 の `Chunk` にある `foldLeft` は、要素を左（先頭）から順に 1 つずつ取り出し、途中の結果と組み合わせて、最後の 1 つの値にまとめます。たとえば足し算を渡せば、すべての要素の合計になります。

## コード

```scala:line-numbers=182
  def foldLeft[A](init: A)(f: (A, O) => A): A = {
    var res = init
    foreach(o => res = f(res, o))
    res
  }
```

## 前提知識

- 「畳み込み（fold）」は、列の要素を 1 つの値にまとめる操作です。足し算、連結、最大値の計算などが例です。
- 「左から」は、先頭の要素から順に処理することを表します。
- `init` は、畳み込みの最初の値です。足し算なら 0、連結なら空の文字列が使われます。
- `f: (A, O) => A` は、途中の結果と次の要素を受け取り、新しい途中の結果を返す関数です。
- `Chunk` は不変なので、途中の結果は変数 `res` に入れて、ループの中で置き換えていきます。

## 何をしているか

### 1. 途中の結果を、初期値で用意する

`res` は、途中の結果を覚える変数です。最初は `init` を入れておきます。

```scala:line-numbers=183
    var res = init
```

### 2. 要素を順に、途中の結果と組み合わせる

`foreach` で要素 `o` を先頭から順に取り出します。`f(res, o)` で新しい途中の結果を作り、`res` に入れ直します。

```scala:line-numbers=184
    foreach(o => res = f(res, o))
```

### 3. 最後の結果を返す

すべての要素を処理し終わったら、`res` の値が畳み込みの結果です。それを返します。

```scala:line-numbers=185
    res
```

## ここがすごい

- 途中の結果を 1 つの変数で持つだけなので、余分なリストや中間の配列を作りません。
- 関数を渡す形なので、足し算でも、最大値でも、文字列の組み立てでも、同じ骨組みで書けます。
- `foreach` で走査するので、`Chunk` の内部の作りに関係なく、先頭から順に確実に回ります。
- 結果の型 `A` は、要素の型 `O` と違っても構いません。数の列から文字列を作るような処理もできます。

## まとめ

- 列を 1 つの値にまとめるには、初期値と、途中の結果を更新する関数を用意します。
- 中間の結果を変数で持つと、余分な領域を使わずに畳み込めます。
- 足し算や連結などの基本の処理は、この形の組み合わせで書けます。
