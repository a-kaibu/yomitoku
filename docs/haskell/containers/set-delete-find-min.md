---
title: "集合のいちばん小さい要素を、取り除きながら返す"
description: "containers の Data.Set の deleteFindMin。最小の要素と、それを取り除いた残りの集合の組を返す。空の集合では例外になる。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "\"(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow.\""
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [1864, 1867]
function: "deleteFindMin"
difficulty: 2
format: 2
tags: [データ構造, エラー処理]
---

## ひとことで

`deleteFindMin` は、集合の最も小さい要素を見つけて、それを取り除いた残りの集合と一緒に返す関数です。

## コード

```haskell:line-numbers=1864
deleteFindMin :: Set a -> (a,Set a)
deleteFindMin t
  | Just r <- minView t = r
  | otherwise = (error "Set.deleteFindMin: can not return the minimal element of an empty set", Tip)
```

## 前提知識

- **組（タプル）**: 複数の値を 1 つにまとめた値です。ここでは「要素と残りの集合」の 2 つを持ちます。
- **`minView`**: 最小の要素と残りの集合を `Maybe` で返す関数です。
- **`error`**: 実行を止めて、メッセージを表示する関数です。
- **部分関数**: すべての入力に答えを返すとは限らない関数のことです。空の集合が入力だと答えがありません。

## 何をしているか

### 1. 最小の要素があれば、そのまま返す

```haskell:line-numbers=1865
deleteFindMin t
  | Just r <- minView t = r
```

`minView t` が `Just r` を返すなら、その組 `r` をそのまま結果にします。パターンガードの `<-` で、`Just` の中身を取り出しています。

### 2. 空なら例外にする

```haskell:line-numbers=1867
  | otherwise = (error "Set.deleteFindMin: can not return the minimal element of an empty set", Tip)
```

`minView` が `Nothing` のとき（集合が空のとき）は、`error` でメッセージを出して止めます。組の 2 番目には空の木 `Tip` を入れていますが、実際にはこの値は使われません。

## ここがすごい

「見つける」と「取り除く」を 1 回の処理にまとめています。木をたどる仕事は `minView` に任せ、この関数は組を読み替えるだけです。

ただし、空の集合では答えがないので、例外で止まります。関数の注意書きに「`minView` を使うこと」と書かれているのは、そのためです。`Maybe` を返す安全な版を使うと、例外を避けられます。

## まとめ

- 最小の要素を取り出して残りを得るなら、組で返すと一度に扱える。
- 答えがない入力（空）では例外になるので、安全な版（`minView`）を選ぶと良い。
- 注意書きに書かれた「部分関数」の意味を、読み飛ばさないようにする。
