---
title: "区切りの後ろに必ず付く、繰り返しの読み方"
description: "parsec の endBy1。要素のあとに必ず区切りが付く形を 1 回以上読む。sepBy1 と違い、最後の区切りを飲み込むのが特徴。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [159, 159]
function: "endBy1"
difficulty: 2
format: 2
tags: [パース, 関数型, イディオム]
---

## ひとことで

`endBy1 p sep` は、`p` と `sep` の組を 1 回以上くり返して読み、`p` の結果だけを並べたリストを返します。最後の要素のあとにも区切りが必要です。

## コード

```haskell:line-numbers=159
endBy1 p sep        = many1 (do{ x <- p; _ <- sep; return x })
```

## 前提知識

- **パーサ**: 入力を読んで値を作る部品です。
- **`do{ ... }`**: 処理を順に書く構文です。`;` で文を区切って、1 行に並べて書けます。
- **`many1`**: 1 回以上くり返すパーサです。
- **区切り（sep）**: 要素の間に挟まる記号です。例えば `,` です。

## 何をしているか

### 1. 型で、区切りの型が別になることを示す

```haskell
endBy1 :: (Stream s m t) => ParsecT s u m a -> ParsecT s u m sep -> ParsecT s u m [a]
```

要素のパーサ `p` と区切りのパーサ `sep` は、型が違っていてもかまいません。結果は要素 `a` のリストです。

### 2. 要素と区切りを 1 組として読む

```haskell:line-numbers=159
endBy1 p sep        = many1 (do{ x <- p; _ <- sep; return x })
```

`do{ x <- p; _ <- sep; return x }` が 1 組です。要素を読み、続けて区切りを読み、要素だけを返します。`many1` はその組を 1 回以上くり返します。

例えば `a;b;` を `;` 区切りで読むと、`["a","b"]` になります。末尾の `;` も必ず読まれます。

## ここがすごい

`sepBy1` は「間」に区切りを置くので、最後の要素のあとには区切りがありません。`endBy1` は「後ろ」に区切りを置く形なので、`1;2;3;` のように行末に区切りが付く書式にぴったり合います。

同じ `many1` を、要素と区切りの組に対して使うだけで書けるので、新しい仕組みは要りません。

## まとめ

- 末尾に区切りが付く形は `endBy1` で表せる。
- 「要素と区切りの組」を作って `many1` でくり返すのが定義の要点。
- 間に置く `sepBy1` と、後ろに置く `endBy1` は使い分ける。
