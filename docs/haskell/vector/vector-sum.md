---
title: "ベクターの要素を先頭から順にたす"
description: "vector の sum。要素を先頭から 1 つずつ左から足していき、合計を返す。内部では厳密な左畳み込みを使う。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov\""
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1900, 1900]
function: "sum"
difficulty: 2
format: 2
tags: [数値計算, 遅延評価]
---

## ひとことで

`sum` は、ベクターのすべての要素を足し合わせて、合計を 1 つの値として返す関数です。

## コード

```haskell:line-numbers=1900
sum = Bundle.foldl' (+) 0 . stream
```

## 前提知識

- **`Num a`**: 足し算などの数の演算ができる型の制約です。
- **畳み込み（fold）**: 先頭から 1 つずつ、途中の答えと次の要素を組み合わせていく操作です。
- **`foldl'`**: 左から畳み込みながら、途中の値を毎回評価して溜め込まないようにする版です。`'` が付いているのは、厳密に評価するという印です。
- **`0`**: 足し算の始まりの値（単位元）です。空のベクターの合計は 0 になります。

## 何をしているか

### 1. 型で制約する

```haskell:line-numbers=1898
sum :: (Vector v a, Num a) => v a -> a
```

`Vector v a` で入れ物の型を、`Num a` で要素が数であることを表しています。

### 2. 左から足していく

```haskell:line-numbers=1900
sum = Bundle.foldl' (+) 0 . stream
```

`Bundle.foldl' (+) 0` は、初期値 0 から始めて、先頭から順に `+` で足していく処理です。`.` で `stream` につないでいるので、要素は流れとして 1 つずつ読まれます。

## ここがすごい

`foldl'` は途中の合計を毎回評価するので、遅延評価で大きな計算の塊が溜まることを防ぎます。大きなベクターでも、メモリを使いすぎずに合計できます。

初期値に `0` を渡すことで、空のベクターでも同じ書き方で正しく動きます。

## まとめ

- 合計のような畳み込みは、厳密な左畳み込み `foldl'` を使うとメモリを節約できる。
- 初期値（単位元）を決めておくと、空の場合も自然に扱える。
- 流れに変換してから畳み込むので、中間の配列を作らない。
