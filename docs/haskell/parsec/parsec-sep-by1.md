---
title: "区切りで分けられた値を、先頭から順に読む「sepBy1」"
description: "Parsec の sepBy1。最初の値を読み、残りを「区切り のあとに値」の繰り返しで読む。読んだ値をリストにまとめる。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [123, 126]
function: "sepBy1"
difficulty: 2
format: 2
tags: [パース, イディオム, 関数型]
---

## ひとことで

`sepBy1 p sep` は、1 個以上の値を、区切り `sep` で並べた列として読みます。最初の値 `x` を読んだあと、「区切り、値」の組を 0 回以上繰り返して、残りを読みます。

前の記事の `sepBy` は、この関数に「1 個もない場合」の選択肢を加えたものです。

## コード

```haskell:line-numbers=123
sepBy1 p sep        = do{ x <- p
                        ; xs <- many (sep >> p)
                        ; return (x:xs)
                        }
```

## 前提知識

- **`do` 記法**: パーサーを順に実行し、結果を名前に入れて使う書き方です。
- **`many`**: パーサーを 0 回以上繰り返し、結果をリストにする関数です。前の記事の `many` を使っています。
- **`sep >> p`**: 区切りを読んで捨て、そのあとに `p` を読む組です。
- **`x:xs`**: 先頭の値 `x` と残りのリスト `xs` をつなぐ式です。

## 何をしているか

### 1. 先頭の値を読む

```haskell:line-numbers=123
sepBy1 p sep        = do{ x <- p
```

`x <- p` で、最初の値を読みます。ここで失敗すれば、この関数全体が失敗します。

### 2. 区切りと値の組を繰り返す

```haskell:line-numbers=124
                        ; xs <- many (sep >> p)
```

`many (sep >> p)` は、「区切り、値」の組を 0 回以上読みます。区切りの記号は、結果に含まれません。

### 3. 全部をリストにする

```haskell:line-numbers=125
                        ; return (x:xs)
                        }
```

先頭の `x` と、後ろの `xs` を `x:xs` でつなぎ、結果として返します。

## ここがすごい

「区切りの前に値がある」という形を、`sep >> p` の組として表しています。区切りを読むのは、必ず値の前なので、末尾に区切りが残る誤りを防げます。

また、`many` を使うことで、繰り返しの仕組みを再利用しています。区切りつきの並びを、特別な再帰を書かずに表せるのは、部品の組み合わせのおかげです。

## まとめ

- 区切りつきの並びは、「先頭の値」と「区切りと値の繰り返し」に分けると書ける。
- 区切りは値の前に置くと、末尾の区切りの誤りを防げる。
- 繰り返しの仕組みを部品にしておくと、別の並びの解析でも使える。
