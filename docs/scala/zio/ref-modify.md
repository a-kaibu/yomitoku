---
title: "競合したら、やり直す CAS ループ"
description: "ZIO の Ref.Atomic の modify。AtomicReference の compareAndSet が失敗したら読み直して計算をやり直し、ロックを使わずに値を更新する。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2017-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Ref.scala"
lines: [396, 406]
format: 2
function: "Ref.Atomic.modify"
difficulty: 3
tags: [並行処理, ロック不要, 関数型]
---

## ひとことで

ZIO の並行データ構造 `Ref` の中で、`modify` は値を読み、新しい値と結果を計算してから書き戻します。他の処理が同時に書き換えていたら書き戻しに失敗するので、そのときは読み直して、計算をやり直します。ロックを取らずに値を安全に更新する、CAS（compare-and-set）ループです。

## コード

```scala:line-numbers=396
        def modify[B](f: A => (B, A))(implicit unsafe: Unsafe): B = {
          var loop = true
          var b: B = null.asInstanceOf[B]
          while (loop) {
            val current = ref.asInstanceOf[AtomicReference[A]].get
            val tuple   = f(current)
            b = tuple._1
            loop = !ref.compareAndSet(current, tuple._2)
          }
          b
        }
```

## 前提知識

- `Ref` は、並行処理の中で安全に読み書きできる参照（箱）です。ZIO の関数型のエフェクトの中で使われます。
- `AtomicReference` は、Java の標準の「値を入れる箱」で、`compareAndSet(old, new)` で「今の値が old のときだけ new に変える」操作ができます。
- CAS は、CPU が提供する「比べて変える」命令を使う方式です。成功すれば 1 つの操作として見えます。
- `f` は「今の値を受け取り、結果と新しい値の組を返す」関数です。
- `var` は、ループの中で値を更新する変数です。

## 何をしているか

### 1. 今の値を読み、関数で新しい値を作る

ループの中では、まず `get` で今の値を読みます。その値に `f` を当てて、結果 `b` と新しい値 `tuple._2` の組を受け取ります。

### 2. CAS で書き戻す

`compareAndSet` は、読んだ `current` のままなら `tuple._2` に書き換え、成功したら `true` を返します。

```scala:line-numbers=403
            loop = !ref.compareAndSet(current, tuple._2)
```

戻り値が `false` なら、ほかの処理が先に書き換えたということです。`loop = !...` によって、もう一度読んで計算し直します。

### 3. 成功したら、結果を返す

書き込みに成功すると `loop` が `false` になり、ループを抜けて `b` を返します。`b` は、成功したときの `f` の結果です。

## ここがすごい

- ロックを使わないので、ほかの処理を待たせる必要がありません。競合が少ない場合は、1 回の CAS で終わります。
- 途中で失敗しても、結果は必ず「ある 1 回の読み取りの値」に基づいています。途中の状態が外から見えることはありません。
- `f` は失敗すると何度も呼ばれます。だから `f` は副作用のない純粋な関数であるべきだ、という注意が必要です。
- `null.asInstanceOf[B]` で初期値を作るのは、ループの中で必ず代入されるためです。余計な `Option` を作らない工夫です。

## まとめ

- CAS ループは、読む、計算する、書く、失敗したらやり直す、の 4 段階で値を更新します。
- ロックを使わず、競合したときだけ計算をやり直すので、待ちが少なくなります。
- 再試行される関数は、副作用がないように書きます。
