---
title: "組のベクターを、2 本のベクターに分ける"
description: "vector の unzip。(a, b) の組が並んだベクターを、a だけのベクターと b だけのベクターの 2 本に分ける。短い関数だが、2 回たどる書き方をしている。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1362, 1362]
function: "unzip"
difficulty: 1
format: 2
tags: [データ構造, 関数型, 遅延評価]
---

## ひとことで

`unzip xs` は、組 `(a, b)` が並んだベクターを、1 番目の値だけからなるベクターと、2 番目の値だけからなるベクターの 2 つに分けて返す関数です。

## コード

```haskell:line-numbers=1362
unzip xs = (map fst xs, map snd xs)
```

## 前提知識

- **組（タプル）**: 2 つの値をひとまとめにしたものです。`(1, 'a')` のように書きます。
- **`fst` と `snd`**: 組の 1 番目と 2 番目の値を取り出す関数です。
- **`map`**: 各要素に関数を当てて、新しいベクターを作る関数です。
- **2 つの結果を組で返す**: 関数が結果を 2 つ同時に返すための書き方です。

## 何をしているか

### 1. 1 番目の値を集める

```haskell:line-numbers=1362
unzip xs = (map fst xs, map snd xs)
```

`map fst xs` は、すべての組から 1 番目の値を取り出して、新しいベクターにします。

### 2. 2 番目の値を集める

同じ行で、`map snd xs` が、すべての組から 2 番目の値を取り出します。結果は 2 つのベクターを 1 つの組にして返されます。

## ここがすごい

分ける処理を、「1 番目を取る」と「2 番目を取る」の 2 つの `map` で、そのまま表しています。とても短く、意味がすぐ分かります。

一方で、ベクターを 2 回たどることになります。1 回のループで両方を作る方法もありますが、この書き方は読みやすさを優先した選択です。

## まとめ

- 分けたいものが 2 種類なら、それぞれを `map` で取り出すと分かりやすい。
- 短く書けることと、回数を減らすことは、ときどき両立しない。
- 組を扱う関数は、`fst` と `snd` の組み合わせで多くが表せる。
