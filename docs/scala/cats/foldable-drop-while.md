---
title: "先頭の一致する要素だけを捨て、最初の不一致以降は残す"
description: "Cats の Foldable.dropWhile_。ListBuffer が空のあいだは条件に一致する要素を捨て、一度何か入ったら以降はすべて残す。状態を 1 つの変数で表す。"
language: scala
project: "Cats"
repo: https://github.com/typelevel/cats
license: "MIT"
copyright: "Copyright (c) 2015 Typelevel"
commit: "e28985fe2a0d7123a8fb84cbb70c72b5e3d935ca"
file: "core/src/main/scala/cats/Foldable.scala"
lines: [826, 829]
format: 2
function: "Foldable.dropWhile_"
difficulty: 2
tags: [関数型, イテレータ, 状態機械]
---

## ひとことで

Cats の `Foldable` は、リストや木のような「要素をたたみ込める型」の約束です。`dropWhile_` は、先頭から条件に一致する要素を捨てて、最初に一致しなかった要素からあとをすべて残します。途中に条件に合う要素があっても、捨てるのは先頭の連続部分だけです。

## コード

```scala:line-numbers=826
  def dropWhile_[A](fa: F[A])(p: A => Boolean): List[A] =
    foldLeft(fa, mutable.ListBuffer.empty[A]) { (buf, a) =>
      if (buf.nonEmpty || !p(a)) buf += a else buf
    }.toList
```

## 前提知識

- `dropWhile` は、先頭から条件を満たす要素を捨てるリストの操作です。最初に満たさない要素が出た時点で、捨てるのをやめます。
- `foldLeft` は、先頭から順に値をためていく操作です。`(蓄積, 要素) => 新しい蓄積` の関数を渡します。
- `ListBuffer` は、末尾に要素を足していける可変のリストです。`empty` で空のものを作れます。
- `buf.nonEmpty` は、バッファに何か入っているかを調べます。ここでは「捨てる段階が終わったか」の目印に使われています。
- `!p(a)` は、要素が条件に一致しないことを表します。

## 何をしているか

### 1. 空の `ListBuffer` を蓄積の値として、先頭から順に見る

`foldLeft` は、空の `ListBuffer` を最初の蓄積として始めます。要素は先頭から一つずつ、`(buf, a)` の形で関数に渡されます。

```scala:line-numbers=826
  def dropWhile_[A](fa: F[A])(p: A => Boolean): List[A] =
    foldLeft(fa, mutable.ListBuffer.empty[A]) { (buf, a) =>
```

### 2. まだ何も入っていなければ、一致する要素は捨てる

バッファが空で、かつ要素が条件に一致する（`p(a)` が真）なら、何もせずそのバッファを返します。捨てるという動きです。

```scala:line-numbers=828
      if (buf.nonEmpty || !p(a)) buf += a else buf
```

### 3. 一度何か入ったら、以降はすべて足していく

バッファが空でなければ、もう捨てる段階は終わっています。そのあとは、一致するかどうかに関係なく `buf += a` で要素を足します。最後に `toList` でリストにします。

```scala:line-numbers=829
    }.toList
```

## ここがすごい

- 「捨てる段階」と「残す段階」を、新しい変数を増やさずに、バッファが空かどうかで区別しています。
- 途中に条件に合う要素があっても、一度残し始めた後は捨てないので、先頭の連続部分だけを捨てる、という意味が正しく保たれます。
- `foldLeft` で一回の走査で済むので、要素を二度読む必要がありません。
- 結果を `ListBuffer` で作り、最後に `toList` で変換するので、途中で不変のリストを何度も作りません。

## まとめ

- `dropWhile_` は、先頭の連続する一致要素を捨て、最初の不一致から後ろをすべて残します。
- 「捨てる段階」かどうかは、バッファが空かどうかで決めています。
- 一回の `foldLeft` で、すべての要素を処理します。
