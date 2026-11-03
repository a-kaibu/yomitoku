---
title: "同じパーサを、決めた回数だけ順番に読む"
description: "attoparsec の count。指定した回数だけパーサを順に実行し、結果をリストにまとめる。数や長さが先に分かっている入力に向いている。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Copyright (c) Lennart Kolmodin"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Combinator.hs
lines: [234, 235]
function: "count"
difficulty: 1
format: 2
tags: [パース, 関数型, イディオム]
---

## ひとことで

`count n p` は、パーサ `p` を `n` 回続けて実行し、それぞれの結果を順番どおりに並べたリストを返します。`n` 回のどれか 1 つでも失敗すると、全体も失敗します。

## コード

```haskell:line-numbers=234
count :: Monad m => Int -> m a -> m [a]
count n p = sequence (replicate n p)
```

## 前提知識

- **`Monad m`**: 処理を順番どおりに実行し、途中の結果を次の処理に渡せる型の制約です。パーサもこの仲間です。
- **`replicate n p`**: 同じ値 `p` を `n` 個並べたリストを作る関数です。
- **`sequence`**: 処理のリストを順番に実行して、結果のリストを 1 つにまとめる関数です。

## 何をしているか

### 1. 同じパーサを n 個並べる

```haskell:line-numbers=235
count n p = sequence (replicate n p)
```

`replicate n p` で、`p` が `n` 個並んだリストを作ります。これは「`p` を 3 回読む」という予定表のようなものです。まだ実行はされていません。

### 2. 順番に実行して、結果をまとめる

```haskell:line-numbers=235
count n p = sequence (replicate n p)
```

`sequence` は、その予定表を先頭から順に実行します。1 回目の結果、2 回目の結果と並べ、最後に全部をリストにして返します。途中で失敗すれば、そこで止まります。

## ここがすごい

関数の本体は 1 行だけです。新しい繰り返しの仕組みを作らず、「同じものを並べる」と「順に実行する」という 2 つの基本部品を組み合わせています。

この書き方は、どんなモナドでも使えます。パーサ以外の処理にも、同じ形のまま使い回せます。

## まとめ

- 回数が決まっている繰り返しは、`replicate` と `sequence` で書ける。
- 小さな部品を組み合わせると、関数本体が短くなる。
- モナドの制約を使うと、同じ関数を色々な型に使える。
