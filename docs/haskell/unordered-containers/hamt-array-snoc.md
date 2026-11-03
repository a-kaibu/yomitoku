---
title: "配列の末尾に 1 件足して、新しい配列を作る「snoc」"
description: "unordered-containers の HAMT 用の配列操作 snoc。元の配列を変えずに、長さが 1 増えた新しい配列を作り、末尾に要素を入れる。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal/Array.hs
lines: [239, 245]
function: "snoc"
difficulty: 2
format: 2
tags: [データ構造, 低レイヤ, 関数型]
---

## ひとことで

`snoc` は、配列 `ary` の末尾に要素 `x` を付けた、新しい配列を作る関数です。元の配列は書き換えず、長さが 1 増えた配列を返します。

HAMT の中では、子を 1 つ増やすときにこの関数が使われます。配列の長さは固定なので、増やすには作り直すしかありません。

## コード

```haskell:line-numbers=239
snoc :: Array a -> a -> Array a
snoc ary x = run $ do
  mary <- new (n + 1) x
  copy ary 0 mary 0 n
  pure mary
  where
    n = length ary
```

## 前提知識

- **`Array` と `MArray`**: `Array` は変更できない配列、`MArray` は変更できる配列です。内部の作業では、`MArray` を使ってから `Array` に戻します。
- **`ST`**: 状態を持つ計算のモナドです。外からは純粋な値に見えるように、`run` で閉じ込めます。
- **`snoc`**: `cons` の逆綴りで、右端に付ける操作を指します。
- **`length`**: 配列の長さを返す関数です。

## 何をしているか

### 1. 長さが 1 大きい配列を作る

```haskell:line-numbers=240
snoc ary x = run $ do
  mary <- new (n + 1) x
```

`run` の中で、長さ `n + 1` の配列を作ります。すべての場所を `x` で埋めておきます。最後の場所の値は、この時点で `x` に決まります。

### 2. 元の要素を先頭からコピーする

```haskell:line-numbers=242
  copy ary 0 mary 0 n
  pure mary
```

`copy ary 0 mary 0 n` で、元の配列の全要素を、新しい配列の先頭にコピーします。コピーが終わった配列を返します。

## ここがすごい

配列の作り直しは、O(n) の仕事です。そのため、小さな HAMT のノードで使われる前提で、配列を小さく保つ設計になっています。大きくなりすぎる前に、別の形のノードに変わるからです。

また、内部では変更できる配列を使って効率よく作り、外からは変更されない値として見せています。作る速さと、使う安全さを、両方とも得る作りです。

## まとめ

- 変更できない配列に要素を足すには、新しい配列を作ってコピーする。
- 内部で変更できる配列を使い、外に出すときに変更できない形にすると、速さと安全を両立できる。
- 配列の大きさを小さく保つと、作り直しの損失が小さくなる。
