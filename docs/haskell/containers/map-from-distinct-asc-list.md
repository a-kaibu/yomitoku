---
title: "昇順のキーと値から、Map を一度に組み立てる"
description: "containers の Map で、キーが重複せず昇順に並んだリストから木を線形時間で作る fromDistinctAscList。Set 版と同じ仕組みで、キーと値の組を扱う。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [3865, 3870]
function: "fromDistinctAscList"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 遅延評価]
---

## ひとことで

`fromDistinctAscList` は、キーが重複せず昇順に並んだ `(キー, 値)` のリストから、`Map` を作る関数です。リストを 1 回たどるだけで、木を組み立てられます。

## コード

```haskell:line-numbers=3865
fromDistinctAscList :: [(k,a)] -> Map k a
fromDistinctAscList xs = ascLinkAll (Foldable.foldl' next Nada xs)
  where
    next :: Stack k a -> (k, a) -> Stack k a
    next (Push kx x Tip stk) (!ky, y) = ascLinkTop stk 1 (singleton kx x) ky y
    next stk (!kx, x) = Push kx x Tip stk
```

## 前提知識

- **`Map`**: キーから値を探せる辞書のようなデータ構造です。キーは順番どおりに並んで保存されます。
- **`(k, a)`**: キーと値を 1 組にしたタプルです。`(!ky, y)` のように、パターンでキーと値を同時に取り出しています。
- **`Stack`**: まだつながっていない木を、積み重ねておく一時的な列です。
- **`!`（バング）**: 値を先に計算させて、遅延評価で溜まるのを防ぐ印です。

## 何をしているか

### 1. 組を 1 つずつ受け取り、スタックに積む

```haskell:line-numbers=3868
    next :: Stack k a -> (k, a) -> Stack k a
    next (Push kx x Tip stk) (!ky, y) = ascLinkTop stk 1 (singleton kx x) ky y
    next stk (!kx, x) = Push kx x Tip stk
```

スタックの先頭が「1 要素の木」なら、新しい組 `(ky, y)` と合わせて、その木をつなげます。そうでなければ、新しい組を 1 要素の木としてスタックに積みます。

### 2. 最後にスタックを一つの木にする

```haskell:line-numbers=3866
fromDistinctAscList xs = ascLinkAll (Foldable.foldl' next Nada xs)
```

すべての組を処理し終わったら、`ascLinkAll` で残りの木を右から順につなぎ、1 本の `Map` にします。

## ここがすごい

`Set` 版と同じく、昇順であることを信じることで、途中で木の比較をしなくて済みます。キーどうしの大小を調べる必要がないので、つなぐ位置はいつも右端に決まります。

もし、要素を 1 つずつ `insert` していたら、キーを探す回数が増えてしまいます。この関数は、リストを一度通るだけで、正しく平衡の取れた木を作ります。

## まとめ

- 昇順のデータなら、木を一度に組み立てられる。
- 2 進数のカウンタと同じように、同じ大きさの木をまとめるとバランスが保たれる。
- 「昇順」「重複なし」という前提を守ることが、速さの条件になる。
