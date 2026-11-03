---
title: "失敗したら既定値を返す「option」"
description: "Parsec の option。パーサーが入力を消費せずに失敗したら、既定値を返す。消費したあとの失敗はそのまま報告する。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [68, 68]
function: "option"
difficulty: 2
format: 2
tags: [パース, エラー処理, イディオム]
---

## ひとことで

`option x p` は、パーサー `p` を試し、入力を消費せずに失敗したら、既定値 `x` を返します。成功したときは `p` の結果を返します。

たとえば、符号「`-`」が省略されることがある数の読み取りでは、`option '+' (char '-')` のように書けます。

## コード

```haskell:line-numbers=68
option x p          = p <|> return x
```

## 前提知識

- **`<|>`**: 消費せず失敗したときだけ、右を試す演算子です。
- **`return x`**: 何も読まずに、値 `x` で成功するパーサーです。
- **消費したかどうか**: 1 文字でも読んだあとの失敗は、既定値に切り替わりません。これは、`<|>` の規則そのものです。

## 何をしているか

```haskell:line-numbers=68
option x p          = p <|> return x
```

### 1. まず p を試し、だめなら既定値

`p <|> return x` は、「`p` を試す。消費せず失敗したら、`x` で成功する」という意味です。

具体例で見ます。`option 0 digit` は、数字があれば読み、なければ 0 を返します。入力が `"a"` のときは、`digit` が何も消費せず失敗するので、0 になります。

## ここがすごい

既定値を返すという処理を、`<|>` と `return` の 2 つの部品だけで書けます。新しい仕組みを増やさず、既存の選択肢の規則を使い回しています。

また、消費したあとの失敗は既定値に切り替わらないという規則があるので、途中まで読んだ不正な入力は、正しくエラーになります。「黙って既定値にしない」という安全性が、規則に組み込まれています。

## まとめ

- 省略できる部分は、`<|> return 既定値` で表せる。
- 既定値への切り替えは、消費していない失敗のときだけ起きるようにする。
- 小さな部品の組み合わせで、よく使う形を短く書ける。
