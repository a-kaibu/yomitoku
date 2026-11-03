---
title: "右の木だけが大きすぎるときに直す「linkR_」"
description: "linkL_ の左右対称版。右の木が左の木より大きすぎるかもしれないときに、左の端をたどって釣り合いを直す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4151, 4156]
function: "linkR_"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`linkR_` は、`linkL_` の左右を入れ替えた関数です。**右の木だけが大きくなりすぎているかもしれない場合** に使われ、右の木の左の端をたどって、必要なところで釣り合いを直します。

`Map` の木は、左右どちらかに偏ると探索が遅くなります。そのため、つなぐときは「どちら側が重くなったか」を見て、対応する関数を選びます。

## コード

```haskell:line-numbers=4151
linkR_ :: k -> a -> Int -> Map k a -> Map k a -> Map k a
linkR_ kx x !lsz l r = case r of
  Bin rsz rkx rx rl rr
    | delta*lsz < rsz -> balanceL rkx rx (linkR_ kx x lsz l rl) rr
    | otherwise -> Bin (1+lsz+rsz) kx x l r
  Tip -> Bin (1+lsz) kx x l Tip
```

## 前提知識

- **引数の順番**: `linkR_ kx x !lsz l r` は、キー・値・左の大きさ・左の木・右の木の順に受け取ります。`lsz` だけが大きさの数値です。
- **`case r of`**: 右の木の形で場合分けしています。`Bin` のときは中身を取り出し、`Tip` のときは空の処理をします。
- **ガード**: `| delta*lsz < rsz` の行で、右が重すぎるかを判定します。`otherwise` は残りの場合です。

## 何をしているか

### 1. 入口のラッパー `linkR`

```haskell:line-numbers=4146
linkR :: k -> a -> Map k a -> Map k a -> Map k a
linkR kx x l r = case l of
  Tip -> insertMin kx x r
  Bin lsz _ _ _ _ -> linkR_ kx x lsz l r
```

左の木が空なら、右の木の最も小さいキーより小さい位置に 1 件足します。左が空でないなら、その大きさ `lsz` を取り出して `linkR_` に渡します。

### 2. 右の木の左側をたどる

```haskell:line-numbers=4152
linkR_ kx x !lsz l r = case r of
  Bin rsz rkx rx rl rr
    | delta*lsz < rsz -> balanceL rkx rx (linkR_ kx x lsz l rl) rr
    | otherwise -> Bin (1+lsz+rsz) kx x l r
```

右の木 `r` の大きさ `rsz` が、左の大きさ `lsz` の 3 倍より大きいと（`delta*lsz < rsz`）、右の木の左側 `rl` に対して、同じ処理を繰り返します。たどり終わったら、`balanceL` で右寄りの偏りを直します。

まだ釣り合っていれば、`Bin (1+lsz+rsz) kx x l r` で新しい節を作ります。

### 3. 空の木にぶつかったとき

```haskell:line-numbers=4156
  Tip -> Bin (1+lsz) kx x l Tip
```

右がたどった先で空になったら、左の木 `l` と `kx` をつないだ節を作ります。大きさは `1+lsz` です。

## ここがすごい

`linkL_` と `linkR_` は、ほとんど同じ形をしています。違うのは「どちらの端をたどるか」と「直すときに `balanceL` と `balanceR` のどちらを呼ぶか」だけです。

このように対称な処理を 2 つ書くことは、一見すると重複に見えます。しかし、片方だけ用意すると、もう片方の場合は全部の木をいったん作り直すような遅い方法を使うしかありません。両方の専用関数を用意することで、どちらに偏っても同じ速さで直せます。

## まとめ

- 対称な問題は、対称な関数を 2 つ用意すると、それぞれが単純になる。
- 「どちらが重いか」を先に見て、専用の処理を選ぶと速くなる。
- 右の端をたどるか左の端をたどるかは、`balanceL` と `balanceR` の対応で決まる。
