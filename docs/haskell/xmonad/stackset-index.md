---
title: "現在のワークスペースの窓を、順番どおりに一覧にする「index」"
description: "xmonad の StackSet で、現在のワークスペースのウィンドウを、マスターから順に並んだリストとして返す index。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [348, 349]
function: "index"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`index` は、現在のワークスペースにあるウィンドウを、画面に並べる順番どおりのリストとして返す関数です。先頭は「マスター」と呼ばれる、いちばん大きく表示されるウィンドウです。

ワークスペースが無いときは、空のリストを返します。窓の順番は、フォーカスがどこにあっても変わりません。

## コード

```haskell:line-numbers=348
index :: StackSet i l a s sd -> [a]
index = with [] integrate
```

## 前提知識

- **`StackSet`**: 複数のワークスペースと画面を持つ、xmonad の全体の状態です。型の引数が多いのは、そのためです。
- **`with`**: 現在のワークスペースの `Stack` を取り出し、関数に渡す関数です。`Stack` が無いときは、既定値を返します。
- **`integrate`**: `Stack` を 1 本のリストに戻す関数です。前の記事で見ました。
- **部分適用**: `index = with [] integrate` は、引数を書かずに関数を組み立てています。

## 何をしているか

```haskell:line-numbers=349
index = with [] integrate
```

### 1. 現在の Stack を取り出す

`with [] integrate` は、現在のワークスペースの `Stack` を探します。`Stack` が無ければ `[]` を返します。あればその `Stack` に `integrate` を適用します。

### 2. 順番を整える

`integrate` は、フォーカスより左の要素を逆順にして、現在の要素と右側をつなぎます。この並びが、そのまま画面の表示順になります。

## ここがすごい

全体の状態から、目的のリストを得る処理を、`with` という部品で組み立てています。「現在の作業域を開いて、変換する」という定型の手順を、名前にしているからです。

また、`index` 自体は引数を書いていません。点なしの定義によって、「状態を受け取り、リストを返す」という関数の本質だけが残っています。

## まとめ

- 現在の状態から値を取り出す処理は、部品（`with`）にまとめると再利用できる。
- 空の場合の既定値を、関数の第 1 引数で指定できる。
- 点なしの定義は、変換の流れを短く表せる。
