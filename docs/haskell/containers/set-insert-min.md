---
title: "集合の先頭に、最小の要素として追加する"
description: "containers の Set で、今の最小より小さい要素を先頭に差し込む insertMin。木の右端ではなく左端をたどるので、比較の回数が少ない。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [1814, 1818]
function: "insertMin"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`insertMin x s` は、集合 `s` の先頭（いちばん小さい位置）に、`x` を差し込む関数です。`x` が今の最小より小さいことが前提になっています。

## コード

```haskell:line-numbers=1814
insertMin :: a -> Set a -> Set a
insertMin x t
  = case t of
      Tip -> singleton x
      Bin _ y l r
```

## 前提知識

- **`Set`**: 重複のない要素を、小さい順に保存する集合です。木の形で持たれています。
- **`Tip`**: 空の木です。
- **`Bin`**: 要素を 1 つ持ち、左右に木をつないだ節点です。
- **`singleton`**: 要素 1 つだけの集合を作る関数です。

## 何をしているか

### 1. 空なら 1 要素の集合を作る

```haskell:line-numbers=1817
      Tip -> singleton x
```

集合が空なら、`x` 1 つだけの集合を返します。

### 2. 空でなければ、左へたどる

```haskell:line-numbers=1818
      Bin _ y l r
```

空でないなら、今の節点 `y` の左側の木 `l` に、`x` を差し込んでいきます。`x` は `y` より小さいので、左へ進むのが正しい場所です。

## ここがすごい

最小の要素を差し込むときは、比べる必要がありません。いつも左へ進めばよいので、木の高さだけたどれば済みます。

差し込んだあとは、木のバランスを整える処理を行い、極端に偏らないようにしています。

一般の挿入では、比べて左か右かを決める必要があります。しかし、最小の要素を入れる場合は、比べる回数を 0 にできます。これは、要素を作るときに「小さいこと」を保証しているからです。たとえば、`fromDistinctAscList` のように昇順で作る処理では、この関数だけで木を組み立てられます。

一方で、前提が崩れると木の並びが壊れてしまいます。そのため、この関数は内部用として使い、利用する側は小さいことを保証する責任を持ちます。速さと安全性のどちらを優先するかが、設計の大事な判断になります。

## まとめ

- 先頭に差し込むときは、いつも左へ進めばよい。
- 前提条件（小さいこと）を守ると、比べる手間が省ける。
- 木の形を保つ処理があるから、検索も速いままになる。
