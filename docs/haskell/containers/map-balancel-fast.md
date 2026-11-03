---
title: "木の釣り合いを 1 行で確かめる「balanceL」の近道"
description: "Data.Map の釣り合いを直す関数 balanceL のうち、大丈夫なときは即座に節を作る近道。重い処理を呼ぶのは本当に崩れたときだけ。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4381, 4385]
function: "balanceL"
difficulty: 2
format: 2
tags: [データ構造, 最適化, アルゴリズム]
---

## ひとことで

`balanceL` は、左の木が重くなったかもしれないときに、木の釣り合いを確かめて直す関数です。多くの場合は釣り合いが保たれたままなので、**ほとんど何もせず、節を 1 つ作るだけで返します**。

本当に崩れているときだけ、複雑な回転の処理（`balanceL_`）を呼びます。この記事では、その「近道」の部分を読みます。

## コード

```haskell:line-numbers=4381
balanceL :: k -> a -> Map k a -> Map k a -> Map k a
balanceL k x l r = case (l, r) of
  (Bin ls _ _ _ _, Bin rs _ _ _ _)
    | ls <= delta*rs -> Bin (1+ls+rs) k x l r
  _ -> balanceL_ k x l r
```

## 前提知識

- **`balanceL` の役目**: `Map` の木は、挿入や削除のたびに左右の大きさの差が大きくなりすぎないように直す必要があります。`balanceL` はその担当で、左が重くなったかもしれないときに呼ばれます。
- **`case (l, r) of`**: 2 つの値を組にして、その形で場合分けしています。
- **`Bin ls _ _ _ _`**: 節の中で使うのは大きさだけなので、ほかの部分は `_` で捨てています。
- **`{-# INLINE #-}`**: コンパイラに「呼び出し箇所に直接展開してよい」と伝える指示です。小さくてよく呼ばれる関数を速くします。

## 何をしているか

### 1. 両方が節なら、大きさだけを比べる

```haskell:line-numbers=4382
balanceL k x l r = case (l, r) of
  (Bin ls _ _ _ _, Bin rs _ _ _ _)
    | ls <= delta*rs -> Bin (1+ls+rs) k x l r
```

左の大きさ `ls` と右の大きさ `rs` を取り出します。`ls <= delta*rs` は、左が右の 3 倍以下であることを表します。この条件を満たせば、釣り合いは十分に保たれています。

そのときは、`Bin (1+ls+rs) k x l r` で、そのまま新しい節を作ります。`1+ls+rs` は、新しい節の大きさです。

### 2. それ以外は重い処理へ

```haskell:line-numbers=4385
  _ -> balanceL_ k x l r
```

条件を満たさないとき（左が重すぎるとき）や、どちらかが `Tip`（空）のときは、`balanceL_` に任せます。近道と重い処理を分けることで、大多数の場合を速くしています。

## ここがすごい

挿入や削除は、どの節でも `balanceL` を通ります。つまり、木の深さ分だけこの関数が呼ばれます。その多くが「何もしなくてよい」場合なので、近道を用意しておくことは全体の速さに直結します。

また、近道の判定は大きさの比較 1 回だけです。木をたどったり、節を組み替えたりしないので、判定そのものが軽く済みます。

そして、重い処理を別の関数に分けたことで、この関数は短く読みやすくなっています。読む人は「大丈夫なら何もしない」という一番大事な部分を、すぐに理解できます。

## まとめ

- 釣り合いが保たれていれば、判定だけで済ませられる。
- 重い処理は、本当に必要なときだけ呼ぶ。
- 頻繁に呼ばれる関数では、近道の速さが全体の速さになる。
