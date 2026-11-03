---
title: "番号で指定した要素を、木から取り除く「deleteAt」"
description: "Data.Map の deleteAt。並び順の番号で指定した要素を削除する。根を消した場合は、左右の木を glue でつなぎ直す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [1525, 1534]
function: "deleteAt"
difficulty: 2
format: 2
tags: [データ構造, 再帰, 防御的プログラミング]
---

## ひとことで

`deleteAt i m` は、並び順の番号 `i` の要素を、`Map` から取り除く関数です。番号が範囲外のときは `error` で止まります。

前の記事の `updateAt` の、削除だけを行う版のようなものです。`updateAt` の `Nothing` の場合と、同じ仕組みで動きます。

## コード

```haskell:line-numbers=1525
deleteAt :: Int -> Map k a -> Map k a
deleteAt !i t =
  case t of
    Tip -> error "Map.deleteAt: index out of range"
    Bin _ kx x l r -> case compare i sizeL of
      LT -> balanceR kx x (deleteAt i l) r
      GT -> balanceL kx x l (deleteAt (i-sizeL-1) r)
      EQ -> glue l r
      where
        sizeL = size l
```

## 前提知識

- **`glue`**: 順序を保ったまま、2 本の木を 1 本につなぐ関数です。左の木の最大と右の木の最小を、つなぎ目にします。
- **`balanceL` と `balanceR`**: 木の釣り合いを直す関数です。
- **`error`**: 範囲外の番号に対して、プログラムを止める関数です。
- **`where sizeL = size l`**: 左の部分木の大きさに名前を付けています。

## 何をしているか

### 1. 空の木なら範囲外

```haskell:line-numbers=1528
    Tip -> error "Map.deleteAt: index out of range"
```

`Tip` にたどり着いたら、番号が木の範囲の外です。`error` で止まります。

### 2. 番号の位置へ進む

```haskell:line-numbers=1529
    Bin _ kx x l r -> case compare i sizeL of
      LT -> balanceR kx x (deleteAt i l) r
      GT -> balanceL kx x l (deleteAt (i-sizeL-1) r)
```

番号 `i` と左の大きさを比べ、左なら左の部分木から削除し、右なら右から削除します。削除のあとは、`balanceR` や `balanceL` で木を直します。

### 3. 根を削除する

```haskell:line-numbers=1532
      EQ -> glue l r
```

番号がちょうど根なら、根を取り除きます。残った左右の木は、`glue` でつなぎ直します。

## ここがすごい

根を消したときに、左右をつなぐ処理が `glue` です。`glue` は、左の最大か右の最小を新しい根にするので、順序を崩さずに木を 1 本に戻せます。

また、削除と釣り合いの直しを、通る道の上だけで行います。1 回の削除にかかる時間は、木の深さに比例します。全体を作り直さずに、位置による削除が速く行えます。

## まとめ

- 位置で削除するときも、通る道の上だけを直せばよい。
- 根を消すときは、左右を順序を保ってつなぎ直す。
- 範囲外の番号は、早めに止めると原因が分かりやすい。
