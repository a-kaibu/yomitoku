---
title: "Map の最小のキーと値を、探して返す"
description: "containers の Map で、いちばん小さいキーと、その値を組にして返す lookupMin。空の Map なら Nothing を返す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [1570, 1572]
function: "lookupMin"
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング, 再帰]
---

## ひとことで

`lookupMin m` は、`Map` の中でいちばん小さいキーと、その値の組を `Just` で返す関数です。`Map` が空のときは `Nothing` を返します。

## コード

```haskell:line-numbers=1570
lookupMin :: Map k a -> Maybe (k,a)
lookupMin Tip = Nothing
lookupMin (Bin _ k x l _) = Just $! kvToTuple (lookupMinSure k x l)
```

## 前提知識

- **`Maybe`**: 値があれば `Just`、なければ `Nothing` になる型です。空かどうかを安全に表せます。
- **`Tip` と `Bin`**: 空の木と、節点を表すデータの形です。
- **`$!`**: 右の値を先に計算してから、関数に渡す演算子です。
- **`kvToTuple`**: 内部の形の組を、普通の `(キー, 値)` の組に変える関数です。

## 何をしているか

### 1. 空なら Nothing を返す

```haskell:line-numbers=1571
lookupMin Tip = Nothing
```

木が空なら、探す値がないので `Nothing` を返します。

### 2. 節点から最小のキーを見つける

```haskell:line-numbers=1572
lookupMin (Bin _ k x l _) = Just $! kvToTuple (lookupMinSure k x l)
```

節点のキーと値から始めて、左の木をたどり、いちばん小さいキーを見つけます。`lookupMinSure` がその作業をしています。最後に `Just` で包んで返します。

## ここがすごい

木の左端に最小の要素があるので、左へたどるだけで見つけられます。全体を比べる必要がありません。

`$!` を使って結果を先に計算させるので、途中の値が溜まらず、メモリを節約できます。

## まとめ

- 空かどうかを `Maybe` で返すと、安全に扱える。
- 順序のある木では、端の要素は左や右へたどるだけで分かる。
- 結果を先に計算させると、遅延評価によるメモリの溜まりを防げる。
