---
title: "比べ方を決めて、いちばん小さい要素を取る"
description: "vector の minimumBy。比較の関数を渡して、いちばん小さい要素を 1 回の走査で返す。maximumBy と対になる作りで、比べ方だけが違う。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [2007, 2007]
function: "minimumBy"
difficulty: 2
format: 2
tags: [アルゴリズム, 関数型, ソート]
---

## ひとことで

`minimumBy cmp v` は、比較の関数 `cmp` を使って、ベクターの中でいちばん小さい要素を 1 つ返します。`maximumBy` の反対向きの版です。

## コード

```haskell:line-numbers=2007
minimumBy cmpr = Bundle.foldl1' minBy . stream
```

## 前提知識

- **`Ordering`**: 比較の結果を表す型です。`LT`、`EQ`、`GT` のどれかです。
- **比較関数**: 2 つの値を比べ、`Ordering` を返す関数です。
- **`foldl1'`**: 最初の要素を初期値にして、残りを左から厳密に畳み込みます。
- **最小と最大の対**: 最小を取る関数と最大を取る関数は、比べた結果のどちらを残すかが違うだけです。

## 何をしているか

### 1. 型を最大版と揃える

```haskell
minimumBy :: Vector v a => (a -> a -> Ordering) -> v a -> a
```

`maximumBy` と同じ形の型です。比較の関数を渡し、要素と同じ型の値を 1 つ受け取ります。

### 2. 小さい方を残して進む

```haskell:line-numbers=2007
minimumBy cmpr = Bundle.foldl1' minBy . stream
```

`stream` で流れにし、最初の要素から始めて、残りを `minBy` で 1 つずつ比べます。`minBy` は、途中の最小と次の要素を比べて、小さい方を残します。

例えば `[3, 1, 2]` を、普通の大小で比べると、`1` が残ります。途中の結果は `3`、次に `1` に変わり、`2` とは比べても `1` のままです。

## ここがすごい

最大版と最小版で、補助の関数（`maxBy` と `minBy`）を分けているだけで、走査の仕組みは同じです。中身を一箇所にまとめず、目的ごとに薄い関数にしているので、読みやすく保たれています。

比べ方を外から渡すので、ソートしなくても 1 回の走査で最小がわかります。

## まとめ

- 最小値は、比べ方を決めて 1 回の走査で取れる。
- 最大版と同じ形なので、対で覚えると理解しやすい。
- 空のベクターでは使えないので注意する。
