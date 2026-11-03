---
title: "比較をせずに、いちばん右へ 1 件足す"
description: "Data.Map で、キーがいちばん大きいことが分かっているときに 1 件を足す関数 insertMax。比較という重い処理を省いている。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4158, 4164]
function: "insertMax"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム]
---

## ひとことで

`insertMax` は、木の中でいちばん大きいキーより**さらに大きい**キーを 1 件足す関数です。`insertMin` はその逆で、いちばん小さいキーより小さいキーを足します。

通常の挿入は、キーを 1 つずつ比べながら左右どちらに行くかを決めます。しかし、足すキーの位置がもう分かっているときは、比べる必要がありません。この関数はそこを省いています。

## コード

::: code-group

```haskell:line-numbers=4158 [日本語訳]
 -- insertMin と insertMax は、コストの高い比較をしない。
insertMax,insertMin :: k -> a -> Map k a -> Map k a
insertMax kx x t
  = case t of
      Tip -> singleton kx x
      Bin _ ky y l r
          -> balanceR ky y l (insertMax kx x r)
```

```haskell:line-numbers=4158 [原文]
-- insertMin and insertMax don't perform potentially expensive comparisons.
insertMax,insertMin :: k -> a -> Map k a -> Map k a
insertMax kx x t
  = case t of
      Tip -> singleton kx x
      Bin _ ky y l r
          -> balanceR ky y l (insertMax kx x r)
```

:::

## 前提知識

- **二分探索木の挿入**: 通常は、新しいキーと各節のキーを比べて、左へ行くか右へ行くかを決めます。
- **`case t of`**: 木の形が `Tip` か `Bin` かで処理を分けます。
- **`singleton`**: 1 件だけの木を作る関数です。空の木に 1 件入れたときの形として使われます。
- **`,` で並べた型の宣言**: `insertMax,insertMin :: ...` は、2 つの関数に同じ型を付ける書き方です。

## 何をしているか

### 1. 空の木なら 1 件だけの木を作る

```haskell:line-numbers=4162
      Tip -> singleton kx x
```

木が空なら、`kx` と `x` だけを持つ木を作ります。

### 2. 右へ進んで、釣り合いを直す

```haskell:line-numbers=4163
      Bin _ ky y l r
          -> balanceR ky y l (insertMax kx x r)
```

そうでなければ、現在の節 `ky y l r` の右側 `r` に、再帰的に `insertMax` を適用します。右側が重くなりすぎたかもしれないので、組み立てた後に `balanceR` で直します。

いちばん右まで進むと、必ず `Tip` にぶつかるので、そこで 1 件の木ができます。途中で比べる処理は一度もありません。

## ここがすごい

通常の挿入は、木の高さ分だけキーを比べます。`insertMax` は、比べる代わりに「右へ進む」と決め打ちしています。キーの比較は、文字列などでは特に重い処理なので、省けるとその分だけ速くなります。

さらに、コメントにもあるように、この関数は「キーの大小を見ない」ことが前提なので、型の上で比較を要求していません。`k` に `Ord`（比較できる）制約がないのは、そのためです。

また、`balanceR` を呼んで釣り合いを直すところは、通常の挿入と同じです。省いているのは比較だけで、木の形を保つ仕組みはそのまま残しています。

## まとめ

- 位置が分かっているなら、比較を省くと速くなる。
- 木の形を保つ仕組み（`balanceR` など）と、比較の省略は別々に考える。
- `insertMax` と `insertMin` は対になっていて、左右を入れ替えただけの関係にある。
