---
title: "集合のすべての部分集合を、1 つの集合にまとめる"
description: "containers の Set で、元の集合のすべての部分集合を要素に持つ集合を作る powerSet。右から 1 つずつ要素を足していき、部分集合の一覧を組み立てる。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [2121, 2123]
function: "powerSet"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`powerSet` は、集合 `xs` のすべての部分集合（一部を取り出した集合）を集めて、新しい `Set` にする関数です。たとえば `{1, 2}` からは、`{}`、`{1}`、`{2}`、`{1, 2}` の 4 つができます。

## コード

```haskell:line-numbers=2121
powerSet :: Set a -> Set (Set a)
powerSet xs0 = insertMin empty (foldr' step Tip xs0) where
  step x pxs = insertMin (singleton x) (insertMin x `mapMonotonic` pxs) `glue` pxs
```

## 前提知識

- **部分集合**: 元の集合から、いくつかの要素を選んで作った集合です。空の集合も含みます。
- **`foldr'`**: 右から順に要素を取り出して、途中の結果を積み上げていく関数です。
- **`insertMin`**: 最小の要素として値を差し込む関数です。昇順が崩れないことを前提にしています。
- **`glue`**: 2 つの木を、左が小さく右が大きい形でつなぐ関数です。

## 何をしているか

### 1. 空の集合を最初の部分集合にする

```haskell:line-numbers=2122
powerSet xs0 = insertMin empty (foldr' step Tip xs0) where
```

空の集合 `empty` は、どんな集合にも含まれる部分集合なので、最初に入れておきます。残りは `foldr'` で作ります。

### 2. 1 要素ずつ、部分集合を増やす

```haskell:line-numbers=2123
  step x pxs = insertMin (singleton x) (insertMin x `mapMonotonic` pxs) `glue` pxs
```

`step` は、今まで作った部分集合の集まり `pxs` に、要素 `x` を加えた新しい部分集合を作ります。`x` を加えた版（`insertMin x` を各要素に当てる）と、`x` 1 つだけの集合を足し、元の `pxs` とつなげます。

## ここがすごい

`mapMonotonic` を使っているので、「`x` を加えた部分集合」の並びを、木の形を保ったまま作れます。もし普通の `map` を使うと、毎回木を組み直すことになり、遅くなります。

さらに、要素は右から足していくので、`insertMin` で先頭に差し込むだけで順序が保たれます。並べ直す処理が要らないのも工夫です。

## まとめ

- 部分集合は、要素を 1 つずつ加えていく再帰で作れる。
- 順序を保つ操作を選ぶと、木の並びを壊さずに組み立てられる。
- 結果の大きさは元の要素数の 2 のべき乗になるので、大きい入力には向かない。
