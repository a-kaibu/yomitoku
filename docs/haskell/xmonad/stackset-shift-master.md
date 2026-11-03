---
title: "フォーカスした窓をマスターにして、他の窓の順番は保つ「shiftMaster」"
description: "xmonad の shiftMaster。フォーカスした窓を先頭に移すが、他の窓の並びは元の順番のまま保つ。swapMaster と違い、窓は順に押し下げられる。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [551, 554]
function: "shiftMaster"
difficulty: 3
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`shiftMaster` は、フォーカスした窓をマスター（先頭）に移します。他の窓は、元の順番を保ったまま、後ろへ押し下げられます。

前の記事の `swapMaster` は、マスターと入れ替えるだけでした。こちらは、入れ替えるのではなく、窓の列を「押し下げる」動きです。

## コード

::: code-group

```haskell:line-numbers=551 [日本語訳]
shiftMaster :: StackSet i l a s sd -> StackSet i l a s sd
shiftMaster = modify' $ \c -> case c of
    Stack _ [] _ -> c     -- すでにマスターなら、何もしない。
    Stack t ls rs -> Stack t [] (reverse ls ++ rs)
```

```haskell:line-numbers=551 [原文]
shiftMaster :: StackSet i l a s sd -> StackSet i l a s sd
shiftMaster = modify' $ \c -> case c of
    Stack _ [] _ -> c     -- already master.
    Stack t ls rs -> Stack t [] (reverse ls ++ rs)
```

:::

## 前提知識

- **`Stack t ls rs`**: 現在の窓 `t`、左側の並び `ls`（近い順）、右側の並び `rs` です。
- **`reverse`**: リストの順番を逆にする関数です。
- **`++`**: 2 つのリストをつなぐ演算子です。
- **マスター**: 左側が空のとき、フォーカスの窓がマスターです。

## 何をしているか

### 1. すでにマスターなら何もしない

::: code-group

```haskell:line-numbers=553 [日本語訳]
    Stack _ [] _ -> c     -- すでにマスターなら、何もしない。
```

```haskell:line-numbers=553 [原文]
    Stack _ [] _ -> c     -- already master.
```

:::

左側が空なら、フォーカスの窓はもうマスターです。何も変えずに返します。

### 2. 左側を逆順にして、右側の前に付ける

```haskell:line-numbers=554
    Stack t ls rs -> Stack t [] (reverse ls ++ rs)
```

左側 `ls` を `reverse` すると、いちばん奥の窓が先頭に来ます。その並びを、右側 `rs` の前に付けます。フォーカスの窓 `t` は、左側を空にして先頭に置きます。

つまり、左側にあった窓は、元の順番で右側へ送られます。マスターとフォーカスは、同じ窓になります。

## ここがすごい

`swapMaster` は、マスターとフォーカスを入れ替えるので、元のマスターの位置が変わります。こちらは、フォーカスを先頭に送りつつ、他の窓の順番を保ちます。どちらの動きも、同じ `Stack` の仕組みで表せています。

また、`reverse ls ++ rs` という式は、「左側を逆にして前に置く」という動きを、そのまま書いています。データの形の意味を、そのまま式として読めます。

## まとめ

- 「入れ替え」と「押し下げ」は、同じデータでも別の式で表せる。
- 左側の並びを逆順にすると、先頭へ送る動きになる。
- 他の要素の順番を保つかどうかで、同じ操作でも結果が変わる。
