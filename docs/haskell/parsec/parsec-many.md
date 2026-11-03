---
title: "0 回以上の繰り返しを、溜めてから逆順にする「many」"
description: "Parsec の many。パーサーを 0 回以上繰り返し、結果をリストにまとめる。内部では先頭に付けて溜め、最後に逆順にする。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Prim.hs
lines: [712, 715]
function: "many"
difficulty: 2
format: 2
tags: [パース, 関数型, 再帰]
---

## ひとことで

`many` は、パーサー `p` を、成功する限り繰り返します。結果は、得られた値の並んだリストです。0 回でも成功します。

たとえば、数字を続けて読む `many digit` は、「1 2 3」の 3 つの文字を、リストで返します。

## コード

```haskell:line-numbers=712
many :: ParsecT s u m a -> ParsecT s u m [a]
many p
  = do xs <- manyAccum (:) p
       return (reverse xs)
```

## 前提知識

- **0 回以上の繰り返し**: 1 回も成功しなくても、空のリストで成功する規則です。
- **`do` 記法**: パーサーの結果を、上から順に取り出して使う書き方です。`xs <- ...` で結果を受け取ります。
- **`manyAccum`**: 1 回成功するたびに、結果を関数で蓄積していく内部の関数です。
- **`reverse`**: リストの順番を逆にする関数です。

## 何をしているか

### 1. 結果を先頭に付けながら溜める

```haskell:line-numbers=714
  = do xs <- manyAccum (:) p
```

`manyAccum (:) p` は、パーサー `p` を繰り返し、得られた値を `(:)` で先頭に付けていきます。こうして、結果のリストは逆順で溜まります。

### 2. 逆順を正す

```haskell:line-numbers=715
       return (reverse xs)
```

最後に `reverse xs` で、順番を元に戻して返します。

具体例で見ます。`p` が `'a'`、`'b'`、`'c'` を順に読むなら、溜めた結果は `"cba"` の逆順になり、`reverse` で `"abc"` に戻ります。

## ここがすごい

先頭に付けて溜めるのは、リストの先頭への追加が速いからです。末尾へ付けると、毎回リスト全体をたどる必要があります。逆順を最後に 1 回直すだけなので、全体の計算量が抑えられます。

また、この関数は、`manyAccum` という一般の蓄積の仕組みを使っています。同じ仕組みを、`skipMany` のような別の繰り返しでも使えるように作られています。

## まとめ

- リストを溜めるときは、先頭に付けて最後に反転すると速い。
- 0 回以上の繰り返しは、空の結果で成功すると定義する。
- 繰り返しの仕組みを 1 つにまとめると、関連する関数で使い回せる。
