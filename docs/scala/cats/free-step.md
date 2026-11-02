---
title: "入れ子になった flatMap を、右寄りに組み直す"
description: "Cats の Free.step。左に入れ子になった flatMap を再結合して、1 回の評価で必要な層だけを取り出す。末尾再帰で、深い左ネストでもスタックを使わない。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "free/src/main/scala/cats/free/Free.scala"
lines: [73, 80]
format: 2
function: "Free.step"
difficulty: 3
tags: [関数型, 遅延評価, 再帰]
---

## ひとことで

Cats の `Free` は、命令を並べた計算を、あとで別の実行方法で解釈するための型です。`step` は、その計算を 1 段だけ進めます。その際、左に入れ子になった `flatMap` を、右に寄った形に組み直してから、次の層を取り出します。

## コード

```scala:line-numbers=73
  @tailrec
  final def step: Free[S, A] =
    this match {
      case FlatMapped(FlatMapped(c, f), g) => c.flatMap(cc => f(cc).flatMap(g)).step
      case FlatMapped(Pure(a), f)          => f(a).step
      case x                               => x
    }

```

## 前提知識

- `Free[S, A]` は、命令の型 `S` を使った計算を表す型です。`Pure(a)` は値、`Suspend` は命令、`FlatMapped` は「計算のあとに関数を当てる」形です。
- `flatMap` は、計算の結果を使って次の計算を作る操作です。`(a.flatMap(f)).flatMap(g)` のように左に入れ子になると、評価が深くなります。
- 結合法則により、`(a.flatMap(f)).flatMap(g)` は `a.flatMap(x => f(x).flatMap(g))` と同じ結果になります。
- `case x => x` は、ほかの場合にはそのまま返すパターンです。
- `@tailrec` は、末尾の再帰をループに変えることをコンパイラに確かめさせる注釈です。

## 何をしているか

### 1. 左に入れ子の flatMap を、右寄りに組み直す

最初の分岐は、`FlatMapped(FlatMapped(c, f), g)` の形を見つけたときです。結合法則を使って、`c.flatMap(cc => f(cc).flatMap(g))` に組み直し、もう一度 `step` を呼びます。

```scala:line-numbers=76
      case FlatMapped(FlatMapped(c, f), g) => c.flatMap(cc => f(cc).flatMap(g)).step
```

組み直すと、入れ子が 1 段減ります。この処理を繰り返すと、左側の深い入れ子が右寄りの形になります。

### 2. Pure に当たったら、続きを直接実行する

`FlatMapped(Pure(a), f)` の形は、値が既に分かっているので、`f(a)` を直接計算して、その結果に `step` を当てます。

```scala:line-numbers=77
      case FlatMapped(Pure(a), f)          => f(a).step
```

### 3. それ以外は、そのまま返す

`Suspend` や `Pure` のような、これ以上進めない形は、そのまま返します。

## ここがすごい

- 左の入れ子をそのままたどると、計算の深さだけ再帰が必要になります。結合法則で組み直すと、1 段ずつ平らにできます。
- 関数 `step` は 1 段進めるだけなので、呼び出し側は必要なだけ繰り返せます。途中で止めることも、全部進めることもできます。
- 末尾の再帰は `@tailrec` でループになるので、入れ子が深くてもスタックを増やしません。
- 組み直しを `step` の中に閉じ込めているので、解釈の方法（`foldMap` など）から独立して使えます。

## まとめ

- 左に入れ子になった `flatMap` は、結合法則で右寄りに組み直せます。
- 計算を 1 段ずつ進める関数にすると、必要な分だけ評価できます。
- 末尾再帰で書くと、深い計算でも安全です。
