---
title: "集合の最大の要素を取り出して、残りを返す"
description: "containers の Set で、いちばん大きい要素を取り出し、残りの集合と一緒に返す deleteFindMax。空の集合では、エラーになる。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Set/Internal.hs
lines: [1874, 1877]
function: "deleteFindMax"
difficulty: 2
format: 2
tags: [データ構造, 関数型, 防御的プログラミング]
---

## ひとことで

`deleteFindMax s` は、集合の中で最も大きい要素と、その要素を除いた残りの集合を組にして返す関数です。空の集合に使うと、エラーになります。

## コード

```haskell:line-numbers=1874
deleteFindMax :: Set a -> (a,Set a)
deleteFindMax t
  | Just r <- maxView t = r
  | otherwise = (error "Set.deleteFindMax: can not return the maximal element of an empty set", Tip)
```

## 前提知識

- **`(a, Set a)`**: 取り出した要素と、残りの集合を一緒に返すための組です。
- **`maxView`**: 最大の要素と残りを `Maybe` で返す関数です。
- **パターンガード（`| Just r <- ...`）**: 関数の中で、`Maybe` の中身を取り出して条件に使う書き方です。
- **`error`**: 実行をやめて、エラーのメッセージを表示する関数です。

## 何をしているか

### 1. 最大の要素があれば取り出す

```haskell:line-numbers=1876
  | Just r <- maxView t = r
```

`maxView t` が `Just` を返せば、その中身 `r` をそのまま結果にします。`r` には、最大の要素と残りの集合の組が入っています。

### 2. 空の集合ならエラーにする

```haskell:line-numbers=1877
  | otherwise = (error "Set.deleteFindMax: can not return the maximal element of an empty set", Tip)
```

最大の要素がなければ、要素の代わりに `error` を置きます。このエラーは、実際に値を使おうとしたときに表示されます。残りの集合は、空の `Tip` になります。

## ここがすごい

「取り出す」と「残りを返す」を、ひとつの組で同時に返しています。木を 2 回たどらずに済むので、無駄がありません。

また、空の場合のエラーを、値の中に遅延させて入れています。使わなければエラーにならない、という Haskell らしい書き方です。

## まとめ

- 2 つの結果を組で返すと、一度の処理で両方を得られる。
- 失敗を値として扱うと、必要になるまで止まらずに済む。
- 空の場合の動きを、先に決めておくと安心して使える。
