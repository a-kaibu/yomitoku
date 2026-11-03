---
title: "左の木だけが大きすぎるときに直す「linkL_」"
description: "link の変種。左の木だけが右の木に比べて大きすぎるかもしれないときに、右の端をたどって釣り合いを直す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4137, 4142]
function: "linkL_"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`linkL_` は、2 本の木 `l` と `r` を真ん中のキー `kx` でつなぐ処理のうち、**左の木だけが大きくなりすぎているかもしれない場合** に使われる関数です。左の木の右の端を下へたどりながら、必要なところだけ釣り合いを直します。

同じことを毎回全部調べ直すと遅くなるので、`link` は「どちらが大きいか」を先に調べて、いちばん小さな仕事で済む関数を選んでいます。`linkL_` はその 1 つです。

## コード

```haskell:line-numbers=4137
linkL_ :: k -> a -> Map k a -> Int -> Map k a -> Map k a
linkL_ kx x l !rsz r = case l of
  Bin lsz lkx lx ll lr
    | delta*rsz < lsz -> balanceR lkx lx ll (linkL_ kx x lr rsz r)
    | otherwise -> Bin (1+lsz+rsz) kx x l r
  Tip -> Bin (1+rsz) kx x Tip r
```

## 前提知識

- **関数の引数に `!` を付ける**: `!rsz` は、引数 `rsz` をすぐに計算させる印です。ここでは大きさの数値を毎回確定させて、遅延（あとで計算すること）による無駄な処理を防いでいます。
- **`Int`**: 固定長の整数型です。木の大きさは `Int` で表します。
- **`case ... of`**: 値の形で場合分けする式です。関数の引数のパターンマッチと似ていますが、途中の値に対して使えます。
- **再帰呼び出し**: 関数が自分自身を呼ぶことです。木の深さ分だけ呼び出しが進みます。

## 何をしているか

### 1. 入口のラッパー `linkL`

親の関数 `linkL` は、右の木が空かどうかで振り分けるだけです。

```haskell:line-numbers=4132
linkL :: k -> a -> Map k a -> Map k a -> Map k a
linkL kx x l r = case r of
  Tip -> insertMax kx x l
  Bin rsz _ _ _ _ -> linkL_ kx x l rsz r
```

右が空なら、左の最も大きいキーより大きい位置に 1 件足します。右が空でなければ、その大きさ `rsz` を取り出して `linkL_` に渡します。

### 2. 左の木の右側をたどる

```haskell:line-numbers=4138
linkL_ kx x l !rsz r = case l of
  Bin lsz lkx lx ll lr
    | delta*rsz < lsz -> balanceR lkx lx ll (linkL_ kx x lr rsz r)
    | otherwise -> Bin (1+lsz+rsz) kx x l r
```

左の木 `l` の大きさ `lsz` が、右の大きさ `rsz` の 3 倍より大きいと（`delta*rsz < lsz`）、左の木が重すぎるので、左の木の右側の部分 `lr` に対して同じ処理を繰り返します。たどり終わった後で `balanceR` が木を組み直します。

逆に、まだ釣り合っていれば、`l` と `r` の間に `kx` を置いた新しい節 `Bin (1+lsz+rsz) kx x l r` を作ります。

### 3. 空の木にぶつかったとき

```haskell:line-numbers=4142
  Tip -> Bin (1+rsz) kx x Tip r
```

左がたどった先で空の木 `Tip` になったら、そこに `kx` を置いた節を作ります。大きさは `1+rsz` で、足す 1 は `kx` の分です。

## ここがすごい

`linkL_` は「左の木だけを見ればいい」場合に特化しています。`link` が両方の大きさを比べて選んだあとで使われるので、比べる回数を減らせます。

もし左右どちらが重くなるか分からない汎用の処理を 1 つだけ書くと、すべての節で両側の大きさを確かめることになり、無駄が増えます。関数を役割ごとに分けることで、通常の処理を速く、そして読みやすくしています。

また、関数の名前の `_` は「内部用の補助」を意味する慣習です。外から使うのは `linkL` で、細かい再帰は `linkL_` に隠れています。

## まとめ

- 木をつなぐときは、どちらが大きいかで処理を変えると無駄が減る。
- 再帰で木の右端をたどり、釣り合いを直すのが基本の形。
- 外向けの関数と内部の補助関数を分けると、読む人が迷いにくい。
- `!` を付けると、大きさの計算を早めに確定させられる。
