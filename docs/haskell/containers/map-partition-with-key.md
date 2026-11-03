---
title: "条件に合うキーと値を、2 つの Map に振り分ける"
description: "containers の Map で、キーと値の条件で木を 2 つに分ける partitionWithKey。元の木の一部をそのまま再利用し、作り直す量を減らしている。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [2996, 3003]
function: "partitionWithKey"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 関数型]
---

## ひとことで

`partitionWithKey p m` は、`Map` の要素を条件 `p` で 2 つに分けます。条件に合うものを左の `Map`、合わないものを右の `Map` として返します。

## コード

```haskell:line-numbers=2996
partitionWithKey :: (k -> a -> Bool) -> Map k a -> (Map k a,Map k a)
partitionWithKey p0 t0 = toPair $ go p0 t0
  where
    go _ Tip = (Tip :*: Tip)
    go p t@(Bin _ kx x l r)
      | p kx x    = (if l1 `ptrEq` l && r1 `ptrEq` r
                     then t
                     else link kx x l1 r1) :*: link2 l2 r2
```

## 前提知識

- **`(k -> a -> Bool)`**: キーと値を受け取って、真偽を返す条件です。
- **`:*:`**: 2 つの木を組にして、一度に返すための内部の型です。
- **`ptrEq`**: 2 つのものが同じメモリ上の値かを調べる関数です。同じなら、作り直さずに再利用できます。
- **`link` と `link2`**: 2 つの木をつなぐ関数です。`link` は真ん中の要素を挟み、`link2` は挟まずにつなぎます。

## 何をしているか

### 1. 空の木の処理

```haskell:line-numbers=2999
    go _ Tip = (Tip :*: Tip)
```

空の木を分けると、どちらも空になります。

### 2. 条件に合う節点は左側に残す

```haskell:line-numbers=3000
    go p t@(Bin _ kx x l r)
      | p kx x    = (if l1 `ptrEq` l && r1 `ptrEq` r
```

節点 `t` の要素が条件 `p` に合うなら、その節点は左の結果に入ります。左右の部分木 `l1` と `r1` が元と同じなら、新しく作らず `t` をそのまま使います。

### 3. 残りの部分は link でつなぐ

```haskell:line-numbers=3003
                     else link kx x l1 r1) :*: link2 l2 r2
```

変わった場合は `link` で新しい節点を作ります。条件に合わなかった側は `link2` でつなぎ、右の結果として返します。

## ここがすごい

分けた結果が、元の木と同じ部分をたくさん含むことがあります。そのとき `ptrEq` で確かめて、同じものを再利用します。作り直す量が減るので、メモリと時間を節約できます。

また、木のつなぎ方を `link` と `link2` で使い分けて、木の形が崩れないようにしています。

## まとめ

- 分割の結果が元と同じなら、新しく作らないと速くなる。
- 木を分けるときは、つなぎ直す関数を使い分けると形が保てる。
- 元のデータを変えずに、新しい値を作るのが関数型の基本である。
