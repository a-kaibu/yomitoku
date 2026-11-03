---
title: "配列の途中に 1 件差し込む「insertM」"
description: "unordered-containers の HAMT 用の配列操作 insertM。指定した位置に要素を差し込み、後ろの要素を 1 つずつずらして、長さが 1 増えた配列を作る。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal/Array.hs
lines: [335, 342]
function: "insertM"
difficulty: 3
format: 2
tags: [データ構造, 低レイヤ, 最適化]
---

## ひとことで

`insertM` は、配列の指定した位置 `idx` に要素 `b` を差し込む関数です。`idx` より後ろの要素は、1 つずつ後ろへずれます。長さは 1 増えます。

HAMT のノードは、子の並びを配列で持っています。新しい子を、ビットマップの位置に合わせて差し込むときに、この関数が使われます。

## コード

```haskell:line-numbers=335
insertM :: Array e -> Int -> e -> ST s (Array e)
insertM ary idx b =
    CHECK_BOUNDS("insertM", count + 1, idx)
        do mary <- new (count+1) b
           copy ary 0 mary 0 idx
           copy ary idx mary (idx+1) (count-idx)
           unsafeFreeze mary
  where !count = length ary
```

## 前提知識

- **`CHECK_BOUNDS`**: 添字が範囲内かを確かめる、コンパイル時の仕組みです。確認が有効なときだけ働きます。
- **`copy`**: 配列の一部を、別の配列へコピーする関数です。`copy src si dst di n` の形で使います。
- **`unsafeFreeze`**: 変更できる配列を、変更できない形に変える関数です。中身をコピーせず、印だけを変えます。
- **`where !count`**: 元の配列の長さに名前を付けて、先に確定させています。

## 何をしているか

### 1. 新しい配列を、要素 b で埋めて作る

```haskell:line-numbers=336
insertM ary idx b =
    CHECK_BOUNDS("insertM", count + 1, idx)
        do mary <- new (count+1) b
```

長さ `count + 1` の配列を作り、すべての場所を `b` で埋めます。ここで、新しい要素の場所は確保されます。

### 2. 前半をそのままコピーする

```haskell:line-numbers=339
           copy ary 0 mary 0 idx
```

添字 0 から `idx` の前までの元の要素を、新しい配列の同じ位置にコピーします。

### 3. 後半を 1 つずらしてコピーする

```haskell:line-numbers=340
           copy ary idx mary (idx+1) (count-idx)
           unsafeFreeze mary
```

元の `idx` 以降の要素を、新しい配列の `idx + 1` の位置から並べてコピーします。これで、差し込む位置だけが空いて `b` になり、後ろの要素は 1 つずつずれます。最後に、変えられない配列にして返します。

具体例で見ます。`[a, b, c]` の `idx` 1 に `x` を差し込むと、`[a, x, b, c]` になります。

## ここがすごい

差し込みを、「前半のコピー」「新しい要素」「後半のコピー」の 3 つに分けています。新しい配列を 1 回だけ作り、各要素は 1 回だけコピーされます。

また、`insert` が `runST` で包まれていることで、外からは純粋な関数として使えます。内部の効率と、外からの扱いやすさを、両方とも満たす構成です。

## まとめ

- 配列への差し込みは、前半、新しい要素、後半の 3 つに分けると分かりやすい。
- 1 回の作成と 1 回のコピーで済ませると、無駄な作業が少ない。
- 内部で変更し、外に出すときは変更できない形にする。
