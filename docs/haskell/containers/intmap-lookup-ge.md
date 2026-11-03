---
title: "指定したキー以上で、いちばん小さいキーを探す"
description: "containers の IntMap で、指定したキー以上で最も小さいキーと値を探す lookupGE。ビットの並びを見て、木の左右どちらに進むかを決める。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/IntMap/Internal.hs
lines: [781, 789]
function: "lookupGE"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, ビット演算]
---

## ひとことで

`lookupGE` は、`IntMap` の中から「指定したキー以上で、いちばん小さいキー」を探し、そのキーと値を返す関数です。見つからなければ `Nothing` を返します。

## コード

```haskell:line-numbers=781
lookupGE :: Key -> IntMap a -> Maybe (Key, a)
lookupGE !k t = case t of
    Bin p l r | signBranch p -> if k >= 0 then go Nil l else go l r
    _ -> go Nil t
  where
    go def (Bin p l r)
      | nomatch k p = if k < unPrefix p then unsafeFindMin l else unsafeFindMin def
      | left k p  = go r l
      | otherwise = go def r
```

## 前提知識

- **`IntMap`**: キーが整数の辞書です。キーを 2 進数として扱い、ビットの並びで木を作ります。
- **`Maybe`**: 値があるかもしれないことを表す型です。`Just 値` か `Nothing` のどちらかになります。
- **`Key`**: `IntMap` のキーの型で、整数です。
- **`def`**: 「ここまでに見つかった候補」を覚えておく引数です。右に進むときは候補を更新しません。

## 何をしているか

### 1. 符号の付いた木を、先に分ける

```haskell:line-numbers=782
lookupGE !k t = case t of
    Bin p l r | signBranch p -> if k >= 0 then go Nil l else go l r
    _ -> go Nil t
```

負の数と正の数が同じ木に入っていると、順番が崩れて見えます。そこで、符号の分かれ目で左右を入れ替えて、正しい順番で探せるようにしています。

### 2. 木を上からたどり、候補を覚える

```haskell:line-numbers=785
  where
    go def (Bin p l r)
      | nomatch k p = if k < unPrefix p then unsafeFindMin l else unsafeFindMin def
      | left k p  = go r l
      | otherwise = go def r
```

`nomatch k p` は、キー `k` がこの節点の範囲に入っていないことを表します。範囲の外なら、`k` より大きい側の最小値を答えとして返します。範囲の中なら、`left k p` で左に進むか右に進むかを決めます。左に進むときは、右側の候補を捨てずに `def` に残しておきます。

## ここがすごい

`IntMap` は、キーのビットを見て左右に分けるので、比較の回数が少なく済みます。普通の木のように「キーどうしを大小で比べる」必要がなく、ビットの位置だけを見て進めます。

また、いちばん小さい候補を `def` に持ち歩くことで、途中で見つからなかった場合でも、戻らずに答えを出せます。

## まとめ

- 「以上」の検索は、途中で見つけた候補を持ち歩くと戻らずに済む。
- 整数のキーは、ビットの並びを使うと速く分けられる。
- 符号を扱うときは、順番が崩れないように特別に扱う必要がある。
