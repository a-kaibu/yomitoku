---
title: "枝がすべて埋まったら、ビットマップを省く"
description: "HAMT のノードを作るとき、すべての枝が埋まっていれば Full ノードに、そうでなければ BitmapIndexed ノードにする bitmapIndexedOrFull。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal.hs
lines: [873, 875]
function: "bitmapIndexedOrFull"
difficulty: 2
format: 2
tags: [ハッシュ, データ構造, 最適化]
---

## ひとことで

`bitmapIndexedOrFull` は、HAMT の内部ノードを作るときに、枝の一覧を持つ `BitmapIndexed` と、全部の枝が埋まった `Full` のどちらにするかを決める関数です。

枝の有無を表すビットマップが、すべて 1（全部埋まり）のときは、ビットマップは要りません。その場合だけ、`Full` という、より簡単な形にします。

## コード

```haskell:line-numbers=873
bitmapIndexedOrFull b !ary
    | b == fullBitmap = Full ary
    | otherwise         = BitmapIndexed b ary
```

## 前提知識

- **`Bitmap`**: 枝の有無を 1 ビットずつ表す整数です。
- **`fullBitmap`**: すべての枝が埋まっているときのビットマップです。32 ビットの、すべて 1 の値です。
- **ガード `|`**: 条件を上から順に確かめます。`otherwise` は残りの場合です。
- **`!ary`**: 配列を厳密に評価させる印です。

## 何をしているか

### 1. 全部埋まっているかを確かめる

```haskell:line-numbers=874
    | b == fullBitmap = Full ary
```

ビットマップ `b` が `fullBitmap` と等しければ、すべての枝が使われています。このときは、ビットマップを持たない `Full` ノードを作ります。配列の中身だけで、どの枝にあるかが分かるからです。

### 2. それ以外は、ビットマップを持つ

```haskell:line-numbers=875
    | otherwise         = BitmapIndexed b ary
```

一部の枝しかないときは、`BitmapIndexed` ノードを作ります。ビットマップと配列の両方が必要です。

## ここがすごい

全部埋まった場合に、ビットマップを捨てて `Full` にすることで、メモリを節約し、探索も少し速くなります。探索の途中で「この段の枝がある」かを調べる必要がなくなるからです。

また、この関数を 1 か所にまとめているので、ノードを作るときの判断が、どこで行われるかが明確です。コメントにある通り、この関数の書き方は GHC の最適化の結果（コードの大きさ）にも影響しています。

## まとめ

- 全部埋まっている場合は、特別な形にすると省メモリで速い。
- 形の判断は、1 つの関数にまとめると一貫する。
- 配列の厳密な評価は、コードの大きさの最適化にも効く。
