---
title: "関数の結果を並べて、長さ n の列を作る"
description: "containers の Seq で、インデックスから値を計算する関数を受け取り、長さ n の列を作る fromFunction。指数的に分けた木を使い、無駄なく組み立てる。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Sequence/Internal.hs
lines: [3425, 3428]
function: "fromFunction"
difficulty: 3
format: 2
tags: [データ構造, 関数型, 遅延評価]
---

## ひとことで

`fromFunction` は、「0 番目から `len - 1` 番目までの値を計算する関数 `f`」を受け取り、その値を順に並べた `Seq` を作る関数です。リストを作ってから変換するのではなく、直接木を組み立てます。

## コード

```haskell:line-numbers=3425
fromFunction :: Int -> (Int -> a) -> Seq a
fromFunction len f | len < 0 = error "Data.Sequence.fromFunction called with negative len"
                   | len == 0 = empty
                   | otherwise = Seq $ create (lift_elem f) 1 0 len
```

## 前提知識

- **`Seq`**: 両端への追加や、途中の値の取り出しが速い列です。内部では「指の木（finger tree）」という木を使っています。
- **`Int -> a`**: 整数を受け取って値を返す関数です。`f 3` は 3 番目の値になります。
- **ガード（`|`）**: 条件に応じて処理を分けています。負の長さはエラー、0 は空の列、それ以外は本体の作成です。
- **`error`**: 間違った入力のときに、プログラムを止めて理由を伝える関数です。

## 何をしているか

### 1. 不正な長さと空の場合を先に処理する

```haskell:line-numbers=3426
fromFunction len f | len < 0 = error "Data.Sequence.fromFunction called with negative len"
                   | len == 0 = empty
```

長さが負の値なら、エラーにします。長さが 0 なら、中身のない `empty` を返します。

### 2. 木を組み立てる

```haskell:line-numbers=3428
                   | otherwise = Seq $ create (lift_elem f) 1 0 len
```

それ以外のとき、補助関数 `create` に関数 `f`、要素の大きさ 1、開始位置 0、要素数 `len` を渡します。`create` は、要素を 1 つずつ並べるのではなく、同じ大きさの塊を組み合わせて木を作ります。

## ここがすごい

リストを作って `Seq` に変換すると、途中で一度リスト全体のメモリを使ってしまいます。この関数は、値を計算しながら、直接木の形に並べていきます。

また、`create` は要素数を 3 で割ったときの余りで形を選びます。木の左右の深さがそろうので、後の操作が速く保たれます。

## まとめ

- 関数から列を作るとき、リストを経由しないと無駄が減る。
- 入力が不正なときは、最初に調べてエラーにしておくと読みやすい。
- 木の形を、要素数に応じて工夫すると、後の操作まで速くなる。
