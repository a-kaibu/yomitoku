---
title: "どんな 1 バイトでも、1 つ読み取る"
description: "attoparsec の anyWord8。入力の次の 1 バイトを、どんな値でも読み取る。条件を常に真とする satisfy の使い方。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [447, 448]
function: "anyWord8"
difficulty: 1
format: 2
tags: [パース, 文字列処理, 関数型]
---

## ひとことで

`anyWord8` は、入力の次の 1 バイトを、値を問わず読み取るパーサです。入力が残っていれば、どのバイトでも成功します。

## コード

```haskell:line-numbers=447
anyWord8 :: Parser Word8
anyWord8 = satisfy $ const True
```

## 前提知識

- **`Word8`**: 1 バイトを表す数の型です。
- **`satisfy`**: 条件を満たす 1 バイトを読み取る、基本のパーサです。
- **`const True`**: どんな引数を受け取っても、常に `True` を返す関数です。
- **`$`**: 関数の適用を、読みやすく書くための演算子です。

## 何をしているか

### 1. 常に真の条件を作る

`const True` は、引数が何であっても `True` を返す関数です。これを条件として使うと、どのバイトも条件に合うことになります。

### 2. satisfy に渡して読む

```haskell:line-numbers=448
anyWord8 = satisfy $ const True
```

`satisfy` に、常に真の条件を渡します。すると、入力に 1 バイトさえあれば、そのバイトを読み取って成功します。

## ここがすごい

「どんな値でもよい」という条件を、新しい読み取りの仕組みを作らずに、既存の `satisfy` に渡すだけで表しています。

また、この書き方は、条件を変えるだけで、他の読み取りにも応用できます。

実際の使い方としては、`anyWord8` を読んで、そのまま値を変換する処理の入口に置くことがよくあります。たとえば、先頭のバイトだけを取り出したいときに役立ちます。入力が空だった場合は、`satisfy` が失敗するので、その失敗は呼び出し側に伝わります。

## まとめ

- 条件を常に真にすると、どんな値でも読む処理になる。
- 既存の部品に条件を渡すと、新しい機能を少ない行数で書ける。
- 同じ形の関数を作るときは、条件の関数だけを変えればよい。
