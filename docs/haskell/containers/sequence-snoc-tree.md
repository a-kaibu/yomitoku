---
title: "指の木の右端に、要素を付ける「snocTree」"
description: "Data.Sequence の内部の snocTree。consTree の右端版。右の指が一杯なら、3 つの要素をまとめて中央の木の右端へ送る。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Sequence/Internal.hs
lines: [1945, 1956]
function: "snocTree"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 遅延評価]
---

## ひとことで

`snocTree` は、指の木の右端に要素を付け加える関数です。前の記事の `consTree` の、左右を入れ替えた版です。名前の `snoc` は、`cons` を逆に綴ったものです。

右の指に空きがあれば、そこへ入れるだけです。一杯のときは、3 つをまとめて中央の木の右端へ送ります。

## コード

::: code-group

```haskell:line-numbers=1945 [日本語訳]
snocTree        :: Sized a => FingerTree a -> a -> FingerTree a
snocTree EmptyT a       =  Single a
snocTree (Single a) b   =  deep (One a) EmptyT (One b)
 -- seq の扱いは、consTree の注釈を参照。
snocTree (Deep s pr m (Four a b c d)) e = m `seq`
    Deep (s + size e) pr (m `snocTree` node3 a b c) (Two d e)
snocTree (Deep s pr m (Three a b c)) d =
    Deep (s + size d) pr m (Four a b c d)
snocTree (Deep s pr m (Two a b)) c =
    Deep (s + size c) pr m (Three a b c)
snocTree (Deep s pr m (One a)) b =
    Deep (s + size b) pr m (Two a b)
```

```haskell:line-numbers=1945 [原文]
snocTree        :: Sized a => FingerTree a -> a -> FingerTree a
snocTree EmptyT a       =  Single a
snocTree (Single a) b   =  deep (One a) EmptyT (One b)
-- See note on `seq` in `consTree`.
snocTree (Deep s pr m (Four a b c d)) e = m `seq`
    Deep (s + size e) pr (m `snocTree` node3 a b c) (Two d e)
snocTree (Deep s pr m (Three a b c)) d =
    Deep (s + size d) pr m (Four a b c d)
snocTree (Deep s pr m (Two a b)) c =
    Deep (s + size c) pr m (Three a b c)
snocTree (Deep s pr m (One a)) b =
    Deep (s + size b) pr m (Two a b)
```

:::

## 前提知識

- **`snoc`**: `cons` の逆綴りです。`cons` が左端へ付けるのに対し、`snoc` は右端へ付けます。
- **`Deep s pr m sf`**: 大きさ、左の指、中央の木、右の指です。`sf` が右の指です。
- **`node3`**: 3 つの要素を、1 つの節にまとめる関数です。
- **`seq`**: 左を先に評価する関数です。

## 何をしているか

### 1. 空や小さい木は、そのまま作る

```haskell:line-numbers=1946
snocTree EmptyT a       =  Single a
snocTree (Single a) b   =  deep (One a) EmptyT (One b)
```

空の木や 1 要素の木は、指を作って要素を入れます。

### 2. 右の指に空きがあれば、入れるだけ

```haskell:line-numbers=1951
snocTree (Deep s pr m (Three a b c)) d =
    Deep (s + size d) pr m (Four a b c d)
snocTree (Deep s pr m (Two a b)) c =
    Deep (s + size c) pr m (Three a b c)
snocTree (Deep s pr m (One a)) b =
    Deep (s + size b) pr m (Two a b)
```

右の指が `Three`、`Two`、`One` なら、要素を右端に足すだけです。中央の木と左の指は、そのまま使い回します。

### 3. 右の指が一杯なら、3 つを中央へ送る

```haskell:line-numbers=1949
snocTree (Deep s pr m (Four a b c d)) e = m `seq`
    Deep (s + size e) pr (m `snocTree` node3 a b c) (Two d e)
```

右の指が `Four a b c d` のときは、`a`、`b`、`c` を `node3` でまとめ、中央の木の右端に付けます。右の指は `Two d e` の形になります。

## ここがすごい

`consTree` と `snocTree` は、ほぼ鏡写しの形をしています。左右の対称性を保ったまま書かれているので、片方を理解すれば、もう片方もすぐ読めます。

また、両端で同じ仕組みを使うことで、列を両側から押し広げられます。「左端と右端を、同じ方法で扱う」という設計が、リストとは違う柔軟さを生んでいます。

## まとめ

- 両端の操作は、対称に書くと理解と保守がしやすい。
- 指が一杯になったら、まとめて中央へ送る仕組みは、左右で共通。
- 遅延評価の注意は、対になる関数にも同じように必要になる。
