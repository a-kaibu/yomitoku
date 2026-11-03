---
title: "いちばん小さい要素の位置を返す"
description: "vector の minIndex。ベクターの中で最も小さい要素の位置を返す。同じ大きさがあれば、先に出てきた位置を返す。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [2067, 2067]
function: "minIndex"
difficulty: 1
format: 2
tags: [探索, 数値計算, 関数型]
---

## ひとことで

`minIndex v` は、ベクター `v` の中でいちばん小さい要素の位置（番号）を返す関数です。最小値そのものではなく、その場所を知りたいときに使います。

## コード

```haskell:line-numbers=2067
minIndex = minIndexBy compare
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つ、配列に近いデータ構造です。
- **流れ（ストリーム、`stream`）**: ベクターの要素を 1 つずつ取り出せる形に変えたものです。
- **`Bundle`**: 流れに関する処理をまとめた内部のモジュールです。
- **関数合成（`.`）**: 右の処理の結果を左の処理に渡す書き方です。

## 何をしているか

### 1. 処理の中身

```haskell:line-numbers=2067
minIndex = minIndexBy compare
```

この関数は、`compare` という標準の比べ方を、`minIndexBy` に渡しています。`minIndexBy` が、比べ方に従って位置を探す仕組みを持っているので、ここでは比べ方を決めるだけです。

## ここがすごい

`maxIndex` と対になる関数です。最大と最小の両方を、同じ形で用意すると、どちらを使うか迷いません。また、本体は 1 行なので、役割がはっきり分かります。

実際に使うときは、いちばん小さい値の位置を使って、その位置の値を取り出す形で使います。同じ小さな値が複数あるときは、先に出てきた位置が返るので、結果は毎回同じになります。

## まとめ

最小の位置を知りたいときは、比べ方を渡すだけで専用の関数が作れます。

- 最小の位置は、最小の値とは別に必要になることがある。
- `maxIndex` と対にして覚えると分かりやすい。
- 本体が短いのは、探す仕組みを部品に任せているから。
