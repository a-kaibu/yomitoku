---
title: "見つからないと止まる、番号の検索「findIndex」"
description: "Data.Map の findIndex。キーの並び順の番号を返すが、キーが無いときは error で止まる。lookupIndex の Maybe 版と対になる。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [1368, 1376]
function: "findIndex"
difficulty: 2
format: 2
tags: [データ構造, 再帰, 防御的プログラミング]
---

## ひとことで

`findIndex` は、`lookupIndex` と同じく、キーの並び順の番号を返す関数です。違いは、キーが無いときの振る舞いです。`findIndex` は `error` で止まり、`lookupIndex` は `Nothing` を返します。

キーが必ずあると分かっている場面では、`findIndex` のほうが後の処理を書きやすくなります。

## コード

```haskell:line-numbers=1368
findIndex :: Ord k => k -> Map k a -> Int
findIndex = go 0
  where
    go :: Ord k => Int -> k -> Map k a -> Int
    go !_   !_ Tip  = error "Map.findIndex: element is not in the map"
    go idx k (Bin _ kx _ l r) = case compare k kx of
      LT -> go idx k l
      GT -> go (idx + size l + 1) k r
      EQ -> idx + size l
```

## 前提知識

- **`error`**: プログラムを、メッセージつきで止める関数です。
- **`Maybe` と `error` の違い**: `Maybe` は失敗を値として返します。`error` は、その場で例外を起こします。
- **`Tip`**: 空の木です。キーが見つからずに `Tip` にたどり着いたときは、ここで止まります。
- **`idx + size l + 1`**: 右へ進むときに、左の部分木と根の分を番号に足す式です。

## 何をしているか

### 1. 空の木に着いたら止める

```haskell:line-numbers=1372
    go !_   !_ Tip  = error "Map.findIndex: element is not in the map"
```

`Tip` に着いたということは、キーが木の中に無いということです。このときは `error` で、メッセージ付きで止めます。

### 2. 見つかった節で番号を決める

```haskell:line-numbers=1376
      EQ -> idx + size l
```

キーが一致したら、番号は `idx + size l` です。`lookupIndex` と同じ計算です。

## ここがすごい

`lookupIndex` と `findIndex` は、探索の本体がほぼ同じです。違うのは、失敗したときの扱いだけです。失敗を `Maybe` にするか、`error` で止めるかを、関数ごとに分けています。

また、`error` の文字列に、関数名（`Map.findIndex`）を入れています。止まったときに、どこで問題が起きたかが、すぐ分かる作りです。

## まとめ

- 失敗の扱いを変えた関数を並べると、利用者が選びやすい。
- 「必ずある」前提の関数は、止めるかわりに、エラーの場所を示す。
- 同じ探索を共有すると、2 つの関数の正しさを一緒に保てる。
