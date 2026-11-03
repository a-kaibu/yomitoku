---
title: "同じ動作を何度も行い、結果を集めて 1 つのベクターにする"
description: "vector の replicateM。モナドの動作を n 回繰り返し、その結果をベクターにまとめる。乱数などの副作用を順番に起こす場面で使う。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [777, 777]
function: "replicateM"
difficulty: 2
format: 2
tags: [並行処理, 関数型, イディオム]
---

## ひとことで

`replicateM n m` は、モナドの動作 `m` を `n` 回実行して、その結果をベクターにまとめて返します。乱数を `n` 個取り出すような場面で使います。

## コード

```haskell:line-numbers=777
replicateM n m = unstreamM (MBundle.replicateM n m)
```

## 前提知識

- **モナド（Monad）**: 順番に実行する動作を、組み立てて扱うための仕組みです。`IO` や `ST` などがあります。
- **動作（action）**: モナドの中で実行される処理です。値を返すこともあります。
- **`Monad m`**: 動作 `m` を順番に実行できる型の制約です。
- **`unstreamM`**: モナドの中で、流れをベクターに戻す関数です。

## 何をしているか

### 1. 型で、結果がモナドに包まれることを示す

```haskell
replicateM :: (Monad m, Vector v a) => Int -> m a -> m (v a)
```

動作 `m a` を `Int` 回実行し、結果を `m (v a)` として返します。結果がベクターにまとまって、モナドの中に入っています。

### 2. 動作の流れをベクターにする

```haskell:line-numbers=777
replicateM n m = unstreamM (MBundle.replicateM n m)
```

`MBundle.replicateM n m` は、動作を `n` 回実行する流れを作ります。`unstreamM` がその結果を順番にベクターへ詰めていきます。

例えば `IO` で乱数を取る動作を 3 回実行すると、3 つの乱数が入ったベクターが 1 つ返ります。

## ここがすごい

リストの `replicateM` は、要素の組み合わせを全部作るなど、結果の数が増えやすいものです。ベクター版は、個数 `n` が決まっているので、結果を一度に確保して詰めていけます。

動作を流れとして扱うので、途中の結果を別のリストにしてから変換する無駄が省けます。

## まとめ

- 同じ動作を `n` 回したいときは、`replicateM` で結果をまとめられる。
- 結果はモナドの中のベクターになる。
- 個数が決まっているので、確保が 1 回で済む。
