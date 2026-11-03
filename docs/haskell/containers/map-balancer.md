---
title: "右が重くなった木を、回転させて直す"
description: "balanceR_ は balanceL_ の左右対称版。右の木が重くなりすぎたときに、回転で木の形を整える。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4418, 4436]
function: "balanceR_"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`balanceR_` は、右の木が重くなりすぎたときに、回転で木の形を整える関数です。`balanceL_` の左右を入れ替えた、対称な関数になっています。

右の木が重いときは、右の木の**左側**を持ち上げるような回転が必要になります。この記事では、その判断の仕組みを読みます。

## コード

```haskell:line-numbers=4418
balanceR_ :: k -> a -> Map k a -> Map k a -> Map k a
balanceR_ k x l r = case l of
  Tip -> case r of
           Tip -> Bin 1 k x Tip Tip
           (Bin _ _ _ Tip Tip) -> Bin 2 k x Tip r
           (Bin _ rk rx Tip rr@(Bin _ _ _ _ _)) -> Bin 3 rk rx (Bin 1 k x Tip Tip) rr
           (Bin _ rk rx (Bin _ rlk rlx _ _) Tip) -> Bin 3 rlk rlx (Bin 1 k x Tip Tip) (Bin 1 rk rx Tip Tip)
           (Bin rs rk rx rl@(Bin rls rlk rlx rll rlr) rr@(Bin rrs _ _ _ _))
             | rls < ratio*rrs -> Bin (1+rs) rk rx (Bin (1+rls) k x Tip rl) rr
             | otherwise -> Bin (1+rs) rlk rlx (Bin (1+size rll) k x Tip rll) (Bin (1+rrs+size rlr) rk rx rlr rr)

  (Bin ls _ _ _ _) -> case r of
           Tip -> Bin (1+ls) k x l Tip

           (Bin rs rk rx rl rr) -> case (rl, rr) of
                   (Bin rls rlk rlx rll rlr, Bin rrs _ _ _ _)
                     | rls < ratio*rrs -> Bin (1+ls+rs) rk rx (Bin (1+ls+rls) k x l rl) rr
                     | otherwise -> Bin (1+ls+rs) rlk rlx (Bin (1+ls+size rll) k x l rll) (Bin (1+rrs+size rlr) rk rx rlr rr)
                   (_, _) -> error "Failure in Data.Map.balanceR_"
```

## 前提知識

- **対称性**: `balanceL_` と `balanceR_` は、ほとんど同じ構造をしています。違うのは、「左右どちらを先に見るか」と「回転の向き」だけです。
- **`case l of` で始まる**: `balanceL_` は右から見始めましたが、こちらは左が空かどうかで場合分けを始めます。
- **`rr@(...)` や `rl@(...)`**: 右の木の中の部分に名前を付けて、後で使えるようにしています。
- **`ratio`**: 値は `2` です。`rls < ratio*rrs` のように比べて、回転の回数を決めます。

## 何をしているか

### 1. 左が空のときの場合分け

```haskell:line-numbers=4419
balanceR_ k x l r = case l of
  Tip -> case r of
           Tip -> Bin 1 k x Tip Tip
           (Bin _ _ _ Tip Tip) -> Bin 2 k x Tip r
           (Bin _ rk rx Tip rr@(Bin _ _ _ _ _)) -> Bin 3 rk rx (Bin 1 k x Tip Tip) rr
           (Bin _ rk rx (Bin _ rlk rlx _ _) Tip) -> Bin 3 rlk rlx (Bin 1 k x Tip Tip) (Bin 1 rk rx Tip Tip)
           (Bin rs rk rx rl@(Bin rls rlk rlx rll rlr) rr@(Bin rrs _ _ _ _))
             | rls < ratio*rrs -> Bin (1+rs) rk rx (Bin (1+rls) k x Tip rl) rr
             | otherwise -> Bin (1+rs) rlk rlx (Bin (1+size rll) k x Tip rll) (Bin (1+rrs+size rlr) rk rx rlr rr)
```

左が空なのに右が重いときは、右の木の形を見て、小さな形を書き分けています。`balanceL_` の対応する部分と、同じ考え方です。

### 2. 左にも節があるときの回転

```haskell:line-numbers=4429
  (Bin ls _ _ _ _) -> case r of
           Tip -> Bin (1+ls) k x l Tip

           (Bin rs rk rx rl rr) -> case (rl, rr) of
                   (Bin rls rlk rlx rll rlr, Bin rrs _ _ _ _)
                     | rls < ratio*rrs -> Bin (1+ls+rs) rk rx (Bin (1+ls+rls) k x l rl) rr
                     | otherwise -> Bin (1+ls+rs) rlk rlx (Bin (1+ls+size rll) k x l rll) (Bin (1+rrs+size rlr) rk rx rlr rr)
                   (_, _) -> error "Failure in Data.Map.balanceR_"
```

- 右の木 `Bin rs rk rx rl rr` の中で、`rl`（右の左側）と `rr`（右の右側）の大きさを比べます。
- `rls < ratio*rrs` なら、`rl` の側が小さいので、**1 回の回転** で整えます。新しい根 `rk` の左に、`l` と `rl` をつないだ節を置きます。
- そうでなければ、`rl` の中身をさらに見て、**2 回の回転** で整えます。

どちらの場合も、最後に作る節の大きさを `1+ls+rs` などで計算し直しています。

## ここがすごい

`balanceL_` と `balanceR_` が対称に書かれているので、読む人は片方を理解すれば、もう片方もすぐに読めます。左右の違いを、名前と向きだけで表しています。

また、回転の判断を `ratio` という 1 つの値にまとめている点も、保守しやすさにつながります。釣り合いの基準を変えたいときは、この値を変えれば済みます。

この関数の本体は、ふつう挿入や削除のあとに 1 回だけ呼ばれます。そのため、回転の判断や節の作り直しは、木の高さの分だけ起きます。木の高さは大きさの対数に抑えられているので、どんなに大きな木でも、この関数が呼ばれる回数はそれほど多くなりません。

## まとめ

- 左右対称な処理は、対称に書くと読みやすく、直しやすい。
- 回転の判断は、大きさの比をまとめた値で行う。
- 「左が空」と「右が空」の場合分けを、同じ順番で並べると、対応関係が見つけやすい。
