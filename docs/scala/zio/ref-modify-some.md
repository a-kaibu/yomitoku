---
title: "条件に合うときだけ値を変える、CAS の更新"
description: "ZIO の Ref.Atomic.modifySome。部分関数 pf に合う値のときだけ新しい値に書き換え、合わないときは既定値を返して何も変えない。書き換えの競合は CAS で再試行する。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2017-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Ref.scala"
lines: [408, 418]
format: 2
function: "Ref.Atomic.modifySome"
difficulty: 3
tags: [並行処理, ロック不要, 関数型]
---

## ひとことで

ZIO の `Ref` の `modifySome` は、値が条件（部分関数 `pf`）に合うときだけ書き換える更新です。合わないときは、既定値 `default` を結果として返し、値は変えません。書き換えが他の処理と競合したときは、読み直してやり直す CAS ループで行います。

## コード

```scala:line-numbers=408
        def modifySome[B](default: B)(pf: PartialFunction[A, (B, A)])(implicit unsafe: Unsafe): B = {
          var loop = true
          var b: B = null.asInstanceOf[B]
          while (loop) {
            val current = ref.asInstanceOf[AtomicReference[A]].get
            val tuple   = pf.applyOrElse(current, (_: Any) => (default, current))
            b = tuple._1
            loop = !ref.compareAndSet(current, tuple._2)
          }
          b
        }
```

## 前提知識

- 部分関数（PartialFunction）は、一部の入力にだけ答えを返す関数です。`pf.applyOrElse(x, f)` は、合えば `pf` の結果を、合わなければ `f` の結果を返します。
- `Ref` は、並行処理の中で安全に読み書きできる参照です。ここでは `AtomicReference` を使っています。
- CAS（compare-and-set）は、「今の値が読んだものと同じなら書き換える」という 1 回の操作です。
- `var loop` と `while` は、失敗したらやり直すためのループです。
- `null.asInstanceOf[B]` は、ループの中で必ず代入される変数の初期値として使う書き方です。

## 何をしているか

### 1. 今の値に部分関数を当てる

ループの中では、現在の値 `current` を読み、`pf.applyOrElse` で条件を確かめます。条件に合わなければ、結果は既定値 `default` と、今の値のままになります。

```scala:line-numbers=413
            val tuple   = pf.applyOrElse(current, (_: Any) => (default, current))
```

### 2. CAS で、値が変わっていなければ書き換える

`compareAndSet` は、読んだ値のままなら新しい値に変えます。失敗したら、他の処理が先に変えたということなので、もう一度読んでやり直します。

```scala:line-numbers=415
            loop = !ref.compareAndSet(current, tuple._2)
```

### 3. 結果の値を返す

書き換えに成功すると、ループを抜けて、結果 `b` を返します。合わない場合も、値は同じなので CAS は成功し、既定値が返ります。

## ここがすごい

- 条件に合うかどうかを 1 回の関数呼び出しで決めるので、「読んで、調べて、書く」の 3 段階が 1 か所にまとまります。
- 合わないときも CAS で同じ値を書き直すだけなので、特別な分岐を増やさずに済みます。
- 部分関数の作りを使うと、「どの値が対象か」を `case` で自然に書けます。
- 同じ CAS ループの型を `modify` と共有しているので、並行処理の仕組みが 1 つの形にまとまっています。

## まとめ

- 条件付きの更新は、部分関数で条件を書き、CAS で安全に書き換えると便利です。
- 条件に合わないときの結果を既定値で決めると、呼び出し側が扱いやすくなります。
- 失敗したら読み直す CAS ループは、ロックなしの更新の基本です。
