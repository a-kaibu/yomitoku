---
title: "終わりの記号が来るまで、読み続ける「manyTill」"
description: "Parsec の manyTill。終わりのパーサーが成功するまで、本体のパーサーを繰り返す。終わりの記号は結果に含めない。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [303, 307]
function: "manyTill"
difficulty: 3
format: 2
tags: [パース, 再帰, 関数型]
---

## ひとことで

`manyTill p end` は、終わりのパーサー `end` が成功するまで、本体のパーサー `p` を繰り返します。結果は、`p` の値のリストです。`end` が読んだ記号は、結果に含まれません。

たとえば、コメントの本文を「`*/` が来るまで」読むような場面で使います。

## コード

```haskell:line-numbers=303
manyTill p end      = scan
                    where
                      scan  = do{ _ <- end; return [] }
                            <|>
                              do{ x <- p; xs <- scan; return (x:xs) }
```

## 前提知識

- **`scan` という名前**: 「終わりを探しながら進む」という意味で付けられた、ローカルの再帰の関数です。
- **`do` 記法**: パーサーを順に実行する書き方です。
- **`<|>`**: 左が消費せず失敗したら右を試す演算子です。ここでは、「終わり」か「続き」かを選ぶために使われます。
- **`return []`**: 空のリストで成功するパーサーです。

## 何をしているか

### 1. 終わりを先に試す

```haskell:line-numbers=305
                      scan  = do{ _ <- end; return [] }
```

まず `end` を試します。成功したら、空のリストを返して終わります。`end` が読んだ記号は、結果に入りません。

### 2. 終わりでなければ本体を読む

```haskell:line-numbers=306
                            <|>
                              do{ x <- p; xs <- scan; return (x:xs) }
```

`end` が消費せず失敗したら、`p` を 1 つ読みます。そして、残りを `scan` で再帰的に読み、`x:xs` で先頭に付けて返します。

## ここがすごい

「終わりかどうか」を確かめてから、1 つ読むという順番が、この関数の要です。終わりの記号と、本体の内容が重なっていても、先に終わりを試すので正しく区切れます。

また、再帰の形が、「読んだ値を先頭に付けながら返す」になっているので、結果の順番は読んだ順のままです。前の記事の `many` のような逆順の処理は要りません。

## まとめ

- 終わりを探す繰り返しは、先に終わりを試し、だめなら 1 つ読む形で書ける。
- 終わりの記号を結果から外すと、利用者は区切りだけを意識すればよい。
- 再帰の中で値を先頭に付けると、順番を保ったまま結果を返せる。
