---
title: "昇順に並んだ要素から、木を一度に組み立てる"
description: "containers の Set で、重複のない昇順リストを線形時間で木にする fromDistinctAscList。小さな木を積み重ねる小さなスタックを使う。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [1251, 1256]
function: "fromDistinctAscList"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 遅延評価]
---

## ひとことで

`fromDistinctAscList` は、重複のない昇順のリストを受け取り、バランスの取れた `Set` を作る関数です。要素を 1 つずつ挿入するより速く、リストの長さに比例した時間で木を作れます。

## コード

```haskell:line-numbers=1251
fromDistinctAscList :: [a] -> Set a
fromDistinctAscList xs = ascLinkAll (Foldable.foldl' next Nada xs)
  where
    next :: Stack a -> a -> Stack a
    next (Push x Tip stk) !y = ascLinkTop stk 1 (singleton x) y
    next stk !x = Push x Tip stk
```

## 前提知識

- **`Set`**: 重複のない要素を、順番どおりに保存する集合です。
- **昇順**: 小さい順に並んでいることです。この関数は、リストが昇順で重複がないと信じて作ります。
- **`Foldable.foldl'`**: リストを左から 1 つずつ見て、途中の結果を更新していく関数です。`'` は値を毎回きちんと計算するという印です。
- **`!`（バング）**: 引数を先に計算させる印です。溜め込みを防ぎます。

## 何をしているか

### 1. 小さな木を、スタックに積んでいく

```haskell:line-numbers=1254
    next :: Stack a -> a -> Stack a
    next (Push x Tip stk) !y = ascLinkTop stk 1 (singleton x) y
    next stk !x = Push x Tip stk
```

`Stack` は、まだつながっていない木の列です。新しい要素が来たとき、スタックの先頭が「空の木を持つ 1 要素の木」なら、その 2 つを `ascLinkTop` で 1 つにまとめます。そうでなければ、新しい要素を 1 つの木としてスタックに積みます。

### 2. 残ったスタックを、最後にまとめる

```haskell:line-numbers=1252
fromDistinctAscList xs = ascLinkAll (Foldable.foldl' next Nada xs)
```

リストを全部積み終わったら、`ascLinkAll` でスタックに残った木を右から順につなぎます。これで 1 本の `Set` になります。

## ここがすごい

昇順なので、要素をつなげる場所がいつも木の右端に決まっています。そのため、毎回上から探す必要がありません。スタックは 2 進数のカウンタのように、同じ大きさの木が 2 つ並んだら 1 つにまとめます。

要素を 1 つずつ `insert` するなら、要素ごとに木をたどるので、全体は `n log n` になります。この関数は、木の作り方そのものを工夫して線形時間にしています。

## まとめ

- 昇順だと、木の作り方を大きく簡単にできる。
- 小さな木を、大きさが同じものどうしでまとめると、平衡が保たれる。
- 要素を 1 つずつ入れるより、一括で作るほうが速い場合がある。
