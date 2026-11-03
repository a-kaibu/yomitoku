---
title: "番号つきで要素を畳み込み、途中の値を溜めずに合計する"
description: "vector の ifoldl'。要素と位置をいっしょに受け取りながら、左から厳密に畳み込む。位置を使う集計を、余計なメモリを使わずに書ける。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1794, 1794]
function: "ifoldl'"
difficulty: 2
format: 2
tags: [アルゴリズム, 遅延評価, 最適化]
---

## ひとことで

`ifoldl'` は、ベクターの要素を先頭から順に畳み込みます。畳み込みの関数は、途中の答え・位置・要素の 3 つを受け取ります。「何番目の要素をどう足すか」といった位置を使う集計を書くときに使います。

## コード

```haskell:line-numbers=1794
ifoldl' f z = Bundle.foldl' (uncurry . f) z . Bundle.indexed . stream
```

## 前提知識

- **畳み込み（fold）**: 途中の答えと次の要素から、新しい答えを作る操作を先頭から繰り返すことです。
- **厳密（strict）**: 途中の答えを、その場で計算して値にすることです。`'` が付いた関数は、この版であることを示します。
- **`uncurry`**: 2 つの引数を取る関数を、ペア 1 つを取る関数に変える関数です。
- **`.`（関数合成）**: 右から左へ順に適用する組み立てです。

## 何をしているか

### 1. 型で、位置つきの畳み込みだとわかる

```haskell
ifoldl' :: Vector v b => (a -> Int -> b -> a) -> a -> v b -> a
```

畳み込みの関数は `a -> Int -> b -> a` の形です。途中の答え `a`、位置 `Int`、要素 `b` を受け取り、新しい答え `a` を返します。初期値 `z` の型は答えの型 `a` と同じです。

### 2. 位置を要素とペアにする

```haskell:line-numbers=1794
ifoldl' f z = Bundle.foldl' (uncurry . f) z . Bundle.indexed . stream
```

`Bundle.indexed` は、各要素を `(位置, 要素)` のペアにします。`uncurry . f` は、そのペアを 2 つの引数として `f` に渡す関数です。`Bundle.foldl'` が、それを使って左から厳密に畳み込みます。

例えば `[10, 20, 30]` に対して `f acc i x = acc + i * x`、初期値 `0` で使うと、`0*10 + 1*20 + 2*30 = 80` になります。

## ここがすごい

位置を使うには、普通は `zip [0..] xs` のように、ペアの配列を一度作る方法があります。この実装は流れの中でペアを作るので、中間の配列を作りません。

また `foldl'` の厳密な版を使うので、途中の答えが長い計算の塊として溜まりにくくなっています。大きなベクターでも、メモリを増やさずに位置つきの集計ができます。

## まとめ

- 位置を使う畳み込みは `ifoldl'` で 1 回で書ける。
- 内部では `indexed` で流れの中にペアを作るので、配列を作り直さない。
- `'` の付いた厳密な畳み込みは、途中の値を溜めないための定番の形。
