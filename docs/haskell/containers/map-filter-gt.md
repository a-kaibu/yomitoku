---
title: "指定したキーより大きいものだけを残す"
description: "containers の Map で、指定したキーより大きい要素だけを残す filterGt。比べた結果に応じて、残すべき木の側だけを選んでたどる。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [3937, 3942]
function: "filterGt"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 探索]
---

## ひとことで

`filterGt k m` は、`Map` の中から、キー `k` より大きいキーを持つ要素だけを残した新しい `Map` を作る関数です。

## コード

```haskell:line-numbers=3937
filterGt :: Ord k => k -> Map k v -> Map k v
filterGt !_ Tip = Tip
filterGt !b (Bin _ kx x l r) =
  case compare b kx of LT -> link kx x (filterGt b l) r
                       EQ -> r
                       GT -> filterGt b r
```

## 前提知識

- **`Ord k`**: キーどうしを大小で比べられる、という型の制約です。
- **`compare`**: 2 つの値を比べて、`LT`（小さい）、`EQ`（等しい）、`GT`（大きい）のどれかを返す関数です。
- **`!`（バング）**: 引数を先に計算させる印です。
- **`link`**: 真ん中の要素を挟んで、2 つの木をつなぐ関数です。

## 何をしているか

### 1. 比べる対象が空なら、空を返す

```haskell:line-numbers=3938
filterGt !_ Tip = Tip
```

木が空なら、残す要素もないので空を返します。

### 2. 節点のキーと比べて、行き先を決める

```haskell:line-numbers=3940
  case compare b kx of LT -> link kx x (filterGt b l) r
```

`b` が節点のキー `kx` より小さいときは、この節点とその右の部分木は残します。左の部分木だけを、同じ方法で絞り込みます。

```haskell:line-numbers=3941
                       EQ -> r
                       GT -> filterGt b r
```

`b` と `kx` が等しいときは、`kx` 自身は含めないので、右の部分木だけを返します。`b` が大きいときは、左側はすべて捨てて、右の部分木だけを絞り込みます。

## ここがすごい

比べた結果で、たどる側を 1 つに決められます。ひとつの木を全部読まずに、必要な側だけを進むので、無駄が少ないです。

`link` を使うのは、残した部分を木の形を保ったままつなぐためです。作り直す手間は、必要な分だけになります。

## まとめ

- 大小の比較で、たどる先を決めると無駄が減る。
- 境界の値（等しいとき）を含めるかどうかは、仕様として明確にしておく。
- 木の形を保ったままつなぐ関数を使うと、結果の木も正しい形になる。
