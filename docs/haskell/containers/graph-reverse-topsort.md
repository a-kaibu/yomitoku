---
title: "帰りがけ順をそのまま並べる「reverseTopSort」"
description: "トポロジカルソートの逆順を、森の帰りがけ順をそのまま連結して求める reverseTopSort。逆転の処理を省いた姉妹関数。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Graph.hs
lines: [688, 689]
function: "reverseTopSort"
difficulty: 2
format: 2
tags: [アルゴリズム, 探索]
---

## ひとことで

`reverseTopSort` は、`topSort` の**逆順**を返す関数です。トポロジカルソートは「依存元を先に」並べるのに対して、こちらは「依存先を先に」並べます。

結果は、グラフの全頂点を、深さ優先探索の帰りがけ順に並べたものです。辺の向きを逆に読んだ順番になります。

## コード

```haskell:line-numbers=688
reverseTopSort :: Graph -> [Vertex]
reverseTopSort = concatMap (F.toList . Tree.PostOrder) . dff
```

## 前提知識

- **`topSort` との関係**: `topSort` は `reversePostOrder'` を使い、逆順の並びを作ります。この関数は、帰りがけ順そのものを使うので、逆転していません。
- **`concatMap`**: 森の各木を平らなリストに変えて、1 本につなぐ関数です。
- **`F.toList`**: `Foldable`（畳み込める入れ物）の要素を、リストにする関数です。
- **`Tree.PostOrder`**: 木を帰りがけ順にたどる型の印です。`F.toList` と組み合わせて、その順番のリストを作ります。

## 何をしているか

### 1. 木ごとに帰りがけ順を取り出す

```haskell:line-numbers=689
reverseTopSort = concatMap (F.toList . Tree.PostOrder) . dff
```

`F.toList (Tree.PostOrder t)` は、1 本の木 `t` の頂点を帰りがけ順にリストにします。子をすべて並べた後で、親が並びます。

### 2. 森の全部をつなぐ

`concatMap` は、森の木を 1 本ずつ上の処理にかけて、その結果を 1 本のリストに連結します。`(...) . dff` は、先に `dff` で森を作ってから、この処理を行うという意味です。

## ここがすごい

`topSort` と `reverseTopSort` は、同じ森から作られます。違いは、最後に逆順にするかどうかだけです。どちらが必要かは、呼び出す側が決めれば済みます。

もし逆順にする処理を省けば、リストを作るときに余分な並べ替えをしなくて済みます。関数の役割を、「逆にするか」だけの違いに絞った設計です。

ドキュメントの注意書きでも、`topSort` の説明を読むように書かれています。姉妹の関数は、仕様を共有することで、説明が重複しないようにされています。

## まとめ

- トポロジカルソートの逆順は、帰りがけ順そのものとして得られる。
- 姉妹の関数は、違いを最小限にすると理解しやすい。
- 逆順にするかどうかで、結果の意味がちょうど反対になる。
