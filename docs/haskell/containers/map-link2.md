---
title: "真ん中のキーがない 2 本の木を、1 本にまとめる"
description: "キーの順序だけが決まっている 2 本の木を、真ん中のキーなしで 1 本につなぐ関数 link2。小さいほうを先に、必要な分だけ差し込む。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4175, 4181]
function: "link2"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`link2` は、2 本の `Map` を受け取り、1 本にまとめる関数です。`link` と違って、間に入れるキーと値が手元にありません。その代わり、**左の木のすべてのキーが右の木のすべてのキーより小さい** ことが前提です。

たとえば「1 から 10 までを持つ木」と「11 から 20 までを持つ木」を合わせるような場面で使います。

## コード

```haskell:line-numbers=4175
link2 :: Map k a -> Map k a -> Map k a
link2 Tip r   = r
link2 l Tip   = l
link2 l@(Bin lsz lkx lx ll lr) r@(Bin rsz rkx rx rl rr)
  | delta*lsz < rsz = balanceL rkx rx (link2R_ lsz l rl) rr
  | delta*rsz < lsz = balanceR lkx lx ll (link2L_ lr rsz r)
  | otherwise = glue l r
```

## 前提知識

- **`Map k a` の型**: `k` はキーの型、`a` は値の型です。`Map k a -> Map k a -> Map k a` は「2 つの Map を受け取って、1 つの Map を返す」という意味です。
- **`Tip` の場合の先行処理**: `link2 Tip r = r` は「左が空なら右をそのまま返す」という意味です。`Tip` は空の木です。
- **`glue`**: 2 本の木を、キーの順序を保ったままつなぐ別の関数です。後の記事で扱います。

## 何をしているか

### 1. 空の場合は、もう一方をそのまま返す

```haskell:line-numbers=4176
link2 Tip r   = r
link2 l Tip   = l
```

どちらかが空なら、そのまま残りの木を返します。つなぐ仕事が何も無いからです。

### 2. 大きさを比べて、どちらに寄せるかを決める

```haskell:line-numbers=4178
link2 l@(Bin lsz lkx lx ll lr) r@(Bin rsz rkx rx rl rr)
  | delta*lsz < rsz = balanceL rkx rx (link2R_ lsz l rl) rr
  | delta*rsz < lsz = balanceR lkx lx ll (link2L_ lr rsz r)
  | otherwise = glue l r
```

両方に節がある場合は、`link` と同じように大きさを比べます。

- 右が大きすぎるなら（`delta*lsz < rsz`）、右の木の左側に左の木を差し込みます。`link2R_` が担当します。
- 左が大きすぎるなら（`delta*rsz < lsz`）、左の木の右側に右の木を差し込みます。`link2L_` が担当します。
- どちらでもないなら、2 本の木の端をつないで 1 本にできるので、`glue l r` を使います。

`link` との違いは、最後の `otherwise` で `glue` を使う点です。真ん中に置くキーが無いので、新しい節を作らずに、端と端を直接つなぎます。

## ここがすごい

真ん中のキーが無いのに、木の形を保ちながらつなげるのは、キーの順序が決まっているからこそ可能です。左の木の全キーは右の木より小さいので、どこでつないでも探索の順番は崩れません。

また、`link2` は「どちらも大きさが釣り合っている」場合に `glue` で即座につなぎ、片方が大きいときだけ再帰をたどります。作業量を、必要な分だけに抑える作りです。

## まとめ

- キーの順序が決まっている 2 本の木は、真ん中のキーなしでもつなげられる。
- 大きさを比べて、必要なときだけ再帰をたどる。
- 釣り合っているときは、端を直接つなぐ `glue` で済ませる。
