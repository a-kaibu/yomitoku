---
title: "行き止まりまで進んでから戻る、深さ優先探索の本体"
description: "グラフを深さ優先で探索して森（木の集まり）を作る dfs。訪問済みの頂点を状態として持ちながら、再帰で奥へ進む。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Graph.hs
lines: [579, 592]
function: "dfs"
difficulty: 3
format: 2
tags: [アルゴリズム, 探索, 再帰]
---

## ひとことで

`dfs` は深さ優先探索（DFS）という方法で、グラフの頂点をたどる関数です。ある頂点から出発して、行けるところを奥まで進み、行き止まりになったら一つ戻って別の道を試します。

結果は「木の集まり（森）」として返します。木の根は探索を始めた頂点で、子は見つけた順にたどった先の頂点です。すでに訪問した頂点は、もう一度たどりません。

## コード

```haskell:line-numbers=579
dfs :: Graph -> [Vertex] -> [Tree Vertex]
dfs !g vs0 = run (bounds g) $ \contains include ->
  let
    go [] = pure []
    go (v:vs) = do
      visited <- contains v
      if visited
      then go vs
      else do
        include v
        as <- go (g!v)
        bs <- go vs
        pure $ Node v as : bs
  in go vs0
```

## 前提知識

- **`dfs !g vs0`**: `!g` は、グラフを厳密に（すぐに）評価させる印です。`vs0` は出発点のリストで、末尾の `0` は「最初の値」を表す名前です。
- **`run ... $ \contains include -> ...`**: `$` は「後ろの式を前の関数に渡す」記号です。`\contains include -> ...` は、2 つの引数を受け取る無名関数（ラムダ）です。
- **`do` 記法**: 状態を持つ処理を、上から順に書くための書き方です。`visited <- contains v` は「結果を `visited` に受け取る」という意味です。
- **`Node v as : bs`**: `Node` は木の節です。根が `v`、子の並びが `as`、続きの兄弟が `bs` です。

## 何をしているか

### 1. 出発点を順に見る

```haskell:line-numbers=583
    go (v:vs) = do
      visited <- contains v
      if visited
      then go vs
```

`go` は、頂点のリストを先頭から見ていく再帰の関数です。各頂点について、訪問済みかどうかを `contains` で確かめます。訪問済みなら、何もせず次の頂点へ進みます。

### 2. 未訪問なら奥へ進む

```haskell:line-numbers=588
        include v
        as <- go (g!v)
        bs <- go vs
        pure $ Node v as : bs
```

まだ訪問していない頂点 `v` は、`include v` で訪問済みに記録します。次に、`g!v`（`v` の隣の頂点たち）に対して `go` を再帰で呼び、子の木 `as` を得ます。これが「奥へ進む」の部分です。

子の探索が終わったら、残りの兄弟 `vs` を `go vs` で処理し、`bs` を得ます。最後に、根 `v` と子の木 `as` を組み、兄弟の木 `bs` の前に付けます。

### 3. 全体を実行する

```haskell:line-numbers=592
  in go vs0
```

`in go vs0` で、出発点のリストに対して `go` を実行します。`run` は状態（訪問済みの集合）を管理しながら、この処理を走らせます。

## ここがすごい

深さ優先探索は、「訪問済み」を覚えておかないと、循環するグラフで永遠に回り続けます。この関数は、その記録を `contains` と `include` という 2 つの操作に分けて、探索の本体からは状態の扱いを隠しています。

また、コメントにもあるように、この実装は King と Launchbury の教科書的なやり方から外れています。生成、剪定（不要な枝を捨てること）、切り出しを 1 つの再帰にまとめて、速度を優先しています。読みやすさとの引き換えに、無駄な中間リストを作らない工夫をしています。

さらに、`go` の中で `do` 記法を使うことで、「訪問済みの確認」「記録」「子の探索」という手順が、上から下へ読める形になっています。

## まとめ

- 深さ優先探索は、奥へ進んでから戻る再帰で書ける。
- 訪問済みの記録がないと、循環するグラフで止まらなくなる。
- 状態を扱う操作を分けると、探索の本体が読みやすくなる。
