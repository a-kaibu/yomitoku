---
title: "選択肢のリストを、foldr で <|> に畳み込む"
description: "Parsec の choice。パーサーのリストを、<|> で右から順につないで 1 つの選択肢にする。最後の選択肢として mzero を使う。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [56, 56]
function: "choice"
difficulty: 2
format: 2
tags: [パース, 関数型, イディオム]
---

## ひとことで

`choice` は、パーサーのリストを受け取り、そのうちのどれかに当てはまるものを使う 1 つのパーサーを作ります。`choice [p, q, r]` は、`p <|> q <|> r` と同じ意味です。

リストの長さがいくつでも書けるように、`foldr` で畳み込んで作っています。

## コード

```haskell:line-numbers=56
choice ps           = foldr (<|>) mzero ps
```

## 前提知識

- **`<|>`**: 左を試し、消費せずに失敗したら右を試す演算子です。前の記事で、その中身を見ました。
- **`foldr`**: リストを右から畳み込む関数です。`foldr f z [a,b,c]` は `a `f` (b `f` (c `f` z))` と同じ形になります。
- **`mzero`**: 常に失敗するパーサーです。畳み込みの最後の値として使われます。
- **`ps`**: パーサーのリストを表す引数の名前です。

## 何をしているか

```haskell:line-numbers=56
choice ps           = foldr (<|>) mzero ps
```

### 1. リストを右から <|> でつなぐ

`foldr (<|>) mzero ps` は、リストの最後に `mzero` を置き、その前に `<|>` を置いていきます。

具体例で見ます。`choice [p, q]` は、`p <|> (q <|> mzero)` になります。`mzero` は失敗するだけなので、結果は `p <|> q` と同じ挙動になります。

### 2. 空のリストの場合

空のリストを渡すと、畳み込みの結果は `mzero` そのものになります。つまり、どの選択肢も選べないパーサーになります。

## ここがすごい

選択肢の数を、関数の中で決める必要がありません。`foldr` と単位元（`mzero`）の組み合わせで、0 個でも 100 個でも同じ式で書けます。

また、`<|>` は結合則（どちらの括弧で結んでも同じ結果）を満たすので、`foldr` で右からつないでも、左からつないでも、動きは同じです。この性質に支えられて、短く書けています。

## まとめ

- 選択肢のリストは、`foldr` と `<|>` で 1 つのパーサーにできる。
- 単位元（何もしない値）を最後に置くと、空のリストも扱える。
- 結合則を満たす演算子は、畳み込みで安心して使える。
