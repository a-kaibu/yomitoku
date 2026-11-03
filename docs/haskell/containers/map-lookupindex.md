---
title: "キーから、並び順の何番目かを知る「lookupIndex」"
description: "Data.Map で、キーが小さい順に並んだときの何番目かを、木をたどりながら求める lookupIndex。見つからなければ Nothing を返す。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [1389, 1397]
function: "lookupIndex"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 再帰]
---

## ひとことで

`lookupIndex` は、キーを受け取り、そのキーがキーの小さい順で何番目にあるかを返す関数です。番号は 0 から始まります。キーが無ければ `Nothing` を返します。

`Map` は、キーで探すのが得意な木です。その木の中で、「左に何個あるか」を数えながら進むと、番号が分かります。

## コード

```haskell:line-numbers=1389
lookupIndex :: Ord k => k -> Map k a -> Maybe Int
lookupIndex = go 0
  where
    go :: Ord k => Int -> k -> Map k a -> Maybe Int
    go !_  !_ Tip  = Nothing
    go idx k (Bin _ kx _ l r) = case compare k kx of
      LT -> go idx k l
      GT -> go (idx + size l + 1) k r
      EQ -> Just $! idx + size l
```

## 前提知識

- **`size`**: 節が持つ、部分木の要素数です。`Map` の各節は、大きさを覚えています。
- **`go`**: 現在の位置の番号 `idx` を引数に持つ、ローカルの再帰関数です。
- **`compare`**: 2 つの値を比べて、`LT`（小さい）、`EQ`（等しい）、`GT`（大きい）のどれかを返す関数です。
- **`Just $!`**: 結果を `Just` で包み、中身を厳密に計算させる書き方です。

## 何をしているか

### 1. 木を見て、左右のどちらへ進むか決める

```haskell:line-numbers=1393
    go !_  !_ Tip  = Nothing
    go idx k (Bin _ kx _ l r) = case compare k kx of
      LT -> go idx k l
      GT -> go (idx + size l + 1) k r
```

`compare k kx` の結果で分岐します。キーが小さければ、番号は変えずに左へ進みます。大きければ、左の部分木の大きさと根の分（1）を番号に足して、右へ進みます。

### 2. 見つかったら番号を返す

```haskell:line-numbers=1397
      EQ -> Just $! idx + size l
```

同じキーが見つかったら、現在の番号 `idx` に、左の部分木の大きさを足したものが答えです。左にある要素が、その分だけ前にあるからです。

具体例で見ます。キー 10、20、30 の 3 件の `Map` で `lookupIndex 20` を引くと、20 は 2 番目なので、番号は 1 です。

## ここがすごい

番号を求めるのに、全部の要素を並べ直す必要がありません。各節が覚えている大きさを使うので、木の高さだけの回数で答えが出ます。

また、番号を引数として持ち歩く書き方なので、途中で値を作り直さずに済みます。`lookup` と並べると、キーの探索を「値」と「番号」の 2 通りで行える、という見方もできます。

## まとめ

- 並び順の番号は、部分木の大きさを足していくと求まる。
- 途中の結果を引数で持ち歩くと、余計な計算を省ける。
- 節に大きさを覚えさせておくと、位置の計算が速い。
