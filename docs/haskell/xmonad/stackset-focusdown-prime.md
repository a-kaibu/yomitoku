---
title: "逆向きの移動を、反転を 2 回使って作る「focusDown'」"
description: "xmonad の Stack で、フォーカスを 1 つ下（右）へ動かす focusDown'。並びを逆にして focusUp' を使い、もう一度逆にして戻す。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [384, 385]
function: "focusDown'"
difficulty: 2
format: 2
tags: [データ構造, イディオム, 関数型]
---

## ひとことで

`focusDown'` は、フォーカスを 1 つ下（右側の隣）へ動かす関数です。新しいアルゴリズムを書かず、これまでの部品を組み合わせて作られています。

そのために、`reverseStack`（左右を入れ替える）、`focusUp'`（上へ動かす）、`reverseStack` の 3 つをつなぎます。

## コード

```haskell:line-numbers=384
focusDown' :: Stack a -> Stack a
focusDown' = reverseStack . focusUp' . reverseStack
```

## 前提知識

- **`reverseStack`**: `Stack` の左側と右側を入れ替える関数です。「上」と「下」の向きが反対になります。
- **関数合成 `.`**: `f . g` は、`g` を先に適用してから `f` を適用します。
- **点なしの定義**: `focusDown' = ...` と、引数を書かずに関数を定義する書き方です。
- **対称性**: 下へ動かすことは、「向きを逆にして上へ動かし、また戻す」と同じと考えられます。

## 何をしているか

### 1. 右側へ移るために、向きを反転する

```haskell:line-numbers=384
focusDown' :: Stack a -> Stack a
focusDown' = reverseStack . focusUp' . reverseStack
```

`reverseStack` を最初に適用すると、右側が左側になります。こうすると、「下へ動かす」は「上へ動かす」として扱えるようになります。

### 2. 上へ動かす

反転した `Stack` に `focusUp'` を適用します。これは、前の記事で見た、左側へ動かす関数です。

### 3. 元の向きに戻す

最後の `reverseStack` で、向きを元に戻します。結果の `Stack` は、フォーカスが 1 つ右へ移った状態になります。

## ここがすごい

「下へ動かす」処理を、既にある「上へ動かす」処理から導いています。コードを重複させずに、2 つの向きの動きを 1 つの仕組みで表しています。

このような「向きを反転して、既存の処理を使い、また戻す」というパターンは、対称な操作を書くときの定番です。`swapDown` も同じ考えで、`reverseStack . swapUp' . reverseStack` と書かれています。

合成の式は、右から左へ読むと流れが分かります。最初の `reverseStack` が最初に動き、最後の `reverseStack` が最後に動きます。

## まとめ

- 対称な操作は、向きを反転して既存の処理を再利用すると書ける。
- 関数合成 `.` は、右から左へ処理を流すと読みやすい。
- 同じパターンを複数の関数で使うと、全体が一貫した設計になる。
