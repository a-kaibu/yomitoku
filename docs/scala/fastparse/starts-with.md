---
title: "文字列の途中から、前方一致を確かめる"
description: "FastParse の startsWith。入力の位置 offset から、prefix と 1 文字ずつ比べ、途中で違えばすぐ false を返す。末尾再帰の小さな関数で、パーサの先読みに使われる。"
language: scala
project: "FastParse"
repo: https://github.com/com-lihaoyi/fastparse
license: "MIT"
copyright: "Copyright (c) 2014 Li Haoyi (haoyi.sg@gmail.com)"
commit: "475d042bc267c53e3ac7d383dc01271cdb4862a6"
file: "fastparse/src/fastparse/internal/Util.scala"
lines: [26, 34]
format: 2
function: "startsWith"
difficulty: 2
tags: [パース, 文字列処理, 再帰]
---

## ひとことで

Scala のパーサライブラリ FastParse の内部関数 `startsWith` は、入力の途中の位置 `offset` から、文字列 `prefix` が続いているかを確かめます。違う文字が見つかった時点で `false` を返すので、無駄な比較をしません。

## コード

```scala:line-numbers=26
  def startsWith(src: ParserInput, prefix: String, offset: Int) = {
    @tailrec def rec(i: Int): Boolean = {
      if (i >= prefix.length) true
      else if (!src.isReachable(i + offset)) false
      else if (src(i + offset) != prefix.charAt(i)) false
      else rec(i + 1)
    }
    rec(0)
  }
```

## 前提知識

- パーサは、入力の文字列を先頭から読みながら、決まった形を認識する部品です。「この先に特定の語が続くか」を先に確かめる処理は、よく使われます。
- `ParserInput` は、FastParse の入力を表す型です。`src(i)` で i 番目の文字を、`isReachable(i)` で位置が入力の中にあるかを調べられます。
- `prefix.charAt(i)` は、接頭辞 `prefix` の i 番目の文字を取り出します。
- 関数の中に `@tailrec def rec` を書くと、外側の関数の引数を見ながら、内側で繰り返しを書けます。
- `if ... else if ...` の連続は、上から順に条件を調べる分岐です。

## 何をしているか

### 1. 接頭辞の終わりまで来たら成功

`rec(i)` は、`i` 番目までの文字が一致したかを確かめます。`i` が接頭辞の長さ以上なら、すべて一致したので `true` を返します。

```scala:line-numbers=29
      else if (!src.isReachable(i + offset)) false
```

### 2. 入力の範囲と文字を、順に確かめる

入力の位置 `i + offset` が範囲外なら `false` です。範囲内でも文字が違えば `false` です。

```scala:line-numbers=30
      else if (src(i + offset) != prefix.charAt(i)) false
      else rec(i + 1)
```

### 3. 一致したら、次の文字へ進む

どちらも問題なければ、`rec(i + 1)` で次の文字を確かめます。これは関数の最後の処理なので、末尾再帰としてループに変換されます。

```scala:line-numbers=32
    }
```

## ここがすごい

- 違う文字が見つかった時点で止まるので、長い入力でも、先頭で違えばほとんど比べずに終わります。
- 範囲の確認 `isReachable` を文字の比較より先に行うことで、入力の外の文字を読まずに済みます。安全性と速さを両立させる順番です。
- 再帰を `@tailrec` で書いているので、接頭辞がどれだけ長くても、スタックを増やしません。
- `offset` を引数で受け取るので、入力の任意の位置から、同じ関数で確かめられます。

## まとめ

- 前方一致は、先頭から 1 文字ずつ比べ、違ったらすぐ止まると速くなります。
- 入力の範囲は、文字を読む前に確かめます。
- 末尾再帰で書けば、長い接頭辞でも安全です。
