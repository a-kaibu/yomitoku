---
title: "後ろに何が続かないかを確かめる、読み戻しのない先読み"
description: "parsec の notFollowedBy。パーサが成功したら失敗し、失敗したら成功する。入力は消費せず、後ろに何も続かないことだけを確かめる。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [286, 286]
function: "notFollowedBy"
difficulty: 3
format: 2
tags: [パース, 関数型, 防御的プログラミング]
---

## ひとことで

`notFollowedBy p` は、パーサ `p` が成功したら失敗し、失敗したら成功します。結果の値は捨てて、入力を消費しない「先読み」の確認だけを行います。

## コード

```haskell:line-numbers=286
notFollowedBy p     = try (do{ c <- try p; unexpected (show c) }
```

## 前提知識

- **先読み**: 入力を読んで確かめるが、読んだ分は消費せずに戻す動作です。
- **`try`**: 途中で失敗しても、入力を最初の位置に戻すパーサです。
- **`unexpected`**: 「予期しないもの」として失敗させるパーサです。
- **`<|>`**: 左を試し、失敗したら右を試す選択です。

## 何をしているか

### 1. 型で、結果の値を捨てることを示す

```haskell
notFollowedBy :: (Stream s m t, Show a) => ParsecT s u m a -> ParsecT s u m ()
```

戻り値は `()` で、読んだ値は残しません。`Show a` は、失敗時に読んだものを表示するためです。

### 2. 成功したら失敗させる

```haskell:line-numbers=286
notFollowedBy p     = try (do{ c <- try p; unexpected (show c) }
```

`try p` が成功すると、読んだ値 `c` を使って `unexpected` で失敗させます。外側の `try` は、その失敗のあとで入力を戻します。

### 3. 失敗したら成功にする

```haskell
                           <|> return ()
```

`p` が失敗していれば、`unexpected` へは進まず、`return ()` で成功します。ここで成功と失敗が反転します。

例えば、キーワード `end` の後ろに英字が続かないことを確かめるとき、`notFollowedBy alphaNum` と書けます。

## ここがすごい

「続かないこと」を、否定の関数を別に用意せずに、2 つの `try` と `<|>` の組み合わせだけで表しています。入力を戻す処理を `try` に任せるので、読み方の間違いが起きにくい作りです。

単語の区切りを確かめるような場面で、読み進めずに条件だけを見られるのが強みです。

## まとめ

- 「後ろに続かない」は `notFollowedBy` で表せる。
- 入力は消費せず、確かめるだけで戻る。
- 2 つの `try` と `<|>` を組み合わせて、成功と失敗を反転させている。
