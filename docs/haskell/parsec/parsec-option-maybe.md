---
title: "失敗しても止まらず、Maybe で結果を受け取る"
description: "parsec の optionMaybe。パーサが失敗したら Nothing、成功したら Just を返す。失敗を例外ではなく値として扱える、短い 1 行の定義。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [76, 76]
function: "optionMaybe"
difficulty: 1
format: 2
tags: [パース, 関数型, イディオム]
---

## ひとことで

`optionMaybe p` は、パーサ `p` を 1 回試します。成功すれば `Just` で結果を返し、失敗しても入力を消費していなければ `Nothing` を返して、そのまま先に進みます。

## コード

```haskell:line-numbers=76
optionMaybe p       = option Nothing (liftM Just p)
```

## 前提知識

- **パーサ**: 文字列などを読み、意味のある値を作る部品です。
- **`Maybe`**: `Just 値` か `Nothing` のどちらかを持つ型です。
- **`option`**: 失敗したときに既定値を返すパーサです。`optionMaybe` はこれを使って定義されています。
- **`liftM Just`**: 値を `Just` で包むための関数です。

## 何をしているか

### 1. 型で、結果が Maybe になることを示す

```haskell
optionMaybe :: (Stream s m t) => ParsecT s u m a -> ParsecT s u m (Maybe a)
```

戻り値のパーサは `Maybe a` を返します。失敗が値として表れるので、呼び出す側は `Nothing` の場合を必ず扱います。

### 2. 既定値を Nothing にして option を使う

```haskell:line-numbers=76
optionMaybe p       = option Nothing (liftM Just p)
```

`option Nothing` は、`p` が失敗したときに `Nothing` を返すという意味です。成功したときは `liftM Just p` が結果を `Just` で包みます。

例えば、符号 `-` が任意で付く数字を読むとき、`-` があれば `Just '-'`、なければ `Nothing` になります。

## ここがすごい

失敗を値にすれば、「あってもなくてもよい部品」を書くのに、わざわざ例外や特別な分岐を用意しなくて済みます。

1 行で書けるのは、`option` の上に薄く被せただけだからです。部品を組み合わせて作る parsec らしい書き方です。

## まとめ

- 「あってもなくてもよい」部品は `optionMaybe` で表せる。
- 失敗は `Nothing` という値になり、型で扱いが強制される。
- 既存のパーサの上に薄く被せるのが、parsec の作りの基本。
