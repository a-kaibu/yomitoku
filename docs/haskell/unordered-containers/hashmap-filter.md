---
title: "値だけを見て、条件に合う件数だけ残す"
description: "unordered-containers の HashMap の filter。値に対する条件だけを受け取り、キーを無視して filterWithKey に渡す短い関数。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2010, Johan Tibell\""
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal.hs
lines: [2655, 2656]
function: "filter"
difficulty: 1
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`filter` は、値が条件に合うものだけを残した新しいハッシュマップを作る関数です。条件は、値だけを見て決めます。

## コード

```haskell:line-numbers=2655
filter :: (v -> Bool) -> HashMap k v -> HashMap k v
filter p = filterWithKey (\_ v -> p v)
```

## 前提知識

- **`filterWithKey`**: キーと値の両方を見て、条件に合うものを残す関数です。
- **ラムダ式**: `\x -> ...` の形で書く、名前のない関数です。
- **`_`**: 受け取った値を使わないことを示す書き方です。

## 何をしているか

### 1. 値だけを見る条件を作る

```haskell:line-numbers=2656
filter p = filterWithKey (\_ v -> p v)
```

`filter p` は、値だけを見る条件 `p` を受け取ります。内側のラムダ式は、キーを `_` で無視し、値 `v` にだけ `p` を当てています。

### 2. 本体の処理に渡す

`filter p` の本体は、`filterWithKey` に条件を渡すだけです。実際に残すかどうかの判定と、組を作り直す仕事は `filterWithKey` が受け持ちます。

## ここがすごい

本体の仕事は `filterWithKey` だけで、`filter` は「キーを無視する」という変換だけを担当しています。同じ処理を 2 回書かずに、ふたつの関数を再利用しています。

キーを無視する書き方を、ラムダ式で 1 行に収めているのが読みどころです。

`filter` の名前は、`Data.List` の `filter` と同じ考え方を表しています。ただし、ここではキーと値の組を扱うので、条件に使う値だけを取り出して渡しています。キーを使う必要がない場合は、この形が一番簡潔です。

## まとめ

- 値だけで絞り込むときは、キーを捨てて、より一般的な関数に渡すと書きやすい。
- 小さい関数を、より基本的な関数の上に重ねると、重複を減らせる。
- ラムダ式の `_` で、使わない値を明示できる。
