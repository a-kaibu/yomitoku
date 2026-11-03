---
title: "先頭の n 件だけを残す「take」"
description: "Data.Map の take。キーの小さい順に、先頭から n 件だけを残した Map を作る。木を切り分けて、必要な部分だけをつなぎ直す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [1429, 1440]
function: "take"
difficulty: 3
format: 2
tags: [データ構造, 再帰, アルゴリズム]
---

## ひとことで

`take n m` は、`Map` の中でキーがいちばん小さい `n` 件だけを残した新しい `Map` を返します。`n` が全体の大きさ以上なら、元の `Map` をそのまま返します。

木の全体を作り直さず、必要な側の枝だけをたどって、木を切り分けます。

## コード

```haskell:line-numbers=1429
take :: Int -> Map k a -> Map k a
take i m | i >= size m = m
take i0 m0 = go i0 m0
  where
    go i !_ | i <= 0 = Tip
    go !_ Tip = Tip
    go i (Bin _ kx x l r) =
      case compare i sizeL of
        LT -> go i l
        GT -> linkL kx x l (go (i - sizeL - 1) r)
        EQ -> l
      where sizeL = size l
```

## 前提知識

- **`size m`**: `Map` の要素数です。
- **`linkL`**: 2 本の木を、真ん中の鍵でつなぐ関数です。「link」の記事で、その仕組みを見ました。
- **ガード付きの定義**: `take i m | i >= size m = m` は、条件を満たすときの早い戻りです。
- **`where sizeL = size l`**: 左の部分木の大きさに名前を付けています。

## 何をしているか

### 1. 全部残るなら、そのまま返す

```haskell:line-numbers=1430
take i m | i >= size m = m
```

`n` が全体の大きさ以上なら、切る必要がありません。元の `Map` をそのまま返します。

### 2. 番号が左の中なら、左だけを切る

```haskell:line-numbers=1433
    go i !_ | i <= 0 = Tip
    go !_ Tip = Tip
    go i (Bin _ kx x l r) =
      case compare i sizeL of
        LT -> go i l
```

残す数 `i` が 0 以下なら、空の `Tip` を返します。木の端では、残す数が左の大きさより小さいなら、左の部分木だけを同じ `i` で切ります。

### 3. 番号が右にかかるなら、つなぎ直す

```haskell:line-numbers=1438
        GT -> linkL kx x l (go (i - sizeL - 1) r)
        EQ -> l
```

残す数が根を超えるなら、左の木 `l` は全部残り、右の木だけを `i - sizeL - 1` 件に切ります。そして `linkL` で、左と切った右をつなぎ直します。ちょうど根の位置で止まるなら、左の木 `l` だけを返します。

## ここがすごい

切るのは、通る道の上だけです。木の深さの分だけ節をたどり、残る部分は、そのまま使い回します。全体を作り直す必要はありません。

また、切った後の木が釣り合いを保つように、`linkL` でつなぎ直しています。木の不変条件を、切ったあとも保つための仕組みを、既存の部品に任せています。

## まとめ

- 木の一部だけを切るときは、通る道の上だけを作り直す。
- 残り全部は、そのまま再利用する。
- 切ったあとの木も、釣り合いを保つ部品でつなぎ直す。
