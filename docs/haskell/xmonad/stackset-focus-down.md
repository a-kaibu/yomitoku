---
title: "状態全体に対して、フォーカスを 1 つ下へ動かす「focusDown」"
description: "xmonad の StackSet で、現在のワークスペースのフォーカスを下（右）へ動かす focusDown。Stack 用の focusDown' を包んで使う。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [360, 361]
function: "focusDown"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`focusDown` は、`StackSet` 全体の状態を受け取り、現在のワークスペースのフォーカスを 1 つ下（右）へ動かした状態を返す関数です。前の記事の `focusUp` と対になる関数です。

実際の移動は `focusDown'` が行い、`focusDown` はそれを状態の中の現在のワークスペースへ届けます。

## コード

```haskell:line-numbers=360
focusDown :: StackSet i l a s sd -> StackSet i l a s sd
focusDown = modify' focusDown'
```

## 前提知識

- **`focusUp` との対応**: `focusUp` が上へ、`focusDown` が下へ動かします。作り方も同じです。
- **`modify'`**: 現在の `Stack` を取り出し、変換して状態に戻す関数です。
- **`focusDown'`**: `Stack` のフォーカスを下へ動かす関数です。前の記事で、反転を使って作られていることを見ました。
- **点なしの定義**: `focusDown = modify' focusDown'` は、引数を書かずに組み立てています。

## 何をしているか

```haskell:line-numbers=361
focusDown = modify' focusDown'
```

### 1. 現在の Stack に focusDown' を適用する

`modify'` が、現在のワークスペースの `Stack` を取り出し、`focusDown'` を適用します。

### 2. 状態に戻す

変換された `Stack` は、元の `StackSet` の同じ場所に戻されます。画面やワークスペースの情報は、そのまま残ります。

## ここがすごい

上と下の移動が、同じ仕組み（`modify'` で包む）を使っています。違いは、適用する `Stack` の関数だけです。仕組みを 1 つにして、関数の違いだけを残す設計です。

また、`focusDown` の本体は 1 行で、読み手は「現在の場所を下へ動かす」と一目で分かります。詳しい動きは `focusDown'` の記事で追えます。

## まとめ

- 対になる操作は、同じ包み方で揃えると分かりやすい。
- 状態全体の操作は、`modify'` の上に小さく書ける。
- 詳細は部品に任せ、外側の関数は意図だけを表すと読みやすい。
