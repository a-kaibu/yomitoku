---
title: "番号で指定した要素だけを、更新か削除する「updateAt」"
description: "Data.Map の updateAt。並び順の番号で指定した要素に関数を適用し、Just なら書き換え、Nothing なら削除する。木の釣り合いも直す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [1501, 1512]
function: "updateAt"
difficulty: 3
format: 2
tags: [データ構造, 再帰, 関数型]
---

## ひとことで

`updateAt f i m` は、並び順の番号 `i` の要素に関数 `f` を適用します。`f` が `Just` を返せば値を書き換え、`Nothing` を返せばその要素を削除します。

番号で指定する点が、普通の `update` とは違います。キーを知らなくても、位置で対象を決められます。

## コード

```haskell:line-numbers=1501
updateAt :: (k -> a -> Maybe a) -> Int -> Map k a -> Map k a
updateAt f !i t =
  case t of
    Tip -> error "Map.updateAt: index out of range"
    Bin sx kx x l r -> case compare i sizeL of
      LT -> balanceR kx x (updateAt f i l) r
      GT -> balanceL kx x l (updateAt f (i-sizeL-1) r)
      EQ -> case f kx x of
              Just x' -> Bin sx kx x' l r
              Nothing -> glue l r
      where
        sizeL = size l
```

## 前提知識

- **`Maybe` の 2 つの結果**: `Just x'` は新しい値、`Nothing` は削除を表します。
- **`glue`**: 2 本の木を、順序を保ったままつなぐ関数です。削除したあとの左右をつなぐときに使います。
- **`balanceR`、`balanceL`**: 木の釣り合いを直す関数です。前の記事群で見ました。
- **`where sizeL = size l`**: 左の大きさを名前に付けています。

## 何をしているか

### 1. 番号の位置で、左右のどちらか決める

```haskell:line-numbers=1505
    Bin sx kx x l r -> case compare i sizeL of
      LT -> balanceR kx x (updateAt f i l) r
      GT -> balanceL kx x l (updateAt f (i-sizeL-1) r)
```

番号が左の大きさより小さければ、左の部分木を更新し、そのあと `balanceR` で釣り合いを直します。大きければ、右の部分木を更新して `balanceL` で直します。どちらも、番号の調整は前の記事の `elemAt` と同じです。

### 2. 同じ位置に来たら、関数を適用する

```haskell:line-numbers=1508
      EQ -> case f kx x of
              Just x' -> Bin sx kx x' l r
              Nothing -> glue l r
```

番号がちょうど根を指したら、`f` を適用します。`Just` なら、キーと大きさはそのままで、値だけを書き換えます。`Nothing` なら、根を取り除いて、左右を `glue` でつなぎます。

## ここがすごい

書き換えの場合は、木の形が変わらないので、釣り合いを直す処理は要りません。削除の場合だけ、左右をつなぎ直します。変化の種類に応じて、必要な処理だけを行う設計です。

また、番号で指定する更新を、キーの比較なしで行えます。位置を知っている場面では、探索の手間が省けます。

## まとめ

- 位置で対象を決める操作は、番号の調整を伴う再帰で書ける。
- 値の変更と削除では、木の直し方が違う。必要な処理だけを行う。
- 関数の戻り値（`Maybe`）で、書き換えと削除を 1 つの仕組みに統一できる。
