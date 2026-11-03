---
title: "等差数列のベクターを、始まりと間隔と長さで作る"
description: "vector の enumFromStepN。開始値と間隔、長さを受け取り、その分だけ等差数列を作る。型の検査（elemseq）を、作る前に行っている。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [699, 702]
function: "enumFromStepN"
difficulty: 2
format: 2
tags: [数値計算, 遅延評価, イテレータ]
---

## ひとことで

`enumFromStepN x y n` は、最初の値 `x`、間隔 `y`、個数 `n` を受け取って、`x`、`x+y`、`x+2y` のように並んだベクターを作る関数です。

## コード

```haskell:line-numbers=699
enumFromStepN x y n = elemseq (undefined :: v a) x
                    $ elemseq (undefined :: v a) y
                    $ unstream
                    $ Bundle.enumFromStepN  x y n
```

## 前提知識

- **ベクター**: 配列のように、同じ型の値を並べて持つデータ構造です。
- **等差数列**: 同じ間隔で増えていく数の並びです。たとえば `1, 3, 5, 7` は間隔 2 です。
- **`elemseq`**: 値を先に評価させるための内部の補助関数です。遅延評価で値が溜まるのを防ぎます。
- **`$`**: 関数の適用を、右から左へ続けて書くための演算子です。

## 何をしているか

### 1. 最初の値と間隔を評価する

```haskell:line-numbers=699
enumFromStepN x y n = elemseq (undefined :: v a) x
                    $ elemseq (undefined :: v a) y
```

`x` と `y` を、それぞれ先に評価させます。こうすると、後で必要になるまで値が溜まることがありません。

### 2. ストリームを作ってベクターにする

```haskell:line-numbers=701
                    $ unstream
                    $ Bundle.enumFromStepN  x y n
```

`Bundle.enumFromStepN` は、等差数列の流れを作ります。`unstream` が、その流れを実際のベクターにまとめます。

## ここがすごい

等差数列は、途中の値を 1 つずつ計算しながら、直接ベクターにできます。リストを作ってから変換する方法より、メモリを節約できます。

また、`elemseq` で値を評価してから流れを作るので、遅延評価による無駄な計算を避けています。

## まとめ

- 規則のある数列は、流れとして作ってからベクターにすると効率がよい。
- 値の評価を先に済ませると、遅延評価で溜まる問題を防げる。
- `$` で処理を縦に並べると、段階が読みやすくなる。
