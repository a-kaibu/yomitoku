---
title: "帰りがけの順に頂点を並べ直す「reversePostOrder'」"
description: "木の帰りがけ順を逆にした頂点のリストを、中間の配列を作らずに一度に作る reversePostOrder'。トポロジカルソートの土台になる。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Graph.hs
lines: [679, 681]
function: "reversePostOrder'"
difficulty: 3
format: 2
tags: [アルゴリズム, 探索, 関数型]
---

## ひとことで

`reversePostOrder'` は、森（木のリスト）を受け取り、**帰りがけ順（post-order）の逆** に並べた頂点のリストを返す関数です。帰りがけ順とは、子の処理が終わってから親を並べる順番です。

この並べ方は、グラフのトポロジカルソートや強連結成分の計算に使われます。

## コード

```haskell:line-numbers=679
reversePostOrder' :: [Tree a] -> [a]
reversePostOrder' =
  F.foldl' (\xs t -> F.foldl' (flip (:)) xs (Tree.PostOrder t)) []
```

## 前提知識

- **帰りがけ順（post-order）**: 木の節を、子をすべて処理した後で並べる順番です。根は最後に並びます。
- **`F.foldl'`**: 左から順に畳み込む関数です。`'` は、途中の値をすぐに計算させる（厳密にする）印です。`F` は `Data.Foldable` を短く呼んだ名前です。
- **`Tree.PostOrder`**: 木を帰りがけ順にたどる、型の印です。`F.foldl'` の中で使うと、その順に要素が出てきます。
- **`flip (:)`**: 要素をリストの先頭に付ける関数を、引数の順番を入れ替えて使っています。

## 何をしているか

### 1. 木を 1 本ずつ畳み込む

```haskell:line-numbers=680
reversePostOrder' =
```

`F.foldl'` は、森の木を左から順に取り出して、それぞれを畳み込みます。畳み込みの途中結果 `xs` は、これまでに並んだ頂点のリストです。初期値は `[]` です。

### 2. 木の帰りがけ順を先頭に付けていく

```haskell:line-numbers=681
  F.foldl' (\xs t -> F.foldl' (flip (:)) xs (Tree.PostOrder t)) []
```

内側の `F.foldl' (flip (:)) xs (Tree.PostOrder t)` は、木 `t` を帰りがけ順にたどり、頂点を 1 つずつ `xs` の先頭に付けていきます。

帰りがけ順で出てきた頂点を、先頭へ付けていくと、リストは逆順になります。これがまさに「帰りがけ順の逆」です。

## ここがすごい

素直に書くなら、「木を帰りがけ順にリストへ変換し、それを `reverse` する」という 2 段階になります。この関数は、`reverse` という中間の処理を省き、先頭に付けながら作るので、リストを 2 回たどりません。

コメントにもあるように、この実装は、結果を全部使うなら遅延評価（必要になるまで計算しないこと）より速いと判断しています。`'` で厳密にしているのは、途中の結果を溜めずに、すぐに次へ渡すためです。

## まとめ

- 帰りがけ順の逆は、先頭に付けながら作ると、逆転の処理を省ける。
- `foldl'` の `'` は、途中の値をすぐに計算させる印。
- 全部の結果を使うなら、遅延より厳密な処理のほうが速いことがある。
