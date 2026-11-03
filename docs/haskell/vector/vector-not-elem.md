---
title: "指定した値が、ベクターに含まれないかを調べる"
description: "vector の notElem。ベクターの中に値が無いかを判定する。elem の否定を、そのまま流れの上で行う。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1697, 1697]
function: "notElem"
difficulty: 1
format: 2
tags: [探索, 関数型, 遅延評価]
---

## ひとことで

`notElem x v` は、ベクター `v` の中に値 `x` が含まれていなければ `True` を返し、含まれていれば `False` を返す関数です。

## コード

```haskell:line-numbers=1697
notElem x = Bundle.notElem x . stream
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つ、配列に近いデータ構造です。
- **流れ（ストリーム、`stream`）**: ベクターの要素を 1 つずつ取り出せる形に変えたものです。
- **`Bundle`**: 流れに関する処理をまとめた内部のモジュールです。
- **関数合成（`.`）**: 右の処理の結果を左の処理に渡す書き方です。

## 何をしているか

### 1. 処理の中身

```haskell:line-numbers=1697
notElem x = Bundle.notElem x . stream
```

この関数は、ベクターを流れに変えてから、`Bundle.notElem` で判定しています。`x` を先に渡しておくと、`notElem x` は「その値を探す関数」として使えます。見つかった時点で判定が決まるので、最後まで読まなくて済むこともあります。

## ここがすごい

「含まれない」を、別の関数を作らずに、判定の専用の関数として用意しています。読む側は、否定の意味をそのまま名前から読み取れます。また、流れの上で判定するので、途中のベクターを作る必要がありません。

実際に使うときは、`notElem 0 xs` のように書くと、ベクターに 0 が無いかを確かめられます。含まれているかを知りたいときは、この否定を取った `elem` を使います。

## まとめ

含まれないかどうかは、含まれるかどうかの否定として書けます。流れを使えば、途中の配列を作らずに判定できます。

- 否定の判定は、名前で意味を明確にすると読みやすい。
- 見つかれば決まる判定は、途中で止まるのが効率的。
- 部分関数を作って渡すと、判定の関数を使い回せる。
