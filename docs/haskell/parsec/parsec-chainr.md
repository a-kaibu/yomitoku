---
title: "右結合の式を、空でも読める「chainr」"
description: "Parsec の chainr。chainr1 を選択肢で包み、0 個のときは既定値を返す。べき乗のように、右から結合する式に使う。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [187, 187]
function: "chainr"
difficulty: 2
format: 2
tags: [パース, イディオム, 関数型]
---

## ひとことで

`chainr p op x` は、`chainr1 p op` を試し、値が 1 つも読めなかったら既定値 `x` を返します。右結合の演算子の列を、0 個でも読めるようにする関数です。

`chainr1` は右結合の式を読む関数で、`chainr` はそれを空の場合にも対応させたものです。

## コード

```haskell:line-numbers=187
chainr p op x       = chainr1 p op <|> return x
```

## 前提知識

- **右結合**: 演算子が右から順に適用される結び方です。`2 ^ 3 ^ 2` は `2 ^ (3 ^ 2)` です。
- **`chainr1`**: 1 個以上の値を、右結合で読む関数です。
- **`<|>` と `return`**: 消費せず失敗したら既定値を返す、`option` と同じ仕組みです。

## 何をしているか

```haskell:line-numbers=187
chainr p op x       = chainr1 p op <|> return x
```

### 1. まず chainr1 を試す

`chainr1 p op` が、1 個以上の式を右結合で読みます。

### 2. 読めなければ既定値

`<|> return x` で、1 個も読めなかったときは既定値 `x` を返します。

具体例で見ます。べき乗の式を読む場合、既定値を `1` にしておけば、式が空のときも `1` を得られます。

## ここがすごい

既定値を付けるという処理を、1 行で表せます。`option` と同じ形を、右結合の専用の関数に当てはめています。

部品を組み合わせることで、結合の向きと空の場合の扱いを、別々に決められます。読み手は、名前から振る舞いをすぐに思い描けます。

## まとめ

- 右結合の式と、既定値の処理は、別の部品として組み合わせられる。
- 空の場合を 1 行で書けると、解析の規則が読みやすい。
- 結合の向きは、畳み込みの形で決まり、コードにそのまま現れる。
