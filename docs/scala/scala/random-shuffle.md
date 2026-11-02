---
title: "Fisher-Yates で、全部の並びを同じ確率で混ぜる"
description: "Scala の Random.shuffle。末尾から 1 つずつ、残りの範囲からランダムに選んだ要素と入れ替える。どの並びも同じ確率で出るように作る、古典的な混ぜ方。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/util/Random.scala"
lines: [225, 240]
format: 2
function: "Random.shuffle"
difficulty: 2
tags: [乱数, アルゴリズム, 標準ライブラリ]
---

## ひとことで

Scala の `Random.shuffle` は、コレクションの要素をランダムに並べ替えて、新しいコレクションを返します。内部では Fisher-Yates と呼ばれる方法を使い、末尾から順に、残りの中からランダムに 1 つ選んで入れ替えます。どの並びも同じ確率で出るように作られています。

## コード

```scala:line-numbers=225
  def shuffle[T, C](xs: IterableOnce[T])(implicit bf: BuildFrom[xs.type, T, C]): C = {
    val buf = new ArrayBuffer[T] ++= xs

    def swap(i1: Int, i2: Int): Unit = {
      val tmp = buf(i1)
      buf(i1) = buf(i2)
      buf(i2) = tmp
    }

    for (n <- buf.length to 2 by -1) {
      val k = nextInt(n)
      swap(n - 1, k)
    }

    (bf.newBuilder(xs) ++= buf).result()
  }
```

## 前提知識

- 「一様に混ぜる」とは、全部の並び順が同じ確率で出ることです。適当に何回か入れ替えるだけでは、この性質は得られません。
- `nextInt(n)` は、0 以上 n 未満の整数をランダムに返します。
- `ArrayBuffer` は伸び縮みできる配列です。`++=` は、後ろに要素をまとめて追加します。
- `buf.length to 2 by -1` は、大きい数から 2 まで 1 ずつ減らす繰り返しです。
- `BuildFrom` は、同じ種類のコレクションを作るための型クラスです。`List` を渡せば `List` が返ります。

## 何をしているか

### 1. 元の要素を可変の配列にコピーする

最初の行で、受け取ったコレクションを `ArrayBuffer` にコピーします。元のコレクションは変えません。

### 2. 末尾から順に、ランダムな位置と入れ替える

ループでは、残りの要素の数 `n` を使い、0 から `n - 1` の範囲でランダムな位置 `k` を選びます。

```scala:line-numbers=234
    for (n <- buf.length to 2 by -1) {
      val k = nextInt(n)
      swap(n - 1, k)
    }
```

`n - 1` の位置（残りの末尾）と `k` の位置を入れ替えます。末尾を確定させてから、次は 1 つ小さい範囲で同じことをします。

### 3. 結果を元と同じ種類のコレクションにする

最後に、混ぜた `buf` を `bf.newBuilder` で元の型のビルダーに入れて、結果を返します。

## ここがすごい

- 各ステップで、残りの範囲から等しい確率で 1 つを選ぶので、最後にはどの並びも同じ確率になります。Fisher-Yates は、この性質を証明できる方法として知られています。
- 時間計算量は要素数に比例する `O(n)` です。並べ替えのように比較を使わず、乱数と入れ替えだけで済みます。
- 入れ替えは配列の中で行うので、追加のメモリは元の要素数分だけです。
- `BuildFrom` を受け取る作りのおかげで、`List` でも `Vector` でも、同じ関数で型を保って混ぜられます。

## まとめ

- 一様に混ぜるには、末尾から残りの中の 1 つを選んで入れ替える方法が基本です。
- 要素を 1 回ずつ入れ替えるだけなので、速く、書くのも簡単です。
- 型を保つ仕組みを使うと、同じ関数を色々なコレクションに使えます。
