---
title: "3 つ組の列を、3 本の列に分ける"
description: "Scala の Iterable.unzip3。要素が 3 つ組（タプル）の列を、1 番目・2 番目・3 番目の要素ごとの 3 つの列に分ける。コピーを作らず、遅延の View で作る。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/Iterable.scala"
lines: [816, 821]
format: 2
function: "Iterable.unzip3"
difficulty: 2
tags: [イテレータ, 標準ライブラリ, 遅延評価]
---

## ひとことで

Scala の `Iterable` には、要素を「分解して 2 本や 3 本の列に分ける」メソッドがあります。`unzip3` は、3 つ組（タプル）の列を、3 本の列にまとめて分けます。例えば `(1, "one", '1')` の列を、数の列、文字列の列、文字の列に分けられます。

## コード

```scala:line-numbers=816
  def unzip3[A1, A2, A3](implicit asTriple: A => (A1, A2, A3)): (CC[A1], CC[A2], CC[A3]) = {
    val first: View[A1] = new View.Map[A, A1](this, asTriple(_)._1)
    val second: View[A2] = new View.Map[A, A2](this, asTriple(_)._2)
    val third: View[A3] = new View.Map[A, A3](this, asTriple(_)._3)
    (iterableFactory.from(first), iterableFactory.from(second), iterableFactory.from(third))
  }
```

## 前提知識

- タプルは、`(1, "one", '1')` のように、型の違う値を決まった数だけまとめた値です。
- `Iterable[A]` は、順番に取り出せる要素の集まりです。`List` や `Vector` も、その一種です。
- `View` は、要素を必要になったときに計算する「遅延の列」です。作った時点では、中身の計算は行われません。
- `asTriple: A => (A1, A2, A3)` は、要素の型 `A` を 3 つ組として見るための変換です。暗黙の引数として渡されます。
- `iterableFactory.from(...)` は、同じ種類の集まり（`List` なら `List`）を作り直す部品です。

## 何をしているか

### 1. 3 つのビューを作る

それぞれのビューは、元の列の各要素を変換して、3 つ組の 1 番目、2 番目、3 番目の値を取り出します。ここでは、まだ値は計算されていません。

```scala:line-numbers=817
    val first: View[A1] = new View.Map[A, A1](this, asTriple(_)._1)
    val second: View[A2] = new View.Map[A, A2](this, asTriple(_)._2)
    val third: View[A3] = new View.Map[A, A3](this, asTriple(_)._3)
```

### 2. 3 つのビューを、同じ種類の集まりに変える

最後に、3 つのビューを `iterableFactory.from` で元と同じ種類の集まりにして、3 つ組で返します。ここで初めて、要素が順番に計算されます。

```scala:line-numbers=820
    (iterableFactory.from(first), iterableFactory.from(second), iterableFactory.from(third))
```

## ここがすごい

- 元の列を一度だけ読み、3 つの列を同時に作れます。元の列を 3 回書き直すコードより、手間が少ないです。
- ビューを使うので、途中の中間の列を作らず、必要な要素だけを順に取り出せます。
- 3 つ組の型は、`asTriple` で型安全に扱われます。要素が 3 つ組でないと、コンパイル時に分かります。
- 2 本に分ける `unzip` と並べると、同じ考え方が 3 本でも使われていることがわかります。

## まとめ

- `unzip3` は、3 つ組の列を 3 本の列に分けます。
- 中身は、3 つのビューを作り、最後に元の種類の集まりに変えるだけです。
- 遅延のビューを使うため、余分な中間データを作りません。
