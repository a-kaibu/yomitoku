---
title: "文字列の先頭の書記素を一つ取り出し、残りを返す"
description: "string:next_grapheme/1 は、文字列の先頭の書記素クラスタを一つ取り出し、残りの文字列と一緒に返す。Unicode の規則で区切りを決めるので、結合文字や絵文字の並びも、一つとして扱われる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/string.erl
lines: [1122, 1122]
function: "string:next_grapheme/1"
difficulty: 2
format: 2
tags: ["文字列処理", "Unicode", "標準ライブラリ"]
---
## ひとことで

`string:next_grapheme/1` は、文字列の先頭から、見た目の一文字（書記素クラスタ）を一つ取り出します。
戻り値は、その文字と、残りの文字列の組の形です。

## コード

```erlang:line-numbers=1122
next_grapheme(CD) -> unicode_util:gc(CD).
```

## 前提知識

- **書記素クラスタ（grapheme cluster）**: 人が見て一文字と感じる単位です。結合文字や、絵文字の修飾などを含みます。
- **`unicode_util:gc/1`**: 文字列の先頭から、一つの書記素クラスタを取り出す関数です。戻り値は、`[GC | 残り]` の形です。
- **文字列の表し方**: Erlang の文字列は、リストかバイナリで表せます。どちらで渡しても、この関数は同じ処理をします。
- **繰り返し**: 残りの文字列に対して同じ関数を繰り返すと、文字を順に読み進められます。

## 何をしているか

### 1. 本体は、`unicode_util:gc/1` に任せる

```erlang:line-numbers=1122
next_grapheme(CD) -> unicode_util:gc(CD).
```

この関数の本体は、一行だけです。引数 `CD` を、そのまま `unicode_util:gc/1` に渡します。
区切りの判断はすべて `unicode_util` に任されていて、この関数は結果をそのまま返します。

## ここがすごい

### 区切りの規則を、一箇所に任せる

文字の区切りは、Unicode の規則に基づいて決まります。
この関数は、その規則を自分では持ちません。`unicode_util:gc/1` を呼ぶだけなので、規則が更新されても、この関数は変わりません。

### 一文字ずつ読めるので、繰り返しに使える

戻り値の残りの文字列を使えば、同じ関数を繰り返して、全体を読み進められます。
`string:to_graphemes/1` も、この考え方で文字列を分けています。

### 空の文字列の扱いは、戻り値の形で分かる

残りの文字列が空になると、戻り値の形でそれが分かります。
呼び出し側は、空かどうかを確かめて、読むのを止められます。

### 取り出すたびに、残りを作り直す

戻り値の残りの文字列は、元の文字列を先頭から切り落とした形です。
元の文字列を変えるわけではなく、新しい残りを作って返します。Erlang の値が変わらないという性質に、この関数は沿っています。

## まとめ

`string:next_grapheme("ab")` は、先頭の `a` と、残りの `b` を組にした形の値を返します。
結合文字を含む文字列では、見た目の一文字が、一つの単位として取り出されます。
