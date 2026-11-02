---
title: "遅らせた計算を一度だけ行い、その後は結果を使い回す"
description: "Cats の Eval.Later の value。最初に呼ばれたときだけ計算し、結果を覚える lazy val。計算が済んだら、元の関数（thunk）を null にして、そこで捕まえていた大きなデータを解放する。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Eval.scala"
lines: [200, 204]
format: 2
function: "Later.value"
difficulty: 3
tags: [遅延評価, メモリ管理, 関数型]
---

## ひとことで

Cats の `Eval` には、計算を遅らせて、必要になったときに 1 回だけ行う型がいくつかあります。`Later` は、その 1 つです。`value` を最初に読んだときに計算し、結果を覚えます。2 回目以降は、覚えた結果をそのまま返します。

## コード

```scala:line-numbers=200
  lazy val value: A = {
    val result = thunk()
    thunk = null
    result
  }
```

## 前提知識

- 「遅延評価（lazy）」は、値が必要になるまで計算を始めない考え方です。
- `lazy val` は、最初に読まれたときだけ右辺を評価し、その結果をキャッシュする Scala の仕組みです。
- `thunk` は、まだ実行していない計算を包んだ関数です。`Later` のコンストラクタで渡されます。
- クロージャ（関数）は、外側の変数を捕まえて持つことがあります。大きなデータを捕まえた関数は、計算が終わっても、その参照が残るとメモリを占有します。
- `null` を代入すると、そこから参照をなくせるので、ガベージコレクタが大きなデータを回収できます。

## 何をしているか

### 1. 最初に読まれたとき、計算を 1 回だけ行う

`lazy val value` の右辺は、最初に読まれたときに評価されます。`thunk()` を呼んで、結果を `result` に入れます。

```scala:line-numbers=200
  lazy val value: A = {
    val result = thunk()
```

### 2. 計算に使った関数を捨てる

`thunk = null` で、計算に使った関数への参照を消します。関数が捕まえていた大きな値を、以後使わないなら解放できます。

```scala:line-numbers=202
    thunk = null
```

### 3. 結果を返し、以後はその値を使い回す

最後に `result` を返します。`lazy val` なので、次からは評価をやり直さず、この値をそのまま返します。

```scala:line-numbers=203
    result
  }
```

## ここがすごい

- 計算は 1 回しか走らないので、同じ重い処理を何度も繰り返しません。
- 計算が終わったあとで関数への参照を消すので、結果が小さい場合に、元の大きなデータを早めに手放せます。
- `lazy val` の仕組みを使うので、スレッドの安全性も言語の機能に任せられます。
- コメントにあるように、計算の結果が小さく、関数が大きいときに役立つ作りです。逆に、結果が大きいときは `Always` を使う、という使い分けも示されています。

## まとめ

- 1 回だけ計算して結果を使い回すには、`lazy val` を使うと簡単です。
- 計算が済んだら、捕まえていた参照を消すと、メモリを早く返せます。
- 遅延と即時の型を使い分けると、速さとメモリの両方を保てます。
