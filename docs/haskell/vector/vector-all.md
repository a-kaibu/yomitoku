---
title: "すべての要素が条件を満たすかを調べる"
description: "vector の all。ベクターのすべての要素が条件を満たすなら True を返す。条件を反対にして、Bundle.and で判定している。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1846, 1846]
function: "all"
difficulty: 1
format: 2
tags: [探索, 関数型, イテレータ]
---

## ひとことで

`all f v` は、ベクター `v` のすべての要素が条件 `f` を満たすかどうかを調べる関数です。すべて満たせば `True`、1 つでも満たさなければ `False` を返します。

## コード

```haskell:line-numbers=1846
all f = Bundle.and . Bundle.map f . stream
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つ、配列に近いデータ構造です。
- **流れ（ストリーム、`stream`）**: ベクターの要素を 1 つずつ取り出せる形に変えたものです。
- **`Bundle`**: 流れに関する処理をまとめた内部のモジュールです。
- **関数合成（`.`）**: 右の処理の結果を左の処理に渡す書き方です。

## 何をしているか

### 1. 処理の中身

```haskell:line-numbers=1846
all f = Bundle.and . Bundle.map f . stream
```

この関数は、まず `Bundle.map f` で各要素を真偽値に変えます。その後、`Bundle.and` で、真偽値がすべて `True` かを調べます。1 つでも `False` があれば、そこで結果が決まります。

## ここがすごい

条件を真偽値の列に変えてから、`and` で判定を一度に行います。条件の書き方と、すべてを調べる仕組みを、別々の部品として組み合わせています。

実際に使うときは、`all even xs` のように条件を渡すと、すべての数が偶数かを一度に調べられます。空のベクターに対しては、どの要素も条件に反しないので `True` になります。

## まとめ

「すべて満たす」は、各要素の真偽を集めて、すべてが真かを見る形で書けます。

- 判定を真偽値の列に変えると、部品を組み合わせやすい。
- 1 つでも偽があれば決まるので、途中で止まる。
- `any` と対になっているので、一緒に覚えると分かりやすい。
