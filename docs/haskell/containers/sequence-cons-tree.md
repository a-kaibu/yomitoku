---
title: "指の木の左端に、要素を付ける「consTree」"
description: "Data.Sequence の内部で、指の木（finger tree）の左端に要素を付ける consTree。左の指が一杯なら、中央の木へ 3 つの要素をまとめて送る。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Sequence/Internal.hs
lines: [1896, 1910]
function: "consTree"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 遅延評価]
---

## ひとことで

`consTree` は、指の木の左端に要素 `a` を付ける関数です。木の左の指（最大 4 つ）に空きがあれば、そこへ入れるだけで終わります。指が一杯のときは、4 つのうち 3 つをまとめて、中央の木へ送ります。

## コード

::: code-group

```haskell:line-numbers=1896 [日本語訳]
consTree        :: Sized a => a -> FingerTree a -> FingerTree a
consTree a EmptyT       = Single a
consTree a (Single b)   = deep (One a) EmptyT (One b)
 -- 論文どおり、木の中央を、要素を前に付ける前に評価（強制）する。
 -- こうすると、償却の計算量の保証を保ったまま、
 -- 何度も前に付けたときに、大きな遅延（サスペンション）が積み上がるのを防ぐ。
 -- 「大きな遅延」の詳しい説明は、論文を参照。
consTree a (Deep s (Four b c d e) m sf) = m `seq`
    Deep (size a + s) (Two a b) (node3 c d e `consTree` m) sf
consTree a (Deep s (Three b c d) m sf) =
    Deep (size a + s) (Four a b c d) m sf
consTree a (Deep s (Two b c) m sf) =
    Deep (size a + s) (Three a b c) m sf
consTree a (Deep s (One b) m sf) =
    Deep (size a + s) (Two a b) m sf
```

```haskell:line-numbers=1896 [原文]
consTree        :: Sized a => a -> FingerTree a -> FingerTree a
consTree a EmptyT       = Single a
consTree a (Single b)   = deep (One a) EmptyT (One b)
-- As described in the paper, we force the middle of a tree
-- *before* consing onto it; this preserves the amortized
-- bounds but prevents repeated consing from building up
-- gigantic suspensions.
consTree a (Deep s (Four b c d e) m sf) = m `seq`
    Deep (size a + s) (Two a b) (node3 c d e `consTree` m) sf
consTree a (Deep s (Three b c d) m sf) =
    Deep (size a + s) (Four a b c d) m sf
consTree a (Deep s (Two b c) m sf) =
    Deep (size a + s) (Three a b c) m sf
consTree a (Deep s (One b) m sf) =
    Deep (size a + s) (Two a b) m sf
```

:::

## 前提知識

- **指（digit）**: 木の両端にある、1 から 4 個の要素の並びです。`One`、`Two`、`Three`、`Four` があります。
- **`Deep s pr m sf`**: 深い木で、大きさ `s`、左の指 `pr`、中央の木 `m`、右の指 `sf` を持ちます。
- **`Single`、`EmptyT`**: 要素が 1 つだけの木と、空の木です。
- **`node3`**: 3 つの要素をまとめて、1 つの節にする関数です。
- **`seq`**: 左の値を評価してから右を返す関数です。ここでは中央の木を、先に確定させるために使います。

## 何をしているか

### 1. 空や小さい木は、そのまま作る

```haskell:line-numbers=1897
consTree a EmptyT       = Single a
consTree a (Single b)   = deep (One a) EmptyT (One b)
```

空の木や 1 要素の木には、指を作って要素を入れます。

### 2. 左の指に空きがあれば、入れるだけ

```haskell:line-numbers=1905
consTree a (Deep s (Three b c d) m sf) =
    Deep (size a + s) (Four a b c d) m sf
consTree a (Deep s (Two b c) m sf) =
    Deep (size a + s) (Three a b c) m sf
consTree a (Deep s (One b) m sf) =
    Deep (size a + s) (Two a b) m sf
```

左の指が `Three`、`Two`、`One` のときは、要素 `a` を左端に足すだけです。大きさも、`size a + s` で増やします。中央の木と右の指は、そのまま使い回します。

### 3. 左の指が一杯なら、3 つを中央へ送る

```haskell:line-numbers=1903
consTree a (Deep s (Four b c d e) m sf) = m `seq`
    Deep (size a + s) (Two a b) (node3 c d e `consTree` m) sf
```

左の指が `Four` のときは、`b`、`c`、`d`、`e` のうち `c`、`d`、`e` を `node3` でまとめ、中央の木の左端へ付けます。左の指は `Two a b` の形に縮みます。こうして、指の数を一定の範囲に保ちます。

## ここがすごい

左端への追加のほとんどは、指に空きがあるので、定数時間で終わります。一杯のときだけ、3 つをまとめて内側へ送ります。まとめて送るので、内側の木を頻繁に触らずに済みます。

また、中央の木を先に評価する `seq` は、遅延評価で大きな計算の塊が積み上がるのを防ぎます。コメントにあるとおり、償却計算量の保証を保つための工夫です。遅延評価を使う言語ならではの注意点が、ここに表れています。

## まとめ

- 指の木の左端は、空きがあれば 1 つ入れるだけで済む。
- 一杯のときは、まとめて内側へ送ると、深くたどらずに済む。
- 遅延評価では、積み上がりを防ぐために、途中の値を強制する。
