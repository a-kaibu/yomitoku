---
title: "順序を変えない関数で、集合の中身だけを変える"
description: "containers の Set で、要素を変換しても大小の順序が変わらないと分かっている場合に使う mapMonotonic。木の形のまま、要素だけを置き換える。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [1071, 1073]
function: "mapMonotonic"
difficulty: 2
format: 2
tags: [データ構造, 関数型, 最適化]
---

## ひとことで

`mapMonotonic f s` は、集合 `s` の各要素に関数 `f` を当てて、新しい集合を作る関数です。`f` が大小の順序を変えないことを前提に、普通の `map` よりも速く作ります。

## コード

```haskell:line-numbers=1071
mapMonotonic :: (a->b) -> Set a -> Set b
mapMonotonic _ Tip = Tip
mapMonotonic f (Bin sz x l r) = Bin sz (f x) (mapMonotonic f l) (mapMonotonic f r)
```

## 前提知識

- **`Set`**: 重複のない要素を順番に保存する集合です。木の形で持たれています。
- **`Bin` と `Tip`**: 木の節点（`Bin`）と空の木（`Tip`）を表すデータの形です。
- **単調（monotonic）**: 「小さい値を変換したら、結果も小さいまま」という性質です。順序が変わらないことを言います。
- **`_`（ワイルドカード）**: 値を使わないときに置く印です。

## 何をしているか

### 1. 空の木はそのまま返す

```haskell:line-numbers=1072
mapMonotonic _ Tip = Tip
```

空の集合に関数を当てても、空のままです。

### 2. 節点の要素だけを変えて、形はそのまま残す

```haskell:line-numbers=1073
mapMonotonic f (Bin sz x l r) = Bin sz (f x) (mapMonotonic f l) (mapMonotonic f r)
```

節点の値 `x` に `f` を当て、左右の木にも同じ処理を続けます。大きさ `sz` は変わりません。結果の木は、元の木と同じ形になります。

## ここがすごい

普通の `map` は、新しい要素を全部入れ直して、木を作り直す必要があります。一方、`mapMonotonic` は、順序が変わらないという前提のおかげで、木の形を保ったまま要素だけを置き換えられます。

このため、木の再構築のための比較が要りません。計算量が小さくなり、メモリの使い方も軽くなります。

ただし、`f` が順序を壊す場合に使うと、木の並びが崩れて、後の検索が正しく動きません。前提を守ることが大切です。

## まとめ

- 変換しても順序が変わらないなら、木の形を保つ近道が使える。
- 前提が正しいかどうかは、読む側と書く側で合わせておく必要がある。
- 木の構造を再利用すると、作り直しの手間が省ける。
