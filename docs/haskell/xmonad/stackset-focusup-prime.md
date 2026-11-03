---
title: "端では反対側へ回り込む、フォーカスの移動「focusUp'」"
description: "xmonad の Stack で、フォーカスを 1 つ上（左）へ動かす focusUp'。左端を超えたら、全体をまとめ直して右端から回り込む。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [377, 380]
function: "focusUp'"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 関数型]
---

## ひとことで

`focusUp'` は、フォーカスを 1 つ上（左側の隣）へ動かす関数です。左側に要素がまだあれば、単にフォーカスを移します。左端にいるときは、リストの一番反対側（右端）へ回り込みます。

xmonad では、ウィンドウを順番に切り替えるとき、この動きが使われます。端に来たら止まるのではなく、ぐるっと一周する感覚です。

## コード

```haskell:line-numbers=377
focusUp' :: Stack a -> Stack a
focusUp' (Stack t (l:ls) rs) = Stack l ls (t:rs)
focusUp' (Stack t []     rs) = Stack x xs []
  where (x :| xs) = NE.reverse (t :| rs)
```

## 前提知識

- **`Stack t ls rs`**: `t` が現在のフォーカス、`ls` が左側（近い順）、`rs` が右側です。
- **ジッパーの移動**: フォーカスを左へ動かすとは、左側の先頭を取り出して、現在の要素を右側へ送ることです。
- **`NE.reverse`**: 空でないリストを逆順にする関数です。`NE` は `Data.List.NonEmpty` の略で、空でないことが型で保証されたリストです。
- **`where (x :| xs) = ...`**: `:|` は非空リストの「先頭と残り」を表す型の印です。ここでは先頭 `x` と残り `xs` に分けています。

## 何をしているか

### 1. 左側に要素がある場合

```haskell:line-numbers=378
focusUp' (Stack t (l:ls) rs) = Stack l ls (t:rs)
```

左側の先頭 `l` が、新しいフォーカスになります。残りの左側 `ls` はそのまま残ります。そして、元のフォーカス `t` は、右側の先頭に送られます。

具体的に見ます。`Stack 3 [2,1] [4,5]` でフォーカスを上に動かすと、`Stack 2 [1] [3,4,5]` になります。フォーカスは 2 へ、3 は右側へ移りました。

### 2. 左端の場合（回り込み）

```haskell:line-numbers=379
focusUp' (Stack t []     rs) = Stack x xs []
  where (x :| xs) = NE.reverse (t :| rs)
```

左側が空なら、現在の要素 `t` と右側 `rs` を合わせた全体を、逆順にします。その先頭を新しいフォーカスにします。

`Stack 1 [] [2,3]` のとき、`1 : [2,3]` を逆にすると `[3,2,1]` です。先頭の 3 がフォーカスになり、右側は空、左側が `[2,1]` になります。

## ここがすごい

回り込みのために、全体の並びを 1 回だけ逆にしています。通常の移動は 1 つ動かすだけなので速く、端の処理だけ少し重い、という配分になっています。

ドキュメントに書かれているように、この関数は「同じ時間の計算量で、端のときだけ O(w) かかる」と説明されています。頻繁に起きる通常の移動を速く保ち、まれな回り込みのコストは許容する、という判断です。

「端で止まらず、回り込む」という仕様を、2 つのパターンで素直に書き分けています。

## まとめ

- 頻繁な操作は速く、まれな操作は少し重くてもよい、と割り切ると設計が単純になる。
- ジッパーの移動は、先頭の付け替えで表せる。
- 端の処理は、全体を逆順にするなど、1 つの規則で書ける。
