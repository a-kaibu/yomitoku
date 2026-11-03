---
title: "決まった個数だけ、状態を進めながら要素を作る"
description: "vector の unfoldrExactN。状態から要素と次の状態を作る関数を、指定した個数だけ繰り返す。作る個数が先にわかっているので、一度の確保で済む。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [605, 605]
function: "unfoldrExactN"
difficulty: 2
format: 2
tags: [アルゴリズム, 遅延評価, 数値計算]
---

## ひとことで

`unfoldrExactN n f s` は、初期の状態 `s` から始めて、`f` で「要素」と「次の状態」を作ります。それを `n` 回繰り返し、要素だけを並べたベクターを返します。

## コード

```haskell:line-numbers=605
unfoldrExactN n f = unstream . Bundle.unfoldrExactN n f
```

## 前提知識

- **状態（state）**: 次の要素を作るときに持ち越す値です。例えば、乱数の種や「今いくつ作ったか」などです。
- **タプル `(a, b)`**: 2 つの値をまとめた組です。`(要素, 次の状態)` の形で返されます。
- **`unstream`**: 流れをベクターに変える関数です。
- **`.`（関数合成）**: 右にある関数の結果を左の関数に渡す組み立てです。

## 何をしているか

### 1. 型で、状態を運びながら作ることがわかる

```haskell
unfoldrExactN  :: Vector v a => Int -> (b -> (a, b)) -> b -> v a
```

`(b -> (a, b))` は、状態 `b` から「要素 `a`」と「次の状態 `b`」を作る関数です。`Int` が作る個数で、戻り値は要素のベクターです。

### 2. 流れにしてベクターに戻す

```haskell:line-numbers=605
unfoldrExactN n f = unstream . Bundle.unfoldrExactN n f
```

`Bundle.unfoldrExactN n f` は、状態から要素を `n` 個だけ取り出す流れを作ります。個数がわかっているので、作る前に必要な大きさを確保できます。最後に `unstream` で、その流れをベクターにまとめます。

例えば、状態を 1 ずつ増やし、要素として状態を返す関数で `n = 3`、初期状態 `1` とすると、`[1, 2, 3]` になります。

## ここがすごい

普通の `unfoldr` は、いつ終わるかわからないので、途中で結果を作り直すことがあります。`unfoldrExactN` は個数 `n` を先に受け取るので、必要な大きさを一度で確保できます。

状態を値の組として持ち回るので、可変の変数を使わずに、順番に値を作れます。

## まとめ

- 状態を持ち越して順に要素を作るときは、`unfoldrExactN` が使える。
- 個数を先に決めると、確保は 1 回で済む。
- 「要素」と「次の状態」を分けて返すのが、この種の関数の基本の形。
