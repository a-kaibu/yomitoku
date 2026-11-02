---
title: "累積の結果を、途中の値をすべて残しながら配列にする"
description: "fs2 の Chunk.scanLeft の中身 scanLeft_。初期値から始めて、要素を 1 つずつ足し込んだ途中の結果を、すべて配列に入れる。先頭に初期値を残すかどうかを引数で切り替え、必要な大きさの配列を最初に作る。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [291, 302]
format: 2
function: "Chunk.scanLeft_"
difficulty: 3
tags: [関数型, イテレータ, 状態機械]
---

## ひとことで

fs2 の `Chunk` には、途中の累積の値を全部並べて返す `scanLeft` があります。たとえば `Chunk(1, 2, 3).scanLeft(0)(_ + _)` は `Chunk(0, 1, 3, 6)` になります。`scanLeft_` は、その中身です。先頭の初期値を含めるかどうかを、引数で切り替えます。

## コード

```scala:line-numbers=291
  protected def scanLeft_[O2](z: O2, emitZero: Boolean)(f: (O2, O) => O2): (Chunk[O2], O2) = {
    val arr = new Array[Any](if (emitZero) size + 1 else size)
    var acc = z
    if (emitZero) arr(0) = acc
    var i = if (emitZero) 1 else 0
    foreach { o =>
      acc = f(acc, o)
      arr(i) = acc
      i += 1
    }
    Chunk.array(arr).asInstanceOf[Chunk[O2]] -> acc
  }
```

## 前提知識

- 「累積」は、先頭から今までの結果を積み重ねていくことです。足し算なら、途中の合計がそれにあたります。
- `z` は、初期値です。累積の最初の値として、結果の先頭に入る場合があります。
- `f: (O2, O) => O2` は、今までの累積と次の要素から、新しい累積を作る関数です。
- `emitZero` は、初期値を結果に含めるかどうかを表す真偽値です。`scanLeft` は真、`scanLeftCarry` は偽で呼びます。
- `Array[Any]` の配列は、型を消した形で値を入れる入れ物です。最後に `Chunk` に包んで型を戻します。

## 何をしているか

### 1. 結果の配列の大きさを決める

初期値を含めるなら、要素の数に 1 を足した大きさの配列を作ります。含めないなら、要素の数だけです。含める場合は、先頭に初期値を入れます。

```scala:line-numbers=292
    val arr = new Array[Any](if (emitZero) size + 1 else size)
    var acc = z
    if (emitZero) arr(0) = acc
    var i = if (emitZero) 1 else 0
    foreach { o =>
```

### 2. 要素を順に足して、累積を配列に入れる

`foreach` で要素を 1 つずつ取り出し、`f(acc, o)` で新しい累積を作ります。その値を、配列の次の位置に入れます。

```scala:line-numbers=297
      acc = f(acc, o)
      arr(i) = acc
      i += 1
    }
    Chunk.array(arr).asInstanceOf[Chunk[O2]] -> acc
```

### 3. 配列と最後の累積を組にして返す

すべての要素を処理したら、配列を `Chunk` に包み、最後の累積と組にして返します。`scanLeft` は最初の要素だけを使い、`scanLeftCarry` は最後の累積も使います。

```scala:line-numbers=302
  }
```

## ここがすごい

- 途中の値を全部残すので、1 回の走査で累積の列が手に入ります。同じ計算を何度も繰り返す必要がありません。
- 配列の大きさを先に決めて、一度だけ確保します。途中で作り直す回数がありません。
- `emitZero` の 1 つの引数で、2 つの関数（`scanLeft` と `scanLeftCarry`）を共通の処理から作っています。
- 最後の累積を組で返すので、続きの処理に値を渡せます。区切って処理するストリームに向いています。

## まとめ

- 累積の列を作るには、状態を持ちながら、各段階の値を配列に書き込みます。
- 初期値を含めるかどうかで、結果の大きさが 1 つ変わる点に注意します。
- 最後の状態を一緒に返すと、続きの処理に値を引き継げます。
