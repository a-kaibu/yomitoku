---
title: "各要素に、その位置をつけてペアにする"
description: "vector の indexed。ベクターの各要素を (位置, 要素) のペアに変える。位置を使う処理を、ループの番号を別に管理せずに書ける。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1072, 1072]
function: "indexed"
difficulty: 1
format: 2
tags: [イテレータ, 関数型, イディオム]
---

## ひとことで

`indexed v` は、ベクターの各要素を `(位置, 要素)` のペアに変えて、新しいベクターを返します。位置 0 の要素は `(0, 最初の要素)` になります。

## コード

```haskell:line-numbers=1072
indexed = unstream . Bundle.indexed . stream
```

## 前提知識

- **タプル `(Int, a)`**: 位置と要素を 1 つにまとめたペアです。`fst` で位置、`snd` で要素を取れます。
- **位置（index）**: 先頭を 0 とする番号です。
- **流れ（stream）**: 要素を 1 つずつ渡していく形の、ベクターの中間表現です。
- **`unstream`**: 流れをベクターに戻す関数です。

## 何をしているか

### 1. 型で、ペアのベクターになることを示す

```haskell
indexed :: (Vector v a, Vector v (Int,a)) => v a -> v (Int,a)
```

入力は要素 `a` のベクターです。出力は `(Int, a)` のペアのベクターです。入れ物の型 `v` は同じままなので、同じ種類のベクターが返ります。

### 2. 流れの中でペアを作って戻す

```haskell:line-numbers=1072
indexed = unstream . Bundle.indexed . stream
```

`stream` でベクターを流れにし、`Bundle.indexed` が流れの各要素に位置をつけます。最後に `unstream` で、ペアの流れを新しいベクターにまとめます。

例えば `['a', 'b']` は `[(0,'a'), (1,'b')]` になります。

## ここがすごい

リストで同じことをするなら `zip [0..] xs` と書くのが定番です。こちらは流れの途中で位置をつけるので、中間のリストを挟まず、1 回の変換で済みます。

型に `Vector v (Int,a)` を明示しているので、入れ物の種類を変えずに、ペアを持つ同じ種類のベクターが返ることも、型だけで読み取れます。

## まとめ

- 位置が必要な処理は、`indexed` で各要素にペアを付けてから扱える。
- 流れの中で付けるので、中間の配列を作らない。
- 型の `v` が変わらないため、入れ物の種類は保たれる。
