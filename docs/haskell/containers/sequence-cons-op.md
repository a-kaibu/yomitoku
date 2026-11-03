---
title: "列の左端に 1 件足す、三角形の記号「<|」"
description: "Data.Sequence の <|。列の先頭に要素を追加する。内部の指の木（finger tree）の先頭に付けるだけなので、一定の時間で済む。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Sequence/Internal.hs
lines: [1891, 1892]
function: "<|"
difficulty: 2
format: 2
tags: [データ構造, 関数型, アルゴリズム]
---

## ひとことで

`<|` は、`Seq`（列）の左端に 1 つの要素を付け加える演算子です。`x <| s` は、`x` を先頭に持つ新しい列を返します。

ドキュメントのコメントには、「三角形の先端に 1 つの要素がある形」と覚え方が書かれています。

## コード

```haskell:line-numbers=1891
(<|)            :: a -> Seq a -> Seq a
x <| Seq xs     =  Seq (Elem x `consTree` xs)
```

## 前提知識

- **`Seq`**: 要素を順番に持つ列です。先頭にも末尾にも、速く追加できます。
- **指の木（finger tree）**: 両端に「指」と呼ばれる小さな配列を持つ、平衡した木です。両端の操作が速くなります。
- **`Elem`**: 列の要素を、木の中で包むための型です。
- **`consTree`**: 木の左端に要素を付ける関数です。次の記事で見ます。

## 何をしているか

### 1. 要素を木の要素の形に包む

```haskell:line-numbers=1892
x <| Seq xs     =  Seq (Elem x `consTree` xs)
```

`Elem x` は、要素 `x` を木に入れられる形に包みます。

### 2. 木の左端に付ける

`Elem x `consTree` xs` は、包んだ要素を、木 `xs` の左端に付けます。`Seq` の中身は、この木です。

新しい値は、列の中身の木を作り直して返されます。元の列は変わりません。

## ここがすごい

両端への追加が一定の時間で済むのは、指の木の設計のおかげです。左端の指が一杯になったときだけ、木の内側へ要素を送ります。普段は、小さな指へ付けるだけなので、速く終わります。

また、`<|` の書き方が、`x <| s` と、要素と列を並べて書けるようになっています。演算子の形が、結果の列の形を素直に表しています。

## まとめ

- 両端に速く追加できる列は、指の木で作れる。
- 要素を木の形に包んでから付けると、型の上で安全に扱える。
- 演算子の形を、データの並びに合わせると読みやすい。
