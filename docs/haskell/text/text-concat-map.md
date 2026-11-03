---
title: "文字の列を作る関数を当てて、つなげて 1 本にする"
description: "text の Stream で、各文字を文字列に変えながら、順番どおりに連結する concatMap。右から畳み込みながら、append でつないでいく。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [771, 772]
function: "concatMap"
difficulty: 2
format: 2
tags: [文字列処理, 関数型, イテレータ]
---

## ひとことで

`concatMap f s` は、文字列の各文字に関数 `f` を当てて、できた文字列を順番どおりにつなげて 1 本にする関数です。1 文字を複数の文字に広げる処理に使えます。

## コード

```haskell:line-numbers=771
concatMap :: (Char -> Stream Char) -> Stream Char -> Stream Char
concatMap f = foldr (append . f) empty
```

## 前提知識

- **`Stream Char`**: 文字を 1 つずつ流しながら扱う、text 内部の列の型です。
- **`foldr`**: 右から順に要素を組み合わせていく関数です。
- **`append`**: 2 つの列を前後につなげる関数です。
- **関数合成（`.`）**: `append . f` は、「まず `f` を当て、その結果を `append` に渡す」という意味です。

## 何をしているか

### 1. 1 文字ごとに関数を当てる

```haskell:line-numbers=772
concatMap f = foldr (append . f) empty
```

`append . f` は、文字を受け取って `f` で列にし、その列を後ろに足す関数です。`foldr` は、この関数を各文字に順番に使い、最後に `empty` から積み上げます。

## ここがすごい

結果の列を一度リストにしてから連結する方法では、途中で大きなリストが作られます。この関数は、`foldr` と `append` を組み合わせることで、列をそのまま流しながら作ります。

`INLINE [0]` の指定で、コンパイラが他の処理と組み合わせて最適化しやすくなっています（この指定は、関数の本体には含めていません）。

## まとめ

- 1 つの要素を複数に広げるときは、関数を当ててつなげる形が使える。
- 関数の合成で、「当てる」と「つなぐ」を 1 つの式にまとめられる。
- 途中のリストを作らないと、大きな入力でもメモリを節約できる。
