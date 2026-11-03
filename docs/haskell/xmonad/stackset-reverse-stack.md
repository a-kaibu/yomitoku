---
title: "上と下を入れ替えるだけの「reverseStack」"
description: "xmonad の Stack で、左側と右側を入れ替える reverseStack。フォーカスはそのままで、上と下の向きだけが反転する。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [394, 395]
function: "reverseStack"
difficulty: 1
format: 2
tags: [データ構造, イディオム, 関数型]
---

## ひとことで

`reverseStack` は、`Stack` の左側と右側を入れ替える関数です。フォーカスの要素はそのままです。「上」と「下」の向きが、ちょうど反対になります。

中身は、左右のリストを交換するだけです。計算は一瞬で終わり、要素をたどることもありません。

## コード

```haskell:line-numbers=394
reverseStack :: Stack a -> Stack a
reverseStack (Stack t ls rs) = Stack t rs ls
```

## 前提知識

- **`Stack t ls rs`**: 現在の要素 `t`、左側 `ls`、右側 `rs` を持つ型です。
- **パターンマッチによる取り出し**: `Stack t ls rs` の形で、3 つの値を名前付きで取り出しています。
- **値を組み立て直す**: Haskell では、値を変更せず、新しい値を作って返します。`Stack t rs ls` は、左右を入れ替えた新しい `Stack` です。

## 何をしているか

### 1. 左右を入れ替えて新しい Stack を作る

```haskell:line-numbers=395
reverseStack (Stack t ls rs) = Stack t rs ls
```

`Stack t rs ls` は、現在の要素 `t` は同じで、左側に元の右側 `rs`、右側に元の左側 `ls` を入れた新しい値です。元の値は変わりません。

具体例で見ます。`Stack 3 [2,1] [4,5]` を反転すると、`Stack 3 [4,5] [2,1]` になります。フォーカスは 3 のままで、上（左）と下（右）が入れ替わりました。

## ここがすごい

この関数は、リストを 1 つも作り直しません。値を並べ替えるのではなく、2 つのリストの「名前の付け方」を交換するだけです。変換が一瞬で終わるのは、このためです。

そして、この関数は `focusDown'` や `swapDown` の土台として使われています。小さな関数が、より大きな操作を組み立てる部品になっている点が、この設計の良さです。

「向きを変えるだけ」の操作を、1 つの関数として名前を付けておくと、読む人は意図を素早く理解できます。

## まとめ

- 左右のリストを入れ替えると、向きを変えるだけの操作が一瞬で済む。
- 値を変えずに、新しい値を組み立て直す。
- 小さな部品は、名前を付けて再利用すると全体が読みやすくなる。
