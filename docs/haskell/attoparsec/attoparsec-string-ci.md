---
title: "大文字と小文字を区別せずに、文字列を読む"
description: "attoparsec の stringCI。入力と指定した文字列を両方とも小文字にして比べ、大文字小文字を無視して一致を確かめる。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [183, 185]
function: "stringCI"
difficulty: 2
format: 2
tags: [文字列処理, パース, 関数型]
---

## ひとことで

`stringCI s` は、指定した文字列 `s` と同じ並びを、大文字小文字の違いを無視して読むパーサです。`HTTP` と `http` のような、表記ゆれのある入力を読むときに使います。

## コード

```haskell:line-numbers=183
stringCI :: ByteString -> Parser ByteString
stringCI s = string_ (stringSuspended lower) lower s
  where lower = B8.map toLower
```

## 前提知識

- **`ByteString`**: バイト列を効率よく扱うための型です。文字列を 1 文字ずつではなく、まとまりで扱えます。
- **`B8.map`**: バイト列の 1 つ 1 つに関数を当てる関数です。`B8` は、バイトを文字として扱う版の名前です。
- **`toLower`**: 1 バイトを小文字にする関数です。前の記事で見た `toLower` を使っています。
- **`where`**: 関数の中だけで使う名前を、後ろで定義する書き方です。

## 何をしているか

### 1. 比べる対象を小文字にする

```haskell:line-numbers=185
  where lower = B8.map toLower
```

`lower` は、バイト列の全部を小文字に変える関数です。指定された文字列 `s` も、入力も、この変換を通して比べられます。

### 2. 小文字どうしで比べて読む

```haskell:line-numbers=184
stringCI s = string_ (stringSuspended lower) lower s
```

`string_` は、入力に `s` が続いているかを調べる仕組みです。ここでは、`lower` で変換した入力と、`lower` で変換した `s` を比べます。元の入力は変わらず、比べるときだけ小文字にしています。

## ここがすごい

大文字と小文字を両方書いた候補を、いくつも用意する必要がありません。比べる前に 1 つの変換を通すだけで、どんな組み合わせにも対応できます。

また、`lower` を `string_` と `stringSuspended` の両方に渡すことで、入力が途中で切れている場合にも、同じ規則で続きを比べられます。

## まとめ

- 大文字小文字を無視するときは、両方を同じ規則で変換して比べると簡単。
- 変換の関数を引数に渡すと、同じ仕組みを色々な比べ方に使い回せる。
- 短い関数の組み合わせで、読みやすいパーサが書ける。
