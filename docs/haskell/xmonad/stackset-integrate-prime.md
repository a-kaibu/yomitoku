---
title: "フォーカスがないかもしれない並びを、リストに戻す"
description: "xmonad の integrate'。フォーカスが無い（Nothing の）場合は空のリスト、ある場合は integrate でリストに戻す。"
language: haskell
project: "xmonad"
repo: https://github.com/xmonad/xmonad
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2007,2008 Spencer Janssen; Copyright (c) 2007,2008 Don Stewart; Copyright (c) The Xmonad Community.\""
commit: "7d51cb02f257663a65ec8a48a14af98ba66a9f65"
file: src/XMonad/StackSet.hs
lines: [320, 321]
function: "integrate'"
difficulty: 1
format: 2
tags: [データ構造, 関数型, イディオム]
---

## ひとことで

`integrate'` は、`Maybe (Stack a)` を受け取り、リストに戻す関数です。`Stack` が無い場合（`Nothing`）は、空のリストを返します。

ワークスペースに窓が 1 つもないと、`Stack` は存在しません。この関数は、その「空っぽ」の場合を、呼ぶ側が意識しなくて済むように吸収します。

## コード

```haskell:line-numbers=320
integrate' :: Maybe (Stack a) -> [a]
integrate' = maybe [] integrate
```

## 前提知識

- **`Maybe`**: 値があるかないかを表す型です。
- **`maybe`**: `maybe 既定値 関数 m` の形の関数です。`m` が `Nothing` なら既定値、`Just x` なら `関数 x` を返します。
- **点なしの定義**: `integrate' = ...` のように、引数を書かずに関数を定義しています。
- **前の記事の `integrate`**: `Stack` を 1 本のリストに戻す関数です。

## 何をしているか

```haskell:line-numbers=321
integrate' = maybe [] integrate
```

### 1. Nothing のときは空リスト

`maybe [] integrate` の最初の引数 `[]` が、`Nothing` のときの値です。空のリストが返ります。

### 2. Just のときは integrate を使う

同じ式の 2 番目の引数 `integrate` が、`Just` の中身に適用されます。前の記事で見た、フォーカス付きの並びをリストに戻す関数です。

具体例で見ます。`integrate' Nothing` は `[]` です。`integrate' (Just (Stack 1 [] [2,3]))` は `[1,2,3]` です。

## ここがすごい

`maybe` を使うと、場合分けを 1 行で書けます。`Nothing` と `Just` のどちらでも、呼び出し側は同じ形で結果を受け取れます。

点なしの定義にしたことで、引数の受け渡しを書かずに済み、関数の役割が「変換の組み合わせ」として読めます。

## まとめ

- `Maybe` の場合分けは、`maybe` を使うと 1 行で書ける。
- 空の場合を、リストの空として扱うと、呼ぶ側が簡単になる。
- 既にある変換を組み合わせると、新しい関数は短く済む。
