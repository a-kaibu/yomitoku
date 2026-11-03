---
title: "空の配列 [] を、中間の値なしで書く"
description: "aeson の emptyArray_。JSON の空の配列 [] を、2 文字の部品で直接書き出す。空の場合の特別扱いで、無駄な処理を省く。"
language: haskell
project: "aeson"
repo: https://github.com/haskell/aeson
license: "BSD-3-Clause"
copyright: "Copyright (c) 2011, MailRank, Inc. 2014-2026 Aeson project contributors"
commit: "1dd465c115ccface4cbb5f17f038c5843d4d4ed9"
file: src/Data/Aeson/Encoding/Builder.hs
lines: [150, 151]
function: "emptyArray_"
difficulty: 1
format: 2
tags: [入出力, 最適化, イディオム]
---

## ひとことで

`emptyArray_` は、JSON の空の配列 `[]` を書き出す `Builder` です。配列の要素をたどる処理を通さず、2 文字だけを直接書き出します。

空の配列は、要素を 1 つも持たないので、とても単純な場合です。この特別な形を用意しておくと、一般の配列の処理を呼ばずに済みます。

## コード

```haskell:line-numbers=150
emptyArray_ :: Builder
emptyArray_ = BP.primBounded (ascii2 ('[',']')) ()
```

## 前提知識

- **`Builder`**: 出力のバイト列を組み立てる型です。
- **`BP.primBounded`**: `BoundedPrim` の部品を、`Builder` として使えるように包む関数です。
- **`ascii2 ('[',']')`**: 前の記事の部品で、`[` と `]` の 2 文字を書きます。
- **`()`**: 値を持たないことを表す型です。ここでは、部品に渡す入力が無いことを示します。

## 何をしているか

### 1. 2 文字の部品を作る

`ascii2 ('[',']')` は、`[` と `]` を書く部品です。

### 2. Builder として包む

```haskell:line-numbers=151
emptyArray_ = BP.primBounded (ascii2 ('[',']')) ()
```

`BP.primBounded` で部品を `Builder` にします。入力は `()` で、何も書き換えません。結果は、常に `[]` の 2 文字になります。

## ここがすごい

空の配列を、一般の配列の処理（要素を 1 つずつ書く）に通さず、固定の 2 文字として書きます。空のケースは頻繁に出てくるので、この近道が出力全体の速さに効きます。

また、同じ考え方で、空のオブジェクト `{}` の `emptyObject_` も用意されています。よく出る特別な形を、専用の部品として名前を付けておくのが、このライブラリの方針です。

## まとめ

- よく出る特別な値は、専用の部品を用意すると速く書ける。
- 固定の文字列は、部品にして直接書き込むと、中間の処理を省ける。
- 空の場合の近道を、名前を付けて残すと読み手にも分かりやすい。
