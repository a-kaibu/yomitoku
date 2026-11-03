---
title: "Map の値を、順序を保ったまま外側の作用で変換する"
description: "containers の Map で、各キーと値に作用付きの関数を当てて、木の形を保ったまま結果を集める traverseWithKey。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [3131, 3136]
function: "traverseWithKey"
difficulty: 3
format: 2
tags: [データ構造, 関数型, 遅延評価]
---

## ひとことで

`traverseWithKey f m` は、`Map` の各キーと値に `f` を当てて、その結果を `Applicative`（`Maybe` や `IO` などの作用）の中で集める関数です。木の形は元の `Map` と同じに保たれます。

## コード

```haskell:line-numbers=3131
traverseWithKey :: Applicative t => (k -> a -> t b) -> Map k a -> t (Map k b)
traverseWithKey f = go
  where
    go Tip = pure Tip
    go (Bin 1 k v _ _) = (\v' -> Bin 1 k v' Tip Tip) <$> f k v
    go (Bin s k v l r) = liftA3 (flip (Bin s k)) (go l) (f k v) (go r)
```

## 前提知識

- **`Applicative`**: 「値を作用の中で扱う」ための型の制約です。`Maybe` や `IO` などが当てはまります。
- **`liftA3`**: 3 つの作用の結果を使って、1 つにまとめる関数です。
- **`pure`**: 値を作用の中に入れる関数です。ここでは空の木を作ります。
- **`<$>`**: 作用の中の値に関数を当てる演算子です。

## 何をしているか

### 1. 空の木と 1 要素の木を処理する

```haskell:line-numbers=3134
    go Tip = pure Tip
    go (Bin 1 k v _ _) = (\v' -> Bin 1 k v' Tip Tip) <$> f k v
```

空の木は、そのまま `pure Tip` で返します。要素が 1 つだけの節点は、`f k v` の結果を使って、同じ形の節点を作ります。

### 2. 左右の木と、真ん中の要素をまとめる

```haskell:line-numbers=3136
    go (Bin s k v l r) = liftA3 (flip (Bin s k)) (go l) (f k v) (go r)
```

左の木、真ん中の値、右の木をそれぞれ処理して、`liftA3` で 1 つの節点にまとめます。`flip (Bin s k)` は、引数の順番を入れ替えて、値を真ん中に置く形にしています。

## ここがすごい

作用を使っても、木の形は変わりません。左、真ん中、右の順に作用を組み立てるので、結果の `Map` は、キーの順番どおりに並んだままになります。

また、要素数 1 の節点を特別扱いしていて、余計な比較や木の作り直しを避けています。

## まとめ

- 作用付きの変換は、木の形を保つと結果もきれいに整う。
- `liftA3` を使うと、3 つの部分の結果を 1 つにまとめられる。
- 小さな場合（空、1 要素）を先に分けると、本体が読みやすくなる。
