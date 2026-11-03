---
title: "真ん中の要素を支点に、2 つの木を大きさの釣り合いを保ってつなぐ"
description: "containers の Set で、真ん中の要素と左右の木を受け取り 1 本の木にする link。左右の大きさの差で、どちらを回転させるかを決めている。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [1768, 1774]
function: "link"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム]
---

## ひとことで

`link` は、「左の木」「真ん中の要素 `x`」「右の木」を受け取って、1 本の平衡な木を作る関数です。左の木のすべての要素が `x` より小さく、右の木のすべての要素が `x` より大きいことが前提になっています。

## コード

```haskell:line-numbers=1768
link :: a -> Set a -> Set a -> Set a
link x Tip r  = insertMin x r
link x l Tip  = insertMax x l
link x l@(Bin lsz lx ll lr) r@(Bin rsz rx rl rr)
  | delta*lsz < rsz = balanceL rx (linkR_ x lsz l rl) rr
  | delta*rsz < lsz = balanceR lx ll (linkL_ x lr rsz r)
  | otherwise = Bin (1+lsz+rsz) x l r
```

## 前提知識

- **木（tree）**: 要素を枝分かれさせて保存するデータ構造です。`Bin` は枝がある節点、`Tip` は空の木を表します。
- **平衡（バランス）**: 左右の大きさの差が大きくなりすぎないように保つことです。偏ると検索が遅くなるので、大事な性質です。
- **ガード（`|`）**: 条件式を上から順に調べ、最初に当たったものを実行する書き方です。
- **`@`（as パターン）**: `l@(Bin ...)` のように、パターンに一致した値全体にも名前を付けられる書き方です。

## 何をしているか

### 1. どちらかが空なら、もう一方に 1 つ足す

```haskell:line-numbers=1769
link x Tip r  = insertMin x r
link x l Tip  = insertMax x l
```

左が空なら、`x` を右の木の最小要素として差し込みます。右が空なら、`x` を左の木の最大要素として差し込みます。どちらも、もう一方の木がそのまま土台になります。

### 2. 大きさの差で回転の仕方を選ぶ

```haskell:line-numbers=1771
link x l@(Bin lsz lx ll lr) r@(Bin rsz rx rl rr)
  | delta*lsz < rsz = balanceL rx (linkR_ x lsz l rl) rr
  | delta*rsz < lsz = balanceR lx ll (linkL_ x lr rsz r)
  | otherwise = Bin (1+lsz+rsz) x l r
```

`lsz` と `rsz` は、それぞれの木の要素数です。右の木が左より極端に大きいなら、右の木の左側を `x` と左の木でつなぎ直します。逆に左が大きいなら、左の木の右側を使います。どちらでもない釣り合いの良い場合は、`x` を真ん中に置いて `Bin` で 1 つにまとめます。

`delta` は「どれくらい差が開いたら直すか」を決める数です。

## ここがすごい

素直に作るなら、木を 1 本ずつ要素として挿入し直す方法があります。しかし、それでは要素数に比例して時間がかかります。`link` は、木の根の部分だけを見て、大きい方の木の内側へ `x` を入れていくので、高さに比例した時間で済みます。

さらに、大きさの差に応じて左右どちらを直すかを選ぶので、平衡を保つ処理がとても少なく済みます。

## まとめ

- 2 つの木を、真ん中の値を使って 1 本にまとめられる。
- 空かどうかを先に調べると、場合分けがきれいになる。
- 大きさの差を見て、直す場所を最小限にしている。
