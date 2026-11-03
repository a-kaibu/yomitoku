---
title: "配列の要素を、範囲を確かめてから読む「read」"
description: "unordered-containers の HAMT 用の配列操作 read。添字が範囲内かを確かめてから、変更できる配列の要素を読む。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal/Array.hs
lines: [255, 258]
function: "read"
difficulty: 2
format: 2
tags: [低レイヤ, 防御的プログラミング, 最適化]
---

## ひとことで

`read` は、変更できる配列 `ary` の添字 `_i` の要素を、`ST` の中で読み出す関数です。範囲の外の添字は、エラーとして止めます。

HAMT の子の配列から、特定の枝を取り出すときに使われます。読み出しは、探索の中で何度も行われる基本の操作です。

## コード

```haskell:line-numbers=255
read :: MArray s a -> Int -> ST s a
read ary _i@(I# i#) = ST $ \ s ->
    CHECK_BOUNDS("read", unsafeLengthM ary, _i)
        readSmallArray# (unMArray ary) i# s
```

## 前提知識

- **`MArray s a`**: 変更できる配列の型です。`s` は `ST` の状態の型です。
- **`ST s a`**: 状態を持つ計算の型です。`s` によって、外から状態が漏れないようにしています。
- **`_i@(I# i#)`**: 添字を名前付けしつつ、中のプリミティブな整数 `i#` も取り出すパターンです。
- **`readSmallArray#`**: 小さな配列から、1 つの要素を読む命令です。

## 何をしているか

### 1. 添字を取り出し、範囲を確かめる

```haskell:line-numbers=256
read ary _i@(I# i#) = ST $ \ s ->
    CHECK_BOUNDS("read", unsafeLengthM ary, _i)
```

添字を `_i`（検査用の名前）と `i#`（命令用の整数）に分けて取り出します。`CHECK_BOUNDS` で、範囲内にあるかを確かめます。範囲外なら、エラーで止まります。

### 2. 命令で読み出す

```haskell:line-numbers=258
        readSmallArray# (unMArray ary) i# s
```

`readSmallArray#` で、添字 `i#` の要素を読みます。結果は `ST` の中の値です。

## ここがすごい

範囲の確認と、読み出しの命令を、同じ関数の中で行っています。確認は、設定により省けるので、本番のビルドでは速く、開発中は安全に動きます。

また、添字を 2 つの形で取り出すことで、確認は読みやすい値で、命令は低レベルの値で行えます。型の違いを、パターンの中で分けて扱っています。

## まとめ

- 範囲の確認は、読み出しの前に行うと安全。
- 設定で確認を有効・無効に切り替えられると、速さと安全を選べる。
- 型の違う値を、パターンで同時に取り出すと、書き方が簡潔になる。
