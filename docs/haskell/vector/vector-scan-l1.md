---
title: "途中の答えを並べたベクターを、最初の要素から作る"
description: "vector の scanl1。左から畳み込んだ途中の結果を、要素ごとに並べたベクターを返す。最初の要素をそのまま結果の先頭に使うのが特徴。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [2272, 2272]
function: "scanl1"
difficulty: 2
format: 2
tags: [アルゴリズム, 遅延評価, 関数型]
---

## ひとことで

`scanl1 f v` は、ベクターを左から畳み込みながら、途中の答えを並べた新しいベクターを返します。たとえば `[1,2,3]` に足し算を使うと、`[1,3,6]` になります。

## コード

```haskell:line-numbers=2272
scanl1 f = unstream . inplace (S.scanl1 f) id . stream
```

## 前提知識

- **畳み込み**: 途中の答えと次の要素から新しい答えを作る操作を、先頭から繰り返すことです。
- **スキャン（scan）**: 畳み込みの途中の答えを、すべて残すことです。
- **`scanl1`**: 最初の要素を初期の答えとして使う版です。空のベクターには使えません。
- **`inplace`**: 可能なら、同じ領域を使い回して書き換える仕組みです。

## 何をしているか

### 1. 型で、同じ種類のベクターが返ることを示す

```haskell
scanl1 :: Vector v a => (a -> a -> a) -> v a -> v a
```

関数 `f` は、同じ型 `a` の 2 つの値から `a` を作ります。入力と出力は同じ型のベクターです。

### 2. 流れで途中の答えを作る

```haskell:line-numbers=2272
scanl1 f = unstream . inplace (S.scanl1 f) id . stream
```

`stream` で流れにし、`S.scanl1 f` が途中の答えの流れを作ります。`inplace` は、その処理を新しい配列の中で行えるように整えます。最後に `unstream` でベクターに戻します。

例えば `f = (+)` で `[1,2,3]` なら、途中の答えは `1`、`1+2=3`、`3+3=6` なので `[1,3,6]` です。

## ここがすごい

普通の `scanl` は初期値を別に渡すので、結果が 1 つ長くなります。`scanl1` は最初の要素を結果の先頭にそのまま使うので、長さが元と同じです。

`inplace` によって、途中の流れを作り直さずに、同じ領域へ書き込めます。

## まとめ

- 途中の答えをすべて残したいときは、畳み込みではなく `scanl1` を使う。
- 結果の長さは入力と同じになる。
- 空のベクターでは使えないので注意する。
