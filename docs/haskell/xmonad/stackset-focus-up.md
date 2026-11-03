---
title: "状態全体に対して、フォーカスを 1 つ上へ動かす「focusUp」"
description: "xmonad の StackSet で、現在のワークスペースのフォーカスを上へ動かす focusUp。Stack 用の focusUp' を modify' で包んで使う。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [355, 356]
function: "focusUp"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`focusUp` は、`StackSet` 全体の状態を受け取り、現在のワークスペースのフォーカスを 1 つ上へ動かした新しい状態を返す関数です。実際の移動は、前に見た `focusUp'` が行います。

`focusUp` は、その `focusUp'` を、状態全体の中の「現在のワークスペース」に適用するための、橋渡しの役割です。

## コード

```haskell:line-numbers=355
focusUp :: StackSet i l a s sd -> StackSet i l a s sd
focusUp   = modify' focusUp'
```

## 前提知識

- **`StackSet`**: ワークスペースや画面を含む、全体の状態の型です。
- **`modify'`**: 現在の `Stack` を取り出して変換し、状態に戻す関数です。`Stack` が無いときは、何もしません。
- **点なしの定義**: `focusUp = modify' focusUp'` は、引数を書かずに、変換の組み合わせとして定義しています。
- **`focusUp'`**: `Stack` を受け取って、フォーカスを上へ動かす関数です。

## 何をしているか

```haskell:line-numbers=356
focusUp   = modify' focusUp'
```

### 1. 現在の Stack を探す

`modify'` は、現在のワークスペースの `Stack` を取り出します。ここでは、フォーカスを動かす対象がそれです。

### 2. Stack に focusUp' を適用する

取り出した `Stack` に `focusUp'` が適用されます。フォーカスは 1 つ上へ移り、端に来ていれば回り込みます。

### 3. 状態に戻す

変換した `Stack` は、元の `StackSet` の中の同じ場所に戻されます。ワークスペースや画面の情報は、変わらずに残ります。

## ここがすごい

`focusUp` は、`focusUp'` の仕事を、状態全体の中で正しい場所に届ける役割だけを持ちます。ワークスペースを探す、戻す、という手間を `modify'` に任せています。

そのため、フォーカスの移動の仕組みを 1 か所で作り、それを状態全体に広げられます。`swapUp` も同じ形で書かれており、全体の設計が揃っています。

## まとめ

- 状態全体の操作は、部品（`modify'`）に任せると、中身だけに集中できる。
- 小さな関数を、状態の中の正しい場所へ届ける「包み」を作ると、再利用しやすい。
- 同じ形の関数を揃えると、読む人が全体を把握しやすい。
