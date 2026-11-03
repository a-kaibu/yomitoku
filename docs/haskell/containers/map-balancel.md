---
title: "左が重くなった木を、回転させて直す"
description: "Data.Map の balanceL_ は、左の木が重くなりすぎたときに、1 回または 2 回の回転で木の形を整える。小さい木の場合も、場合分けで書き分けている。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4388, 4406]
function: "balanceL_"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`balanceL_` は、`balanceL` の近道では直せなかったとき、本格的に木の形を整える関数です。木を**回転**させて、左側に寄りすぎた形を、なるべく釣り合った形に戻します。

木の回転とは、節の上下関係を入れ替えて、高さの偏りを減らす操作です。この関数は、回転を 1 回で済ませるか、2 回必要かを、木の形で判断しています。

## コード

```haskell:line-numbers=4388
balanceL_ :: k -> a -> Map k a -> Map k a -> Map k a
balanceL_ k x l r = case r of
  Tip -> case l of
           Tip -> Bin 1 k x Tip Tip
           (Bin _ _ _ Tip Tip) -> Bin 2 k x l Tip
           (Bin _ lk lx Tip (Bin _ lrk lrx _ _)) -> Bin 3 lrk lrx (Bin 1 lk lx Tip Tip) (Bin 1 k x Tip Tip)
           (Bin _ lk lx ll@(Bin _ _ _ _ _) Tip) -> Bin 3 lk lx ll (Bin 1 k x Tip Tip)
           (Bin ls lk lx ll@(Bin lls _ _ _ _) lr@(Bin lrs lrk lrx lrl lrr))
             | lrs < ratio*lls -> Bin (1+ls) lk lx ll (Bin (1+lrs) k x lr Tip)
             | otherwise -> Bin (1+ls) lrk lrx (Bin (1+lls+size lrl) lk lx ll lrl) (Bin (1+size lrr) k x lrr Tip)

  (Bin rs _ _ _ _) -> case l of
           Tip -> Bin (1+rs) k x Tip r

           (Bin ls lk lx ll lr) -> case (ll, lr) of
                   (Bin lls _ _ _ _, Bin lrs lrk lrx lrl lrr)
                     | lrs < ratio*lls -> Bin (1+ls+rs) lk lx ll (Bin (1+rs+lrs) k x lr r)
                     | otherwise -> Bin (1+ls+rs) lrk lrx (Bin (1+lls+size lrl) lk lx ll lrl) (Bin (1+rs+size lrr) k x lrr r)
                   (_, _) -> error "Failure in Data.Map.balanceL_"
```

## 前提知識

- **二分探索木の回転**: 木の節を持ち上げたり下ろしたりして、左右の高さのバランスを変える操作です。キーの順序は変わりません。
- **`case r of`**: 右の木が `Tip` かどうかで、大きく 2 つに分けています。
- **`ratio`**: 値は `2` の定数です。`lrs < ratio*lls` のように使い、内側の大きさを比べる基準になります。
- **`error`**: 「ここには来ないはず」という状況で、プログラムを止めるための関数です。

## 何をしているか

### 1. 右が空のときの場合分け

```haskell:line-numbers=4389
balanceL_ k x l r = case r of
  Tip -> case l of
           Tip -> Bin 1 k x Tip Tip
           (Bin _ _ _ Tip Tip) -> Bin 2 k x l Tip
           (Bin _ lk lx Tip (Bin _ lrk lrx _ _)) -> Bin 3 lrk lrx (Bin 1 lk lx Tip Tip) (Bin 1 k x Tip Tip)
           (Bin _ lk lx ll@(Bin _ _ _ _ _) Tip) -> Bin 3 lk lx ll (Bin 1 k x Tip Tip)
           (Bin ls lk lx ll@(Bin lls _ _ _ _) lr@(Bin lrs lrk lrx lrl lrr))
             | lrs < ratio*lls -> Bin (1+ls) lk lx ll (Bin (1+lrs) k x lr Tip)
             | otherwise -> Bin (1+ls) lrk lrx (Bin (1+lls+size lrl) lk lx ll lrl) (Bin (1+size lrr) k x lrr Tip)
```

右が空なのに左が重いときは、左の木の形を見て、小さな木の形を 1 つずつ書き分けています。たとえば左が 2 段あるなら、根を入れ替えるだけで釣り合います。

こうした小さな形は、一般的な計算に頼らず、直接書いたほうが速くて分かりやすいので、手で書き並べてあります。

### 2. 右が空でないときの回転

```haskell:line-numbers=4399
  (Bin rs _ _ _ _) -> case l of
           Tip -> Bin (1+rs) k x Tip r

           (Bin ls lk lx ll lr) -> case (ll, lr) of
                   (Bin lls _ _ _ _, Bin lrs lrk lrx lrl lrr)
                     | lrs < ratio*lls -> Bin (1+ls+rs) lk lx ll (Bin (1+rs+lrs) k x lr r)
                     | otherwise -> Bin (1+ls+rs) lrk lrx (Bin (1+lls+size lrl) lk lx ll lrl) (Bin (1+rs+size lrr) k x lrr r)
                   (_, _) -> error "Failure in Data.Map.balanceL_"
```

右にも節があるとき、左の木 `Bin ls lk lx ll lr` の中身を見ます。

- 左の左 `ll` の大きさ `lls` と、左の右 `lr` の大きさ `lrs` を比べます。
- `lrs < ratio*lls` なら、`ll` の側が十分に大きいので、**1 回の回転** で済みます。`lr` を右の木に付け替えるだけです。
- そうでなければ、`lr` の中身まで見て、**2 回の回転** で整えます。`lrl` と `lrr` に分けて、新しい根 `lrk` の下に配り直します。

回転のたびに、各節の大きさも `1+ls+rs` などの式で計算し直しています。

## ここがすごい

この関数は、木の形を場合分けで書き分けているので、どの形が来ても同じ規則で釣り合いを取れます。しかも、一般的なループや、木の再構成ライブラリに頼っていません。

`ratio` で「どちらの回転にするか」を決めている点も重要です。1 回で済む場合にむやみに 2 回回すと、無駄な作業が増えます。ratio という 1 つの基準で、その判断をしています。

さらに、`error` を置いて「あり得ない形」を明示的に止めています。バグがあったときに、どこで崩れたかすぐ分かるようにする防御的なプログラミングです。

## まとめ

- 木の釣り合いは、回転という操作で直せる。
- 回転を 1 回にするか 2 回にするかは、大きさの比で決める。
- 「あり得ない形」は `error` で止めると、バグを見つけやすい。
