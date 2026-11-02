---
title: "状態を一つずつ進めながら、要素を作り出す"
description: "Scala の Iterator.unfold。初期の状態から、f が Some((要素, 次の状態)) を返すあいだ要素を作り続け、None で終わる。結果を先に全部作らず、必要な分だけ計算する。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/Iterator.scala"
lines: [1285, 1298]
format: 2
function: "Iterator.unfold"
difficulty: 3
tags: [イテレータ, 遅延評価, 関数型]
---

## ひとことで

Scala の `Iterator.unfold` は、「状態」から要素を一つずつ作り出す反復子を作ります。初期の状態から始めて、関数が `Some((要素, 次の状態))` を返すあいだ、要素を作り続けます。`None` を返したところで終わります。配列やリストを先に作らず、必要になったときだけ計算します。

## コード

::: code-group

```scala:line-numbers=1285 [日本語訳]
  private final class UnfoldIterator[A, S](init: S)(f: S => Option[(A, S)]) extends AbstractIterator[A] {
    private[this] var state: S = init
    private[this] var nextResult: Option[(A, S)] = null

    override def hasNext: Boolean = {
      if (nextResult eq null) {
        nextResult = {
          val res = f(state)
          if (res eq null) throw new NullPointerException("null during unfold")
          res
        }
        state = null.asInstanceOf[S] // GC が回収できるように、状態への参照を消します。
      }
      nextResult.isDefined
```

```scala:line-numbers=1285 [原文]
  private final class UnfoldIterator[A, S](init: S)(f: S => Option[(A, S)]) extends AbstractIterator[A] {
    private[this] var state: S = init
    private[this] var nextResult: Option[(A, S)] = null

    override def hasNext: Boolean = {
      if (nextResult eq null) {
        nextResult = {
          val res = f(state)
          if (res eq null) throw new NullPointerException("null during unfold")
          res
        }
        state = null.asInstanceOf[S] // allow GC
      }
      nextResult.isDefined
```

:::

## 前提知識

- `Iterator` は、要素を先頭から一つずつ取り出す仕組みです。`hasNext` で続きがあるかを調べ、`next()` で取り出します。
- `Option` の `Some(x)` は値がある状態、`None` は値がない状態を表します。
- `(要素, 次の状態)` は、タプルで二つの値をまとめたものです。
- `f: S => Option[(A, S)]` は、今の状態 `S` を受け取り、要素と次の状態を返す関数です。
- `isDefined` は、`Option` が `Some` なら `true` を返します。

## 何をしているか

### 1. 次の要素を、必要になったときに一度だけ計算する

`hasNext` は、まだ次の結果がなければ、今の状態 `state` で `f` を呼びます。結果は `nextResult` に保存されます。同じ要素を何度 `hasNext` しても、計算は一回だけです。

```scala:line-numbers=1289
    override def hasNext: Boolean = {
      if (nextResult eq null) {
        nextResult = {
          val res = f(state)
          if (res eq null) throw new NullPointerException("null during unfold")
          res
        }
```

### 2. 使い終わった状態を空にして、次の状態へ進む準備をする

結果を取ったら、古い状態 `state` を `null` にします。これで、使い終わった値を GC が回収できるようになります。

```scala:line-numbers=1296
        state = null.asInstanceOf[S] // allow GC
```

### 3. 結果が `Some` かどうかで、続きがあるかを決める

最後に、`nextResult.isDefined` で結果が `Some` かを返します。`None` なら、もう要素はありません。

```scala:line-numbers=1298
      nextResult.isDefined
```

## ここがすごい

- 要素の列を、必要になるまで作りません。大きな列や、終わりがわからない列も、少しずつ作れます。
- `hasNext` の中で結果を一度だけ保存するので、`hasNext` を何回呼んでも、関数 `f` は一回ずつしか呼ばれません。
- 状態を使い終わったら `null` にして、GC に任せるという細かい配慮があります。長く残る参照を作りません。
- 「状態から要素を作る」という形だけで、フィボナッチ数列のような列も書けます。繰り返しの書き方を一つの関数にまとめています。

## まとめ

- `unfold` は、初期の状態と、`Some((要素, 次の状態))` を返す関数から、反復子を作ります。
- 要素は、`hasNext` で必要になったときだけ計算されます。
- 結果を一度だけ保存し、使い終わった状態を捨てることで、無駄な計算と参照を避けています。
