---
title: "出発点からたどり着ける頂点をすべて集める「reachable」"
description: "指定した頂点から辺をたどって行ける頂点を、深さ優先探索で一覧にする reachable。探索の結果の森を平らにするだけで済む。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Graph.hs
lines: [757, 758]
function: "reachable"
difficulty: 2
format: 2
tags: [アルゴリズム, 探索]
---

## ひとことで

`reachable` は、グラフの中で、ある頂点から辺をたどって行ける頂点をすべて返す関数です。出発点自身も、その結果に含まれます。

たとえば、0 から 1 へ、1 から 2 へ辺があれば、`reachable g 0` は `[0,1,2]` を返します。

## コード

```haskell:line-numbers=757
reachable :: Graph -> Vertex -> [Vertex]
reachable g v = concatMap Tree.flatten (dfs g [v])
```

## 前提知識

- **`concatMap`**: リストの各要素を別のリストに変えて、それらを 1 本につなぐ関数です。
- **`Tree.flatten`**: 木の節を、順番どおりに 1 本のリストへ平らにする関数です。
- **`dfs g [v]`**: 出発点を 1 つだけ与えた深さ優先探索です。結果は、`v` を根とする木の森になります。

## 何をしているか

### 1. 出発点だけから探索する

```haskell:line-numbers=758
reachable g v = concatMap Tree.flatten (dfs g [v])
```

`dfs g [v]` は、頂点 `v` だけを出発点にして、そこから行ける頂点を探索します。探索できなかった頂点は森に現れないので、結果は「たどり着ける頂点だけ」になります。

### 2. 木を平らにして 1 本のリストにする

`concatMap Tree.flatten` は、森に含まれる全部の木を、1 本のリストに平らにします。木のどの頂点も、必ずこのリストのどこかに入るので、たどり着ける頂点がすべて集まります。

## ここがすごい

「行けるかどうか」を知るのに、探索の結果をそのまま使い回しています。新しい探索のアルゴリズムを書かず、既にある `dfs` の結果を平らにするだけです。

また、この関数は「出発点から行ける範囲」を、自然に全部集めます。循環があっても、訪問済みの記録によって無限に回ることはありません。

この関数は、探索の結果を「平らにする」だけで答えを出します。木の構造は探索の途中で行き止まりを判断するために使われ、答えの形を決めるときには捨てられます。木の形と順番を必要に応じて使い分けるのが、グラフを扱うときの基本です。

## まとめ

- 出発点から行ける頂点の集合は、深さ優先探索の結果を平らにすると得られる。
- 探索の結果を、別の目的に組み替えて使うと、新しい関数を短く書ける。
- 訪問済みの記録があるので、循環するグラフでも安全に止まる。
