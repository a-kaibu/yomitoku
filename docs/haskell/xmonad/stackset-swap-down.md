---
title: "右隣と入れ替える「swapDown」は、反転を使って作る"
description: "xmonad の StackSet で、フォーカスと右隣の要素を入れ替える swapDown。反転、swapUp'、反転の 3 段で書かれている。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [372, 373]
function: "swapDown"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`swapDown` は、フォーカスしている要素と、その右隣の要素の位置を入れ替える関数です。前の記事の `swapUp` と対になる操作です。

右隣を入れ替える処理は、新しく書かれていません。並びを反転して左隣の処理を使い、もう一度反転して戻しています。

## コード

```haskell:line-numbers=372
swapDown :: StackSet i l a s sd -> StackSet i l a s sd
swapDown  = modify' (reverseStack . swapUp' . reverseStack)
```

## 前提知識

- **`swapUp'`**: `Stack` のフォーカスを、左隣と入れ替える関数です。前の記事で見ました。
- **`reverseStack`**: 左右を入れ替える関数です。上と下の向きが反対になります。
- **関数合成 `.`**: 右から左へ、順に適用します。
- **`modify'`**: 現在の `Stack` を変換して、状態に戻す関数です。

## 何をしているか

```haskell:line-numbers=373
swapDown  = modify' (reverseStack . swapUp' . reverseStack)
```

### 1. 右隣を左隣として扱う

`reverseStack` を最初に適用すると、右隣が左隣になります。ここで、「左隣と入れ替える」処理が使えるようになります。

### 2. 左隣と入れ替える

`swapUp'` が、反転された並びで、フォーカスと左隣を入れ替えます。これは、元の並びでは右隣との入れ替えにあたります。

### 3. 向きを元に戻す

最後の `reverseStack` で、並びの向きを元に戻します。これで、右隣と入れ替えた結果が得られます。

## ここがすごい

「右」の処理を、「左」の処理と反転の組み合わせで表しています。新しいアルゴリズムを増やさず、既にあるものを再利用しています。

また、3 つの関数を `.` でつないだ式は、右から左へ読むと流れが分かります。「反転、入れ替え、反転」の手順が、そのまま式の形になっています。

## まとめ

- 対称な操作は、反転を挟むと既存の処理を再利用できる。
- 関数合成で、手順を式の形に写すと読みやすい。
- 同じ考え方が `focusDown'` にも使われていて、設計が統一されている。
