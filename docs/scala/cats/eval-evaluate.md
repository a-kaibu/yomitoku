---
title: "スタックを使わずに遅延計算を実行するループ"
description: "Cats の Eval は、深い再帰でもスタックオーバーフローしない。明示的な関数のスタックを持つループで、遅延した計算を 1 段ずつ安全に評価している。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Eval.scala"
lines: [431, 487]
format: 2
function: "Eval.evaluate"
difficulty: 3
tags: [遅延評価, 再帰, 関数型, コンパイラ]
---

## ひとことで

Cats の `Eval` は、計算を「いつ実行するか」を後ろに回せる型です。その計算を実行する `evaluate` は、深く入れ子になった `flatMap` でも JVM のスタックを使い切らないように、自分で関数のスタックを持ちながら、末尾再帰のループで進みます。

## コード

::: code-group

```scala:line-numbers=431 [日本語訳]
  private def evaluate[A](e: Eval[A]): A = {
    def addToMemo[A1](m: Memoize[A1]): A1 => Eval[A1] = { (a: A1) =>
      m.result = Some(a)
      Now(a)
    }

    @tailrec def loop[A1](curr: Eval[A1], fs: FnStack[A1, A]): A =
      curr match {
        case c: FlatMap[A1] =>
          c.start() match {
            case cc: FlatMap[c.Start] =>
              val nextFs = Many(c.run, fs)
              loop(cc.start(), Many(cc.run, nextFs))
            case call: Defer[c.Start] =>
              // flatMap は defer(x).flatMap(f) を扱うとき、
              // Defer を取り除いて、Defer を入れ子にできるので、
              // そのため defer(defer(x)).flatMap(f) は c.start() が
              // Defer を返す場合を意味します。ここでその Defer を処理します。
              loop(call.thunk(), Many(c.run, fs))
            case mm @ Memoize(eval) =>
              mm.result match {
                case Some(a) =>
                  loop(c.run(a), fs)
                case None =>
                  val nextFs = Many(c.run, fs)
                  loop(eval, Many(addToMemo(mm), nextFs))
              }
            case xx: Leaf[c.Start] =>
              // xx は Now、Later、Always のいずれかです。
              // いずれも安全に .value を取れます。
              loop(c.run(xx.value), fs)
          }
        case call: Defer[A1] =>
          loop(call.thunk(), fs)
        case m: Memoize[a] =>
          // a <:< A1
          m.result match {
            case Some(a) =>
              fs match {
                case Many(f, fs) => loop(f(a), fs)
                case Ident(ev)   => ev(a)
              }
            case None =>
              loop[a](m.eval, Many[a, A1, A](addToMemo[a](m), fs))
          }
        case x: Leaf[A1] =>
          // Now、Later、Always には再帰がないので、
          // 安全に .value を取れます。
          val a1 = x.value
          fs match {
            case Many(f, fs) => loop(f(a1), fs)
            case Ident(ev)   => ev(a1)
          }
      }

    loop(e, Ident(implicitly[A <:< A]))
  }
```

```scala:line-numbers=431 [原文]
  private def evaluate[A](e: Eval[A]): A = {
    def addToMemo[A1](m: Memoize[A1]): A1 => Eval[A1] = { (a: A1) =>
      m.result = Some(a)
      Now(a)
    }

    @tailrec def loop[A1](curr: Eval[A1], fs: FnStack[A1, A]): A =
      curr match {
        case c: FlatMap[A1] =>
          c.start() match {
            case cc: FlatMap[c.Start] =>
              val nextFs = Many(c.run, fs)
              loop(cc.start(), Many(cc.run, nextFs))
            case call: Defer[c.Start] =>
              // though the flatMap method handles defer(x).flatMap(f)
              // by removing the Defer, we can nest defers,
              // so defer(defer(x)).flatMap(f) could mean c.start()
              // returns a Defer. We have to handle it here
              loop(call.thunk(), Many(c.run, fs))
            case mm @ Memoize(eval) =>
              mm.result match {
                case Some(a) =>
                  loop(c.run(a), fs)
                case None =>
                  val nextFs = Many(c.run, fs)
                  loop(eval, Many(addToMemo(mm), nextFs))
              }
            case xx: Leaf[c.Start] =>
              // xx must be Now, Later, Always, all of those
              // have safe .value:
              loop(c.run(xx.value), fs)
          }
        case call: Defer[A1] =>
          loop(call.thunk(), fs)
        case m: Memoize[a] =>
          // a <:< A1
          m.result match {
            case Some(a) =>
              fs match {
                case Many(f, fs) => loop(f(a), fs)
                case Ident(ev)   => ev(a)
              }
            case None =>
              loop[a](m.eval, Many[a, A1, A](addToMemo[a](m), fs))
          }
        case x: Leaf[A1] =>
          // Now, Later or Always don't have recursions
          // so they have safe .value:
          val a1 = x.value
          fs match {
            case Many(f, fs) => loop(f(a1), fs)
            case Ident(ev)   => ev(a1)
          }
      }

    loop(e, Ident(implicitly[A <:< A]))
  }
```

