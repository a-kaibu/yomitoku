---
title: "1 本のリストを、フォーカス付きの並びに変える「differentiate」"
description: "xmonad の Stack を作る differentiate。リストの先頭をフォーカスに置き、残りを右側へ並べる。空のリストには Nothing を返す。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [327, 329]
function: "differentiate"
difficulty: 2
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`differentiate` は、普通のリストを、フォーカス付きの `Stack` に変える関数です。リストの先頭の要素がフォーカスされ、残りの要素は右側に並びます。空のリストなら、`Nothing` を返します。

前の記事の `integrate` の逆の操作です。`integrate` は `Stack` を 1 本のリストに戻し、`differentiate` はリストから `Stack` を作ります。

## コード

```haskell:line-numbers=327
differentiate :: [a] -> Maybe (Stack a)
differentiate []     = Nothing
differentiate (x:xs) = Just $ Stack x [] xs
```

## 前提知識

- **`Maybe`**: 値があるか、ないかを表す型です。空のリストには作れる `Stack` がないので、`Nothing` になります。
- **パターンマッチ `(x:xs)`**: 先頭の要素 `x` と、残りのリスト `xs` に分けて取り出します。
- **`Just`**: `Maybe` の中に値があることを表す箱です。
- **`[]`**: 空のリストです。

## 何をしているか

### 1. 空のリストの場合

```haskell:line-numbers=328
differentiate []     = Nothing
```

空のリストには、フォーカスできる要素がありません。そのため、`Nothing` を返します。

### 2. 空でないリストの場合

```haskell:line-numbers=329
differentiate (x:xs) = Just $ Stack x [] xs
```

先頭の要素 `x` をフォーカスに置きます。左側は空なので `[]` です。残りの `xs` は右側に並びます。結果は `Just` で包んで返します。

具体例で見ます。`differentiate [1,2,3]` は `Just (Stack 1 [] [2,3])` です。フォーカスは 1 で、右側に 2 と 3 が並んでいます。

## ここがすごい

空のリストを `Nothing` で表すことで、「フォーカスできる要素がない」という状態を、型で明示しています。呼ぶ側は、`Nothing` の場合を必ず確かめなければならず、その結果、空のときの処理を忘れにくくなります。

また、`integrate` と `differentiate` を組み合わせると、リストから `Stack` へ、そして `Stack` からリストへ、情報を失わずに往復できます。この対称性が、テストで性質として確かめやすい点です。

## まとめ

- 空の可能性がある値は、`Maybe` で表すと、扱い忘れを防げる。
- リストの先頭をフォーカスに置くと、位置を持つ並びを簡単に作れる。
- 対になる変換（`integrate` と `differentiate`）は、往復すると元に戻る性質が大切。
