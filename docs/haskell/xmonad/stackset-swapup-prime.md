---
title: "左隣とフォーカスを入れ替える「swapUp'」"
description: "xmonad の Stack で、フォーカスしている要素と左隣の要素を入れ替える swapUp'。フォーカスは同じ要素に留まる。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [389, 391]
function: "swapUp'"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`swapUp'` は、フォーカスしている要素と、その左隣の要素の位置を入れ替える関数です。フォーカス自体は、同じウィンドウの上に留まります。

前の記事の `focusUp'` は、フォーカスが動くだけです。こちらは、要素の並び順そのものを変えます。ウィンドウを上へ動かす、というイメージです。

## コード

```haskell:line-numbers=389
swapUp' :: Stack a -> Stack a
swapUp'  (Stack t (l:ls) rs) = Stack t ls (l:rs)
swapUp'  (Stack t []     rs) = Stack t (reverse rs) []
```

## 前提知識

- **フォーカスと並び順の違い**: `focusUp'` は「どの要素を見ているか」を動かします。`swapUp'` は「要素の並び」を動かします。
- **`Stack t ls rs`**: 現在の要素 `t`、左側 `ls`、右側 `rs` です。
- **`(l:ls)`**: 左側の先頭 `l` と、残りの左側 `ls` に分けて取り出すパターンです。
- **`reverse`**: 左側が空のとき、右側を逆にして並べ直すために使います。

## 何をしているか

### 1. 左側に要素がある場合

```haskell:line-numbers=390
swapUp'  (Stack t (l:ls) rs) = Stack t ls (l:rs)
```

フォーカスの要素 `t` は動きません。左側の先頭 `l` を取り出し、その要素を右側の先頭に送ります。結果として、`t` と `l` の位置が入れ替わります。

具体例で見ます。`Stack 3 [2,1] [4,5]` を入れ替えると、`Stack 3 [1] [2,4,5]` になります。フォーカスは 3 のままで、2 が右側へ移りました。

### 2. 左側が空の場合

```haskell:line-numbers=391
swapUp'  (Stack t []     rs) = Stack t (reverse rs) []
```

左側が空のときは、左隣が存在しません。その代わりに、右側を逆順にして、左側へ送るように並べ直します。ぐるっと回り込む動きです。

## ここがすごい

フォーカスを留めたまま、周りの要素だけを動かすことで、ウィンドウの並びをユーザーが自然に変えられます。`focusUp'` と `swapUp'` は、片方がフォーカス、もう片方が並び順を担当していて、役割が分かれています。

また、この関数も、左側が空のときだけ特別な処理をしています。通常の場合は、先頭の付け替えだけで済むので、速く動きます。

## まとめ

- フォーカスの移動と、要素の並び替えは別の操作として分けると分かりやすい。
- 並び替えは、フォーカスの要素を留めたまま、隣の要素と位置を入れ替えることで表せる。
- 端のときの回り込みは、リストを逆順にして並べ直すと書ける。
