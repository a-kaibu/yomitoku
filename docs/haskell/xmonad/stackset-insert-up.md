---
title: "今のフォーカスの上に、新しい窓を差し込む"
description: "xmonad の insertUp。窓が既に無ければ、フォーカスの上（左）に新しい窓を入れ、その窓にフォーカスを移す。既にあれば何もしない。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [484, 486]
function: "insertUp"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`insertUp a s` は、窓 `a` を現在のワークスペースに追加する関数です。すでに同じ窓があれば、何も変えずに元の状態を返します。無ければ、フォーカスの上（左）に入れ、新しい窓にフォーカスを移します。

新しく開いた窓が、今作業している窓の前に並ぶ、という動きを表しています。

## コード

```haskell:line-numbers=484
insertUp :: Eq a => a -> StackSet i l a s sd -> StackSet i l a s sd
insertUp a s = if member a s then s else insert
  where insert = modify (Just $ Stack a [] []) (\(Stack t l r) -> Just $ Stack a l (t:r)) s
```

## 前提知識

- **`member`**: 窓が、どこかのワークスペースにあるかを調べる関数です。
- **`modify`**: 現在の `Stack` を変換して状態に戻す関数です。`Stack` が無いときに使う値を、第 1 引数で指定します。
- **`where` の補助関数**: `insert` は、`modify` に渡す変換を名前付けしたものです。
- **`Stack a [] []`**: 1 つの窓だけを持つ `Stack` です。ワークスペースが空だったときの形です。

## 何をしているか

### 1. 既に存在するなら何もしない

```haskell:line-numbers=485
insertUp a s = if member a s then s else insert
```

`member a s` が真なら、元の状態 `s` をそのまま返します。同じ窓を 2 回入れないための確認です。

### 2. 現在の Stack の上に入れる

```haskell:line-numbers=486
  where insert = modify (Just $ Stack a [] []) (\(Stack t l r) -> Just $ Stack a l (t:r)) s
```

`modify` は、`Stack` が無ければ `Stack a [] []` を作り、あれば `Stack a l (t:r)` を作ります。新しい窓 `a` がフォーカスになり、元のフォーカス `t` は右側へ送られます。

## ここがすごい

「フォーカスの上に入れて、そこへ移る」という動きが、`Stack` の 1 つの式で表せています。新しい窓が、作業中の窓の隣に現れる、というユーザーの感覚がそのまま形になっています。

また、存在の確認を最初にして、既にあれば同じ状態を返すのは、呼び出し側が重複を気にしなくてよい作りです。冪等（何度呼んでも同じ結果）な操作は、扱いやすさにつながります。

## まとめ

- 追加の操作は、既にあるかの確認を先に行うと、重複を防げる。
- 空の場合の値を `modify` に渡すと、場合分けを 1 か所にまとめられる。
- 新しい要素をフォーカスに置くと、ユーザーの直感に沿った動きになる。
