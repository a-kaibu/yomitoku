---
title: "2 つの分岐を、ビットの接頭辞でつなぐ「link」"
description: "Data.IntMap の内部で、2 つの木を分岐の接頭辞（プレフィックス）でつなぐ link。小さい方の枝を左に置く。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/IntMap/Internal.hs
lines: [4243, 4248]
function: "link"
difficulty: 3
format: 2
tags: [データ構造, ビット演算, アルゴリズム]
---

## ひとことで

`link` は、キーが異なる接頭辞を持つ 2 本の `IntMap` を、1 本の分岐にまとめる関数です。`IntMap` は、整数のキーを 2 進数のビットで分けていく木（パトリシア木）です。

2 本の木のキーが、どのビットで初めて分かれるかを求め、その位置の分岐を作ります。その上で、キーの小さいほうを左、大きいほうを右に置きます。

## コード

```haskell:line-numbers=4243
link :: Int -> IntMap a -> Int -> IntMap a -> IntMap a
link k1 t1 k2 t2
  | i2w k1 < i2w k2 = Bin p t1 t2
  | otherwise = Bin p t2 t1
  where
    p = branchPrefix k1 k2
```

## 前提知識

- **パトリシア木**: キーの 2 進数のビットを上から順にたどって、枝を分けていく木です。
- **接頭辞（プレフィックス）**: 同じ分岐の下にあるキーが、共有する上位のビットです。
- **`branchPrefix`**: 2 つのキーが最初に異なるビットを使って、共通の接頭辞を求める関数です。
- **`i2w`**: 整数を、比べやすい `Word` の形に変換する関数です。負の数も、正しい順序で比べられるようにします。
- **`Bin p t1 t2`**: 接頭辞 `p` を持つ分岐で、左の木 `t1` と右の木 `t2` を持ちます。

## 何をしているか

### 1. 2 つのキーの大小を比べる

```haskell:line-numbers=4245
  | i2w k1 < i2w k2 = Bin p t1 t2
  | otherwise = Bin p t2 t1
```

`i2w k1 < i2w k2` のとき、`k1` の木が左になります。`Bin p t1 t2` は左に `t1`、右に `t2` を置きます。そうでなければ、左右を入れ替えて `Bin p t2 t1` を作ります。

### 2. 分岐の接頭辞を決める

```haskell:line-numbers=4247
  where
    p = branchPrefix k1 k2
```

`branchPrefix k1 k2` で、2 つの木が分かれるビットの位置と、その上の共通部分を求めます。この `p` が新しい分岐の接頭辞になります。

## ここがすごい

木の内部の形を、キーの大小だけで決められます。2 つのキーがどこで分かれるかを 1 回の計算で求めるので、木を深くたどって比べる必要がありません。

また、`i2w` で整数を変換してから比べるのは、負の数を含むキーを正しく並べるための工夫です。ビットの扱いと、大小の比較を、1 つの変換にまとめています。

## まとめ

- 整数のキーは、ビットで分ける木にすると、接頭辞で分岐を決められる。
- 2 つのキーが最初に異なるビットを見つければ、分岐の位置が分かる。
- 負の数を正しく比べるための変換を、1 か所にまとめておくと安全。
