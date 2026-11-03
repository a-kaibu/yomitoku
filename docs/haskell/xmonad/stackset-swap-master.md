---
title: "フォーカスした窓を、マスターの位置と入れ替える"
description: "xmonad の swapMaster。フォーカスした窓を先頭（マスター）へ移し、元のマスターを残りの並びに送る。フォーカスは同じ窓に留まる。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [540, 543]
function: "swapMaster"
difficulty: 3
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`swapMaster` は、フォーカスした窓と、マスター（いちばん大きく表示される先頭の窓）を入れ替えます。フォーカスは、移した窓に留まります。

xmonad では、マスターの位置が特別です。この関数は、その位置へ窓を素早く動かすための操作です。

## コード

::: code-group

```haskell:line-numbers=540 [日本語訳]
swapMaster :: StackSet i l a s sd -> StackSet i l a s sd
swapMaster = modify' $ \c -> case c of
    Stack _ []     _  -> c    -- すでにマスターなら、何もしない。
    Stack t (l:ls) rs -> Stack t [] (xs ++ x : rs) where (x :| xs) = NE.reverse (l :| ls)
```

```haskell:line-numbers=540 [原文]
swapMaster :: StackSet i l a s sd -> StackSet i l a s sd
swapMaster = modify' $ \c -> case c of
    Stack _ []     _  -> c    -- already master.
    Stack t (l:ls) rs -> Stack t [] (xs ++ x : rs) where (x :| xs) = NE.reverse (l :| ls)
```

:::

## 前提知識

- **マスター**: `Stack` の左側の並びの、いちばん奥（最後に残る要素）が、画面上のマスターになります。`Stack t [] rs` のとき、フォーカスがすでにマスターです。
- **`NE.reverse`**: 空でないリストを逆順にする関数です。
- **`(x :| xs)`**: 空でないリストを、先頭 `x` と残り `xs` に分ける書き方です。
- **`modify'`**: 現在の `Stack` を変換する関数です。

## 何をしているか

### 1. 既にマスターなら何もしない

::: code-group

```haskell:line-numbers=542 [日本語訳]
    Stack _ []     _  -> c    -- すでにマスターなら、何もしない。
```

```haskell:line-numbers=542 [原文]
    Stack _ []     _  -> c    -- already master.
```

:::

左側が空なら、フォーカスはもうマスターです。元の `Stack` をそのまま返します。

### 2. 左側を並べ直して、フォーカスをマスターへ送る

```haskell:line-numbers=543
    Stack t (l:ls) rs -> Stack t [] (xs ++ x : rs) where (x :| xs) = NE.reverse (l :| ls)
```

左側 `l:ls` を逆順にすると、先頭がマスター `x` になります。残りの `xs` と、元のフォーカス `t`、右側 `rs` をつないで、新しい右側を作ります。フォーカスは空の左側に置かれ、マスターになります。

具体例で見ます。`Stack 3 [2,1] [4,5]`（全体の並びは `[1,2,3,4,5]`）は、`Stack 3 [] [2,1,4,5]` になります。並びは `[3,2,1,4,5]` となり、マスターの `1` とフォーカスの `3` が入れ替わります。

## ここがすごい

左側を 1 回逆順にするだけで、マスターの位置と、他の窓の順番を同時に決めています。他の窓の並びは崩れません。

また、フォーカスが同じ窓に留まるので、ユーザーは作業を続けられます。「窓を動かしても、見ている窓は変わらない」という自然さを、データの形で保証しています。

## まとめ

- 特定の位置へ要素を動かすには、左側の並びを逆順にすると楽になる。
- 既に目的の位置にあるときは、何もしない早い戻りで済ませる。
- 移動したあとも、フォーカスが同じ要素に留まるように作る。
