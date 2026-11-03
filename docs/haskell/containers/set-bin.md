---
title: "集合の木のサイズを、左右の大きさから計算する"
description: "containers の Data.Set で、左右の部分木と根からなる新しい木を作る bin。サイズを左右の和に 1 を足して、木に記録する。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "\"(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow.\""
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [2058, 2060]
function: "bin"
difficulty: 1
format: 2
tags: [データ構造, 再帰]
---

## ひとことで

`bin` は、根の要素と左右の部分木から、新しい木を 1 つ作る補助関数です。木のサイズを、自分で数え直さずに計算して記録します。

## コード

```haskell:line-numbers=2058
bin :: a -> Set a -> Set a -> Set a
bin x l r
  = Bin (size l + size r + 1) x l r
```

## 前提知識

- **部分木**: 木の中の、ひとまとまりの枝のことです。左の部分木と右の部分木があります。
- **`size`**: 木の要素の数を返す関数です。空の木は 0 です。
- **`Bin`**: 木の枝を表すコンストラクタです。サイズ、根の要素、左右の部分木を持ちます。

## 何をしているか

### 1. 新しいサイズを計算する

```haskell:line-numbers=2059
bin x l r
```

`size l + size r + 1` は、左の要素数と右の要素数に、根の 1 つを足したものです。これが新しい木の全体の要素数になります。

### 2. 木を組み立てる

```haskell:line-numbers=2060
  = Bin (size l + size r + 1) x l r
```

計算したサイズを先頭に置いて、`Bin` で木を作ります。木は、サイズ、根、左、右の 4 つでできています。

## ここがすごい

サイズは、`Bin` の最初の欄に入っています。木の大きさを知りたいときは、この欄を読むだけで済みます。

たとえば、左に 3 要素、右に 2 要素の木を作ると、`bin` は根の 1 を足して 6 を記録します。左右の木が正しいサイズを持っていれば、この足し算が常に正しい答えを出します。

サイズを毎回、木全体をたどって数えると、遅くなってしまいます。`bin` は、左右の部分木が既に持っているサイズを使うので、すぐに答えが出ます。

木の釣り合いを取る処理（回転など）は、この `bin` を使って木を作り直します。そのため、サイズが常に正しく保たれるのが大事です。

## まとめ

- 木のサイズを記録しておくと、要素数を素早く答えられる。
- 新しい木を作るときは、部分木のサイズを足して記録する。
- 作る処理を 1 か所にまとめると、サイズの計算ミスを防ぎやすい。
