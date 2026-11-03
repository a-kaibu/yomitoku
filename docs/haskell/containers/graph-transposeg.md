---
title: "全部の矢印の向きを逆にする「transposeG」"
description: "有向グラフの辺をすべて逆向きにした新しいグラフを作る transposeG。辺の一覧を入れ替えて buildG に渡すだけ。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Graph.hs
lines: [421, 425]
function: "transposeG"
difficulty: 1
format: 2
tags: [アルゴリズム, 探索, 関数型]
---

## ひとことで

`transposeG` は、有向グラフのすべての辺の向きを逆にした、新しいグラフを返す関数です。たとえば「A から B へ」の辺は、「B から A へ」になります。

行列の転置（縦と横を入れ替えること）と同じ考え方なので、名前も transpose（転置）になっています。

## コード

```haskell:line-numbers=421
transposeG  :: Graph -> Graph
transposeG g = buildG (bounds g) (reverseE g)

reverseE    :: Graph -> [Edge]
reverseE g   = [ (w, v) | (v, w) <- edges g ]
```

## 前提知識

- **`where` のない関数定義**: `transposeG g = buildG (bounds g) (reverseE g)` は、1 行で別の関数の結果を返す形です。
- **リスト内包表記**: `[ (w, v) | (v, w) <- edges g ]` は、「辺の一覧から 1 つずつ取り出して、向きを入れ替えたものを並べたリスト」を作る書き方です。
- **`(v, w) <-`**: パターンで組を分解しながら取り出しています。

## 何をしているか

### 1. 辺の一覧を入れ替える

```haskell:line-numbers=424
reverseE    :: Graph -> [Edge]
reverseE g   = [ (w, v) | (v, w) <- edges g ]
```

`edges g` は、グラフのすべての辺を `(出発, 到着)` の組のリストとして返します。内包表記では、各辺の `v` と `w` を取り出して、`(w, v)` と並べ直しています。これだけで、辺の向きが逆になります。

### 2. 新しいグラフを作る

```haskell:line-numbers=422
transposeG g = buildG (bounds g) (reverseE g)
```

逆向きの辺の一覧と、元のグラフの頂点の範囲 `bounds g` を `buildG` に渡します。前の記事で見た `buildG` が、隣接リストを組み立ててくれます。

具体例で見ます。辺 `(0,1)` と `(1,2)` を持つグラフを転置すると、辺は `(1,0)` と `(2,1)` になります。つまり、0 から 1 へ行けたのが、1 から 0 へ行ける形に変わります。

## ここがすごい

この関数は、グラフを作り直す処理を、辺の一覧を書き換えるだけで済ませています。グラフの内部の配列を直接いじらず、既にある `buildG` を再利用しています。

さらに、内部の表現を変える必要がないので、正しさを確かめやすい書き方です。`reverseE` で辺を変換し、`buildG` で組み立てる、という 2 段階に分けたことで、それぞれの段階が単純になっています。

転置は、強連結成分（後の `scc` の記事）を求めるアルゴリズムでも使われます。小さな関数ですが、グラフ処理の土台になっています。

## まとめ

- 辺の向きを逆にするには、辺の一覧の組を入れ替えて作り直せばよい。
- リスト内包表記を使うと、辺の変換が 1 行で書ける。
- 再利用できる部品（`buildG`）を使うと、新しい関数は短くて済む。
