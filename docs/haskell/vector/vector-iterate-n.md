---
title: "最初の値から関数を繰り返し当てはめて、ベクターを作る"
description: "vector の iterateN。初期値に関数を何度も適用し、その結果を並べたベクターを作る。遅延した無限の流れを、長さを決めて切り出す。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [572, 572]
function: "iterateN"
difficulty: 1
format: 2
tags: [アルゴリズム, 遅延評価, イディオム]
---

## ひとことで

`iterateN n f x` は、値 `x` から始めて、`f` を繰り返し当てはめた結果を `n` 個並べたベクターを作ります。`x`、`f x`、`f (f x)`、と続いていきます。

## コード

```haskell:line-numbers=572
iterateN n f x = unstream (Bundle.iterateN n f x)
```

## 前提知識

- **関数の適用**: `f x` は、関数 `f` に値 `x` を渡した結果です。
- **ベクターの長さ**: `iterateN` の最初の引数 `n` で、作る個数を決めます。
- **`unstream`**: 流れ（stream）を、ベクターという形に戻す関数です。
- **遅延評価**: Haskell では、必要になるまで値を計算しないことがあります。ここでは流れのまま扱い、最後にベクターへ戻します。

## 何をしているか

### 1. 型で長さと関数を受け取る

```haskell
iterateN :: Vector v a => Int -> (a -> a) -> a -> v a
```

`Int` が個数、`(a -> a)` が繰り返す関数、`a` が初期値です。戻り値は同じ型 `a` の要素を持つベクターです。

### 2. 流れを作ってから戻す

```haskell:line-numbers=572
iterateN n f x = unstream (Bundle.iterateN n f x)
```

`Bundle.iterateN n f x` は、`x`、`f x`、`f (f x)` … という流れを `n` 個だけ作ります。`unstream` がそれを一度にベクターにまとめます。

例えば `iterateN 4 (*2) 1` は、`1`、`2`、`4`、`8` を並べたベクターになります。`(*2)` は「2 倍する関数」です。

## ここがすごい

`iterateN` は、前の値から次の値を作る計算を流れとして表します。途中の値を全部リストに作ってからベクターに詰め替える書き方より、必要な分だけ一度にベクターにできます。

また、個数 `n` を先に渡す設計なので、作る大きさがわかっているときは配列の大きさを前もって決められます。

## まとめ

- 前の値から次の値を作る数列は、`iterateN` で 1 行にまとめられる。
- 個数 `n` を先に決めるので、無限に増えることはない。
- 流れで作ってから `unstream` で戻す、というベクター関数の共通の組み立て方が見える。
