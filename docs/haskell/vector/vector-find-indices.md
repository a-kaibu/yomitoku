---
title: "条件に合う要素の位置を、すべて集める"
description: "vector の findIndices。条件に合う要素の位置（番号）を、先頭から順にすべて集めて、番号のベクターとして返す。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1725, 1727]
function: "findIndices"
difficulty: 2
format: 2
tags: [探索, データ構造, 関数型]
---

## ひとことで

`findIndices f v` は、ベクター `v` の中で条件 `f` に合う要素の位置をすべて集めて、番号のベクターとして返す関数です。

## コード

```haskell:line-numbers=1725
findIndices f = unstream
              . inplace (S.map fst . S.filter (f . snd) . S.indexed) toMax
              . stream
```

## 前提知識

- **位置（インデックス）**: ベクターの先頭を 0 とした、要素の番号です。
- **`S.indexed`**: 要素と位置の組の流れを作る関数です。
- **`S.filter`**: 条件に合うものだけを残す関数です。
- **関数合成（`.`）**: 右の処理の結果を左に渡す書き方です。ここでは右から左へ、処理が続きます。

## 何をしているか

### 1. 要素と位置の組を作る

```haskell:line-numbers=1727
              . stream
```

まず、ベクターを流れに変えます。流れを `S.indexed` に通すと、「要素と位置」の組が並ぶようになります。

### 2. 条件で絞り、位置だけを取り出す

```haskell:line-numbers=1726
              . inplace (S.map fst . S.filter (f . snd) . S.indexed) toMax
```

`S.filter (f . snd)` は、要素（組の 2 番目）が条件に合うものだけを残します。`S.map fst` で、残った組から位置（1 番目）だけを取り出します。

### 3. 位置のベクターにまとめる

```haskell:line-numbers=1725
findIndices f = unstream
```

最後に、取り出した位置の流れを `unstream` でベクターにまとめます。

## ここがすごい

要素と位置の組を作って、条件で絞り、位置だけを取り出すという 3 段階を、ひとつの式で表しています。途中の一時的なベクターを作らずに済みます。

また、結果の位置は必ず昇順になるので、そのまま使いやすい形になっています。

## まとめ

- 位置を探すときは、「要素と位置の組」を作ると分かりやすい。
- 流れの上で絞り込みと取り出しを行うと、無駄な配列が減る。
- 関数合成で段階を並べると、処理の流れを読み取りやすい。
