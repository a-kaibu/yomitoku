---
title: "マップの件数を、木をたどって数える"
description: "unordered-containers の HashMap の size。木の全体をたどり、葉の件数を足し合わせて全体の件数を返す。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2010, Johan Tibell\""
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal.hs
lines: [651, 658]
function: "size"
difficulty: 2
format: 2
tags: [データ構造, 再帰, ハッシュ]
---

## ひとことで

`size` は、ハッシュマップに入っている件数を返す関数です。木の全体を一度たどって、件数を数え上げます。

## コード

```haskell:line-numbers=651
size :: HashMap k v -> Int
size t = go t 0
  where
    go Empty                !n = n
    go (Leaf _ _)            n = n + 1
    go (BitmapIndexed _ ary) n = A.foldl' (flip go) n ary
    go (Full ary)            n = A.foldl' (flip go) n ary
    go (Collision _ ary)     n = n + A.length ary
```

## 前提知識

- **HAMT（ハッシュ配列マップ付き木）**: ハッシュの値を少しずつ使って、枝を分けていく木です。
- **`foldl'`**: 配列を左から畳み込みながら、途中の値を厳密に計算する操作です。
- **再帰**: 関数の中で、自分自身を小さい部分に対して呼ぶことです。

## 何をしているか

### 1. 件数を引き回す

```haskell:line-numbers=652
size t = go t 0
```

内部の関数 `go` に、木と、数えた途中の件数 `n` を渡します。最初の件数は 0 です。

### 2. 葉と空の枝

```haskell:line-numbers=654
    go Empty                !n = n
    go (Leaf _ _)            n = n + 1
```

空の枝は何も足しません。葉（1 件の組）は、件数を 1 増やします。

### 3. 配列を持つ枝

```haskell:line-numbers=656
    go (BitmapIndexed _ ary) n = A.foldl' (flip go) n ary
    go (Full ary)            n = A.foldl' (flip go) n ary
    go (Collision _ ary)     n = n + A.length ary
```

配列を持つ枝では、中の枝を順に `go` で数えます。`Collision` は、同じハッシュの複数の組を持つ枝で、配列の長さをそのまま足します。

## ここがすごい

件数を、別の変数で持たずに、畳み込みの途中の値として運んでいます。木を 1 回たどるだけで、全体の件数が求まります。

ただし、`null` と違って全体をたどるので、件数が多いと時間がかかります。この差を知っておくと、使い分けが分かります。

`size` は、件数が必要な場面で使います。たとえば、表示用の件数を出すときや、件数の上限を確かめるときです。件数が多いマップでは、木をたどる時間がかかるので、本当に件数が要るかどうかを考えてから使うと良いでしょう。

## まとめ

- 件数は、木を一度たどって数え上げると求められる。
- 途中の値を畳み込みで運ぶと、可変の変数を使わずに済む。
- 空かどうかだけなら、件数を数えずに `null` を使うと速い。
