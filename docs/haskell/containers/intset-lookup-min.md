---
title: "整数集合のいちばん小さい要素を、木をたどって探す"
description: "containers の IntSet で、いちばん小さい整数を Maybe で返す lookupMin。Patricia 木の左へ下り、ビットの最も低い位置を足す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "\"(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow.\""
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/IntSet/Internal.hs
lines: [1213, 1216]
function: "lookupMin"
difficulty: 2
format: 2
tags: [データ構造, ビット演算, 探索]
---

## ひとことで

`lookupMin` は、`IntSet`（整数の集合）の中でいちばん小さい整数を返す関数です。集合が空なら `Nothing` を返します。

## コード

```haskell:line-numbers=1213
lookupMin :: IntSet -> Maybe Key
lookupMin Nil         = Nothing
lookupMin (Tip kx bm) = Just $! kx + lowestBitSet bm
lookupMin (Bin p l r) = Just $! lookupMinSure (if signBranch p then r else l)
```

## 前提知識

- **`IntSet`**: 整数だけを入れる集合です。内部では、ビットの並びを葉に持つ木（Patricia 木）で表します。
- **`Maybe`**: 値があれば `Just`、なければ `Nothing` を返す型です。
- **`Just $!`**: 値を `Just` に入れるとき、先に評価してから包む書き方です。
- **ビット**: 数を 0 と 1 の並びで表したものです。`lowestBitSet` は、そのうち最も低い 1 の位置を返します。

## 何をしているか

### 1. 空なら Nothing

```haskell:line-numbers=1214
lookupMin Nil         = Nothing
```

木が空なら、最小の要素はないので `Nothing` を返します。

### 2. 葉なら、ビットから値を求める

```haskell:line-numbers=1215
lookupMin (Tip kx bm) = Just $! kx + lowestBitSet bm
```

葉（`Tip`）は、接頭辞 `kx` と、32 個ほどの整数の有無を表すビット列 `bm` を持っています。最小の要素は、`kx` に `bm` の最も低い 1 の位置を足した値です。

### 3. 枝なら、左（または符号に応じて右）へ下る

```haskell:line-numbers=1216
lookupMin (Bin p l r) = Just $! lookupMinSure (if signBranch p then r else l)
```

枝（`Bin`）では、`signBranch` で負の数の枝かどうかを見ます。負の数が入っている場合は右側、そうでなければ左側に、最小の値があります。その側へ `lookupMinSure` で再帰的に下ります。

## ここがすごい

整数の大小を、木の形から直接読んでいます。すべての要素を比べ直す必要はありません。

負の数を扱うため、`signBranch` で向きを変えているのが工夫です。符号ビットの扱いを、枝の判定の 1 か所に閉じ込めています。

## まとめ

- 整数の木では、接頭辞とビットを使うと最小の値を素早く求められる。
- 負の数は符号ビットの位置で向きが変わるので、枝の判定で分けて考える。
- 空かどうかは `Nothing` で表すと、呼ぶ側が扱いやすい。
