---
title: "区切りつきの並びを、0 個以上読む「sepBy」"
description: "Parsec の sepBy。区切り記号で分けられた値の並びを読む。0 個のときは空のリストになる。sepBy1 を選択肢で包んで作る。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [116, 116]
function: "sepBy"
difficulty: 2
format: 2
tags: [パース, イディオム, 関数型]
---

## ひとことで

`sepBy p sep` は、パーサー `p` で読んだ値を、区切り `sep` で並べた列を読みます。結果は値のリストです。0 個でも成功し、その場合は空のリストになります。

たとえば、カンマで区切られた数の列 `1,2,3` を読むのに使えます。

## コード

```haskell:line-numbers=116
sepBy p sep         = sepBy1 p sep <|> return []
```

## 前提知識

- **`sepBy1`**: 1 個以上の並びを読む関数です。次の記事で見るように、区切りの有無を扱います。
- **`<|>`**: 左が消費せず失敗したら右を試す演算子です。
- **`return []`**: 何も読まずに、空のリストで成功するパーサーです。

## 何をしているか

```haskell:line-numbers=116
sepBy p sep         = sepBy1 p sep <|> return []
```

### 1. 1 個以上を試す

`sepBy1 p sep` を先に試します。`p` が 1 つも読めなければ、消費せずに失敗します。

### 2. だめなら空のリスト

`<|> return []` で、1 個も読めなかったときは、空のリストで成功します。

具体例で見ます。入力が `"1,2"` なら、`sepBy1` で `[1,2]` を得ます。入力が `"x"` なら、`sepBy1` は失敗するので、`[]` が結果になり、`x` は読まれないまま残ります。

## ここがすごい

「0 個」と「1 個以上」を、2 つの関数に分けて、選択肢で結ぶだけです。空の場合を、特別な分岐として書かずに済んでいます。

また、`sepBy1` が消費したあとの失敗を返すと、`<|>` はそこで止まります。途中まで読んだ不正な入力は、空のリストで隠されず、正しくエラーになります。

## まとめ

- 0 個以上の並びは、1 個以上の並びと「空」の選択肢で書ける。
- 区切りの有無を、関数の組み合わせで表すと読みやすい。
- 消費した失敗を隠さない規則が、エラーの位置を正しく保つ。
