---
title: "フォーカスを、マスターの窓へ移す「focusMaster」"
description: "xmonad の focusMaster。フォーカスを先頭（マスター）の窓へ移す。窓の並び自体は変えず、見ている位置だけを動かす。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [557, 560]
function: "focusMaster"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`focusMaster` は、フォーカスをマスター（先頭の窓）へ移す関数です。窓の並び自体は変わらず、フォーカスの位置だけが動きます。

前の記事の `swapMaster` は窓を動かしましたが、こちらは見ている位置だけを動かします。同じマスターの位置に対して、「窓を動かす」と「見る」を分けた操作です。

## コード

```haskell:line-numbers=557
focusMaster :: StackSet i l a s sd -> StackSet i l a s sd
focusMaster = modify' $ \c -> case c of
    Stack _ []     _  -> c
    Stack t (l:ls) rs -> Stack x [] (xs ++ t : rs) where (x :| xs) = NE.reverse (l :| ls)
```

## 前提知識

- **フォーカスと並び**: フォーカスは、現在見ている窓です。並びは、窓の順番です。
- **`NE.reverse`**: 空でないリストを逆順にする関数です。`NE` は `Data.List.NonEmpty` の略です。
- **`(x :| xs)`**: 先頭と残りに分ける、空でないリストの書き方です。
- **`modify'`**: 現在の `Stack` を変換する関数です。

## 何をしているか

### 1. すでにマスターなら何もしない

```haskell:line-numbers=558
focusMaster = modify' $ \c -> case c of
    Stack _ []     _  -> c
```

左側が空なら、フォーカスはすでにマスターです。そのまま返します。

### 2. マスターをフォーカスにし、残りを並べ直す

```haskell:line-numbers=560
    Stack t (l:ls) rs -> Stack x [] (xs ++ t : rs) where (x :| xs) = NE.reverse (l :| ls)
```

左側の並びを逆順にして、先頭をマスター `x` とします。`x` をフォーカスにして、左側は空にします。残りの窓 `xs`、元のフォーカス `t`、右側 `rs` を順につないで、新しい右側を作ります。

窓の順番は、全体として元のまま保たれます。変わったのは、フォーカスの位置だけです。

## ここがすごい

フォーカスを移すと、窓の並びを壊さずに済むように、右側の並びも組み直しています。見る位置を変えても、画面に並ぶ順番は同じです。ユーザーは、順番を変えずに、マスターの窓へすぐ戻れます。

また、`Stack _ [] _` の場合を先に確かめて、何もしない形を最初に書いています。特別な場合を先頭で扱う書き方が、この関数の読みやすさです。

## まとめ

- 見る位置と並びの順番は、別の操作として扱うと分かりやすい。
- 逆順にすると、先頭の要素を取り出して、フォーカスにできる。
- 特別な場合は先頭で返すと、残りの処理が単純になる。
