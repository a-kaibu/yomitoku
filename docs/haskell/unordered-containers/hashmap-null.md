---
title: "マップが空かどうかを、最初の 1 件で決める"
description: "unordered-containers の HashMap の null。木の根が空の場合だけ True を返す。中身を数えないので、速く判定できる。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2010, Johan Tibell\""
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal.hs
lines: [646, 648]
function: "null"
difficulty: 1
format: 2
tags: [データ構造, ハッシュ, 型システム]
---

## ひとことで

`null` は、ハッシュマップが空かどうかを調べる関数です。中身を 1 つずつ数えずに、木の形だけで判定します。

## コード

```haskell:line-numbers=646
null :: HashMap k v -> Bool
null Empty = True
null _   = False
```

## 前提知識

- **`HashMap k v`**: キーと値の組を、ハッシュで素早く探せる辞書です。
- **`Empty`**: 木の中で、何も入っていない枝を表すコンストラクタです。
- **パターンマッチ**: 値の形に応じて分岐する書き方です。

## 何をしているか

### 1. 空の場合

```haskell:line-numbers=647
null Empty = True
```

根が `Empty` なら、マップの中身はないので `True` を返します。

### 2. それ以外

```haskell:line-numbers=648
null _   = False
```

`_` は、どんな形でも受け付けるという意味です。`Empty` でなければ、少なくとも 1 件は入っているので `False` です。

## ここがすごい

全部の件数を数えるのではなく、根の形を見るだけで答えを出します。`size` と違って、木の中をたどる必要がありません。

空かどうかは、「1 件でもあるか」だけが分かればよいので、この仕組みで十分です。

`null` は、マップが空かどうかを、呼ぶ側で素早く決めるための関数です。空のマップに対して何かをしたくないとき、先に `null` で確かめてから処理を分けると、無駄な計算を省けます。件数の数え上げが不要な分、判定の仕事はとても軽くなっています。

## まとめ

- 空かどうかだけなら、件数を数えず木の形を見ればよい。
- 空を表す特別なコンストラクタを用意すると、判定が一目で分かる。
- 件数が必要な場合の `size` と使い分けると良い。
