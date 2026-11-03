---
title: "開き記号と閉じ記号に挟まれた部分を読む「between」"
description: "Parsec の between。開き記号、中身、閉じ記号の 3 つを順に読み、中身の結果だけを返す。括弧や引用符の解析に使う。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [94, 95]
function: "between"
difficulty: 1
format: 2
tags: [パース, イディオム, 関数型]
---

## ひとことで

`between open close p` は、`open`、`p`、`close` の 3 つのパーサーを順に実行し、真ん中の `p` の結果だけを返します。開き記号と閉じ記号は、結果に含めません。

たとえば `between (char '(') (char ')') p` は、括弧に挟まれた `p` の値だけを取り出します。

## コード

```haskell:line-numbers=94
between open close p
                    = do{ _ <- open; x <- p; _ <- close; return x }
```

## 前提知識

- **`do` 記法**: パーサーを上から順に実行する書き方です。`_ <- open` は、結果を捨てて次へ進みます。
- **`_`**: 結果を使わないことを示す名前です。
- **`return x`**: 最後に、取り出した値 `x` を結果として返します。
- **型変数 `open` と `close`**: 開き記号と閉じ記号の結果の型です。結果を使わないので、型は何でもかまいません。

## 何をしているか

```haskell:line-numbers=95
                    = do{ _ <- open; x <- p; _ <- close; return x }
```

### 1. 開き記号を読んで捨てる

`_ <- open` は、開き記号を読み、その結果を捨てます。

### 2. 中身を読んで取っておく

`x <- p` で中身を読み、結果を `x` に入れます。

### 3. 閉じ記号を読んで捨て、中身を返す

`_ <- close` で閉じ記号を読んで捨て、最後に `return x` で中身の値だけを返します。

## ここがすごい

記号の部分と中身を、1 つの式で分けて書けます。読み手は、「何が囲んでいるか」を `between` の引数で一目で分かります。

また、この関数は 3 つのパーサーの組み合わせなので、どれかが失敗すると全体が失敗します。途中で読み飛ばすことはなく、括弧の閉じ忘れなどが正しくエラーになります。

## まとめ

- 囲まれた部分を読むときは、開きと閉じを別の引数にすると分かりやすい。
- 結果を捨てる部分と取っておく部分を分けると、必要な値だけを返せる。
- 小さな組み合わせは、名前を付けて再利用すると読みやすい。
