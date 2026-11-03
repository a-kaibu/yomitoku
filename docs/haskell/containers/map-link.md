---
title: "真ん中のキーを支点に、2 本の木を 1 本にまとめる"
description: "Data.Map の内部の木 2 本と、間に入るキーを受け取り、大きさの釣り合いを保ったまま 1 本の木にする関数 link。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4122, 4128]
function: "link"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`link` は、キーの小さい順に並んだ 2 本の木 `l` と `r` と、その間に入る 1 組のキーと値 `(kx, x)` を受け取って、1 本の木にまとめる関数です。`l` のキーはすべて `kx` より小さく、`r` のキーはすべて `kx` より大きい、という前提で使われます。

`Data.Map` は内部で、要素を二分探索木として持っています。木を単純につなぐと片方に偏ってしまい、探索が遅くなります。`link` は木の大きさを比べながら、「どこに差し込めば釣り合いが崩れないか」を決めます。

## コード

```haskell:line-numbers=4122
link :: k -> a -> Map k a -> Map k a -> Map k a
link kx x Tip r  = insertMin kx x r
link kx x l Tip  = insertMax kx x l
link kx x l@(Bin lsz lkx lx ll lr) r@(Bin rsz rkx rx rl rr)
  | delta*lsz < rsz = balanceL rkx rx (linkR_ kx x lsz l rl) rr
  | delta*rsz < lsz = balanceR lkx lx ll (linkL_ kx x lr rsz r)
  | otherwise       = Bin (1+lsz+rsz) kx x l r
```

## 前提知識

- **データ型と `data` 宣言**: `data` は値の形を決める宣言です。`Map k a` は次の 2 つの形のどちらかになります。

```haskell:line-numbers=468
data Map k a  = Bin {-# UNPACK #-} !Size !k a !(Map k a) !(Map k a)
              | Tip

```

  `Bin` は「大きさ・キー・値・左の木・右の木」を持つ節（ノード）、`Tip` は空の木です。
- **パターンマッチ**: 関数の引数の形で処理を振り分けます。`link kx x Tip r` は「左が空の場合」を表します。
- **`l@(...)`（as パターン）**: 形を調べながら、その値全体に `l` という名前も付けます。
- **ガード `|`**: 条件を上から順に調べて、最初に真になった行の式を使います。`otherwise` は必ず真になる条件です。
- **`!`（厳密評価）**: 値をすぐに計算させる印です。大きさの数値を遅延させずに使うために付いています。

## 何をしているか

### 1. どちらかが空なら、もう一方に 1 件足すだけ

```haskell:line-numbers=4123
link kx x Tip r  = insertMin kx x r
link kx x l Tip  = insertMax kx x l
```

左が `Tip`（空）なら、右の木の最も小さいキーよりさらに小さい位置に `kx` を入れます。右が空なら、左の最も大きいキーより大きい位置に入れます。これは「1 件の挿入」と同じ仕事なので、既存の `insertMin` と `insertMax` に任せています。

### 2. 両方が空でないなら、大きさを比べる

```haskell:line-numbers=4125
link kx x l@(Bin lsz lkx lx ll lr) r@(Bin rsz rkx rx rl rr)
  | delta*lsz < rsz = balanceL rkx rx (linkR_ kx x lsz l rl) rr
  | delta*rsz < lsz = balanceR lkx lx ll (linkL_ kx x lr rsz r)
  | otherwise       = Bin (1+lsz+rsz) kx x l r
```

`lsz` は左の木の大きさ、`rsz` は右の木の大きさです。`delta` は次の定数で、値は `3` です。

```haskell:line-numbers=4301
delta,ratio :: Int
delta = 3
ratio = 2
```

- 右が左の 3 倍より大きい（`delta*lsz < rsz`）なら、右の木の左側に `l` を差し込み、最後に `balanceL` で釣り合いを直します。
- 左が右の 3 倍より大きい（`delta*rsz < lsz`）なら、その逆をします。
- どちらでもなければ、そのまま `kx` を真ん中にした新しい節を作ります。新しい木の大きさは `1+lsz+rsz` で、足す 1 は `kx` 自身の分です。

具体的に見てみます。左の大きさが 1、右の大きさが 4 だとすると、`3*1 < 4` なので 1 つめの枝に入ります。右の木は左に偏りやすいので、そこに左の木をぶら下げ、大きさの偏りを `balanceL` で直します。

## ここがすごい

素直につなぐだけなら、`Bin` の節を 1 つ作れば済みます。しかし木の片方が大きく、もう片方が小さいと、できた木は細長くなり、キーを探すのに時間がかかります。

`link` は「大きいほうの木の端を少しだけたどる」ことで、小さいほうの木を入れる場所を決めます。たどるのは大きいほうの木の一部だけなので、全部を作り直す必要はありません。作った後は `balanceL` や `balanceR` を呼んで、木が偏らないように直します。

大きさをすべての節に覚えさせておくのも効いています。左右どちらが重いかを、木をたどらずに `lsz` と `rsz` の比較だけで決められるからです。

## まとめ

- 二分探索木を 2 本つなぐときは、大きさを比べて「どこに差し込むか」を決める。
- 片方が空のときは、1 件の挿入として扱うと簡単になる。
- 大きさを各節に持たせると、釣り合いの判断が速くなる。
- Haskell では、パターンマッチ・ガード・`@` パターンを組み合わせると、場合分けを短く書ける。
