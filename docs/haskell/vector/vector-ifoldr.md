---
title: "位置つきの値を、右から順に畳み込む"
description: "vector の ifoldr。各要素の位置と値を組にして、右から順に関数へ渡して畳み込む。位置が必要な畳み込みに使う。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1799, 1799]
function: "ifoldr"
difficulty: 1
format: 2
tags: [データ構造, 関数型, イテレータ]
---

## ひとことで

`ifoldr f z v` は、ベクター `v` の各要素について、その位置と値を関数 `f` に渡しながら、右から畳み込む関数です。初期値は `z` です。

## コード

```haskell:line-numbers=1799
ifoldr f z = Bundle.foldr (uncurry f) z . Bundle.indexed . stream
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つ、配列に近いデータ構造です。
- **流れ（ストリーム、`stream`）**: ベクターの要素を 1 つずつ取り出せる形に変えたものです。
- **`Bundle`**: 流れに関する処理をまとめた内部のモジュールです。
- **関数合成（`.`）**: 右の処理の結果を左の処理に渡す書き方です。

## 何をしているか

### 1. 処理の中身

```haskell:line-numbers=1799
ifoldr f z = Bundle.foldr (uncurry f) z . Bundle.indexed . stream
```

この関数は、まず `Bundle.indexed` で、位置と値の組の流れを作ります。`uncurry f` は、組を 2 つの引数に分けて `f` に渡す変換です。その後、`Bundle.foldr` で右から畳み込みます。

## ここがすごい

位置と値を組にしてから、`uncurry` で関数に渡すことで、関数の形を変えずに位置を使えるようになっています。畳み込みの本体は、普通の `foldr` と同じ仕組みを使い回しています。

実際に使うときは、各要素の位置を使って、位置と値を組み合わせた新しい値を作るような畳み込みに使えます。位置を使わないときは、普通の `foldr` を選ぶほうが分かりやすくなります。

## まとめ

位置が必要な畳み込みは、値の組を流れにしてから、既存の畳み込みに渡すと書けます。

- 位置を使うときは、組を作ってから関数に渡すと分かりやすい。
- `uncurry` で、組と 2 引数の関数を行き来できる。
- 既存の畳み込みを再利用すると、新しい仕組みを増やさずに済む。
