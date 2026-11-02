---
title: "null を「値なし」に使い、余計な箱に包まずに既定値を返す"
description: "Apache Pekko の OptionVal.getOrElse。OptionVal は Option と同じ役割を、null で表す値クラス。値が null なら既定値を返し、そうでなければ値をそのまま返す。Some の箱を作らないので、メモリの割り当てがない。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2016-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/OptionVal.scala"
lines: [66, 67]
format: 2
function: "OptionVal.getOrElse"
difficulty: 2
tags: [設計パターン, メモリ管理, 型システム]
---

## ひとことで

Apache Pekko の `OptionVal` は、`Option` と似た「値があるかもしれない」型です。違うのは、`Some` の箱を作らないことです。値がない状態を `null` で表します。`getOrElse` は、値があればその値を、なければ既定の値を返します。

## コード

```scala:line-numbers=66
  def getOrElse[B >: A](default: B): B =
    if (x == null) default else x
```

## 前提知識

- `Option` は、`Some(x)` や `None` のように、値を箱に包んで表す型です。箱を作るたびに、メモリの割り当てが起きます。
- `null` は、参照型で値がないことを表す特別な値です。
- `x == null` は、中身が `null` かを調べる比較です。
- `B >: A` は、既定値の型 `B` が元の型 `A` 以上であることを表す制約です。結果の型を広げられます。
- 値クラス（value class）は、実行時に箱を作らず、中の値だけで扱えるようにした型です。`OptionVal` は、この考え方で作られています。

## 何をしているか

### 1. 中身が null なら、既定値を返す

`x == null` のとき、つまり値がないときは、`default` をそのまま返します。

```scala:line-numbers=67
    if (x == null) default else x
```

### 2. 値があれば、その値を返す

`null` でなければ、中身 `x` をそのまま返します。`Some` の箱を経由しないので、取り出すための処理がいりません。

```scala:line-numbers=67
    if (x == null) default else x
```

## ここがすごい

- 値がある場合でも、`Some` の箱を作らないので、メモリの割り当てが起きません。大量の値を扱うときに効果があります。
- 判定は `null` と比べるだけなので、1 回の比較で終わります。
- 既定値は、`getOrElse` の引数として先に渡されるので、値がある場合でも既定値を使う手前で計算は済んでいます。引数の計算が重いときは注意が必要です。
- `OptionVal` は値クラスなので、`Option` と同じ使い方で、箱の分だけ速さとメモリを節約できます。

## まとめ

- 値がないことを `null` で表すと、箱を作らずに値の有無を扱えます。
- 既定値の処理は、型の制約で結果の型を広げると、柔軟に書けます。
- 箱を作らない型は、高い頻度で呼ばれる場所で、メモリと速さを節約できます。