:::

## 前提知識

- `Eval[A]` は「値 A を後で計算する箱」です。`Eval.now` は今すぐ、`Eval.later` は必要になったとき 1 回だけ、`Eval.always` は必要になるたびに計算します。
- `flatMap` は「計算の結果を使って、次の計算を作る」操作です。何回も入れ子にすると、普通の再帰呼び出しでは JVM のスタックが足りなくなります。
- `@tailrec` は、関数の最後の呼び出しが自分自身であることをコンパイラに確かめさせる注釈です。末尾再帰は、ループに変換されてスタックを増やしません。
- `FnStack` は、「あとで実行する関数」を積んでおく自前のリストです。普通の関数呼び出しのスタックの代わりに使います。
- `Memoize` は結果を一度だけ計算して覚えておく計算です。

## 何をしているか

### 1. flatMap を見つけたら、続きを自分のスタックに積む

`FlatMap` の場合、まず `start()` で最初の計算を取り出します。そして、続きの関数 `c.run` を `Many` として `fs` に積んでから、次のループに進みます。

```scala:line-numbers=439
        case c: FlatMap[A1] =>
          c.start() match {
            case cc: FlatMap[c.Start] =>
              val nextFs = Many(c.run, fs)
              loop(cc.start(), Many(cc.run, nextFs))
```

Java の関数呼び出しのように「戻る場所」をスタックに持つのではなく、`fs` という値として持ち歩くのがポイントです。`loop` は自分自身を末尾で呼ぶだけなので、深さが増えてもスタックは増えません。

### 2. Defer は中身を取り出して続ける

`Defer` は、まだ計算していない式の箱です。`call.thunk()` で中身を取り出し、同じ `fs` のまま `loop` に渡します。

### 3. 値が手に入ったら、積んだ関数を 1 つずつ使う

`Leaf` の `Now` などは、もう値を持っています。その値を `f(a1)` に渡し、`fs` から次の関数を取り出します。`fs` が空の `Ident` になったら、ループを抜けて答えを返します。

`loop(e, Ident(...))` が最初の呼び出しで、空の `Ident` は「最後まで来た」の目印です。

## ここがすごい

- 通常の再帰で `flatMap` を深くネストすると、JVM のスタックが溢れてしまいます。ここでは、続きの処理を `FnStack` のデータとして持つので、どれだけ深くても JVM のスタックを使いません。
- `Memoize` の結果を `addToMemo` で記録し、2 回目以降は保存された値を使います。同じ `Eval` を何度も使っても、計算は 1 回で済みます。
- 末尾再帰の `loop` は、各分岐で `loop` を呼ぶか、答えを返すかのどちらかです。コンパイラが末尾再帰を確かめてくれるので、ループとして安全に動きます。
- 型の `[a]` や `<:<` を使って、どの型の値が流れてくるかを型で保証しています。実行時の型の食い違いを、実行前にほぼ防いでいます。

## まとめ

- 深い入れ子の計算は、スタックを使わず、データとして続きを持つことで安全に実行できます。
- 末尾再帰をループとして書くと、スタックの心配をせずに済みます。
- 結果を覚える仕組みを組み合わせると、同じ計算を繰り返さずに済みます。
