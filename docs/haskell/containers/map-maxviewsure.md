---
title: "いちばん大きいキーを取り出し、木を組み直す"
description: "木の右端をたどって最大キーを取り出し、残った木の釣り合いを直す補助関数 maxViewSure。キーが必ずあると分かっている場面で使う。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [4217, 4221]
function: "maxViewSure"
difficulty: 3
format: 2
tags: [データ構造, 再帰, アルゴリズム]
---

## ひとことで

`maxViewSure` は、木の中でいちばん大きいキーを取り出し、キーと値を返すとともに、残りの木を返す関数です。名前の `Sure` は「必ずキーがある」という意味で、空の木を渡さないことが前提になっています。

木から 1 件を取り出すと、残った木の形が崩れるかもしれません。この関数は、取り出した後に釣り合いを直してから返します。

## コード

```haskell:line-numbers=4217
maxViewSure :: k -> a -> Map k a -> Map k a -> MaxView k a
maxViewSure !k x !l r = case r of
  Tip -> MaxView k x l
  Bin _ rk rx rl rr -> case maxViewSure rk rx rl rr of
    MaxView km xm r' -> MaxView km xm (balanceL k x l r')
```

## 前提知識

- **`MaxView` 型**: 取り出した結果を入れる箱です。`MaxView km xm r'` は「最大キー、その値、残りの木」の 3 つを持ちます。`MinView` と対になる型です。
- **`!k` と `!l`**: 引数を厳密に計算させる印です。キーや木を必要になる前に確定させます。
- **再帰で右端へ**: 木の右側に対して同じ関数を呼びます。右端は必ず最大キーなので、いちばん右の `Tip` に当たるまでたどります。

## 何をしているか

### 1. 右が空なら、この節のキーが最大

```haskell:line-numbers=4218
maxViewSure !k x !l r = case r of
  Tip -> MaxView k x l
```

右の木が `Tip` なら、この節のキー `k` と値 `x` が最大です。残りの木は左の木 `l` になります。

### 2. 右が空でないなら、さらに右へ進む

```haskell:line-numbers=4220
  Bin _ rk rx rl rr -> case maxViewSure rk rx rl rr of
    MaxView km xm r' -> MaxView km xm (balanceL k x l r')
```

右の木の中で `maxViewSure` を呼び、そこから返ってきた残りの木 `r'` を使います。その後、取り出し後の木を `balanceL k x l r'` で組み直します。

組み直しに `balanceL` を使うのは、取り出したことで右側が軽くなり、左側が相対的に重くなるからです。左側に寄せるように直すのが正しい、という理屈になっています。

## ここがすごい

「取り出して残りを組み直す」は、木の構造を壊さず 1 件だけ減らすための典型的な手法です。`maxViewSure` は、右端への再帰と、戻るときの釣り合い直しを 1 つの関数で行っています。

また、`MaxView` は 3 つの値をまとめて返すための小さな型で、`Maybe` や組（タプル）を使うより、中身の意味が名前で分かります。

この関数の役割は、`balanceR_` ほど複雑ではありません。`maxViewSure` は、取り出したあとの木が必ず崩れる可能性があるので、そのたびに `balanceL` を呼んでいます。取り出す処理と釣り合いを直す処理を分けて考えると、全体が理解しやすくなります。

## まとめ

- 木から最大を取り出すと、残りの木は組み直しが必要になる。
- 再帰で右端へたどり、戻るときに `balanceL` で直す。
- 結果を名前付きの型（`MaxView`）で返すと、読み手に意味が伝わりやすい。
