---
title: "いちばん大きい要素の位置を返す"
description: "vector の maxIndex。ベクターの中で最も大きい要素の位置を返す。同じ大きさが複数あれば、先に出てきたほうの位置を返す。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [2040, 2040]
function: "maxIndex"
difficulty: 1
format: 2
tags: [探索, 数値計算, イテレータ]
---

## ひとことで

`maxIndex v` は、ベクター `v` の中でいちばん大きい要素の位置（番号）を返す関数です。最大値そのものではなく、その場所を返す点が特徴です。

## コード

```haskell:line-numbers=2040
maxIndex = maxIndexBy compare
```

## 前提知識

- **位置（インデックス）**: ベクターの先頭を 0 とした、要素の番号です。
- **`Ord a`**: 大小を比べられる型の制約です。
- **`compare`**: 2 つの値を比べて、小さい・等しい・大きいを返す関数です。
- **`maxIndexBy`**: 比べ方を指定して、最大の位置を探す一般的な関数です。

## 何をしているか

### 1. 比べ方を決める

```haskell:line-numbers=2040
maxIndex = maxIndexBy compare
```

`compare` という標準の比べ方を、`maxIndexBy` に渡しています。`maxIndex` は、その一般の関数を、比べ方を固定した特別な形として定義しています。

## ここがすごい

本体は 1 行だけです。探す仕組みは `maxIndexBy` にまかせ、`maxIndex` は「標準の大小で探す」という意味だけを表しています。

同じ部品を使い回すので、比べ方を変える場合も、同じ考え方でそのまま書けます。

実際の使い方としては、`maxIndex` で位置を求め、そのあとで `v ! i` のように要素を取り出す形になります。最大値を探す処理と、その位置を探す処理を、1 回の関数の呼び出しで表せるのが便利です。同じ大きさの要素が複数あるときは、先に出てきた位置が選ばれるので、結果は毎回同じになります。

## まとめ

- 特別な場合は、一般の関数に決まった引数を渡すだけで書ける。
- 最大値の位置を知りたいときは、値ではなく位置を返す関数が役立つ。
- 同じ大きさがあるときの扱いを、先に決めておくと安心して使える。
