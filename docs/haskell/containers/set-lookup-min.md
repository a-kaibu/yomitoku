---
title: "集合の最小の要素を、探して返す"
description: "containers の Set で、いちばん小さい要素を Just で返す lookupMin。空の集合なら Nothing を返す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [790, 792]
function: "lookupMin"
difficulty: 1
format: 2
tags: [データ構造, 防御的プログラミング, 再帰]
---

## ひとことで

`lookupMin s` は、集合 `s` の中でいちばん小さい要素を `Just` で返す関数です。集合が空のときは `Nothing` を返します。

## コード

```haskell:line-numbers=790
lookupMin :: Set a -> Maybe a
lookupMin Tip = Nothing
lookupMin (Bin _ x l _) = Just $! lookupMinSure x l
```

## 前提知識

- **`Maybe`**: 値があれば `Just`、なければ `Nothing` を表す型です。
- **`Tip`**: 空の木です。
- **`Bin`**: 要素と左右の木を持つ節点です。
- **`$!`**: 右の値を先に計算してから、関数に渡す演算子です。

## 何をしているか

### 1. 空なら Nothing

```haskell:line-numbers=791
lookupMin Tip = Nothing
```

集合が空なら、探す要素がないので `Nothing` を返します。

### 2. 最小の要素を左端から探す

```haskell:line-numbers=792
lookupMin (Bin _ x l _) = Just $! lookupMinSure x l
```

節点の要素 `x` と左の木 `l` を、`lookupMinSure` に渡します。最小の要素は左端にあるので、左へたどって見つけます。見つかった値を `Just` で包んで返します。

## ここがすごい

木は大小の順に並んでいるので、最小の要素は必ず左端にあります。全体を比べなくても、左へ進むだけで答えが分かります。

`$!` を使って、結果を先に計算させるので、途中の値が溜まりません。

集合の最大の要素を探す `lookupMax` も、同じ考え方で右端へたどって作られています。左右どちらかの端に寄せておけば、どちらの端も同じ速さで取り出せます。

## まとめ

- 順序のある木では、端の要素は左右へたどるだけで見つかる。
- 空かどうかを `Maybe` で表すと、安全に扱える。
- 結果を先に計算させると、遅延評価によるメモリの溜まりを防げる。
