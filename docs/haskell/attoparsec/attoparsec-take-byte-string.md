---
title: "残りの入力をすべて、1 つのバイト列として読む"
description: "attoparsec の takeByteString。入力の残りをすべて読み取り、分かれていたかたまりを 1 つにまとめて返す。入力がどこまで続くかを待つので、終わりの処理に使う。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [335, 336]
function: "takeByteString"
difficulty: 2
format: 2
tags: [パース, 文字列処理, 入出力]
---

## ひとことで

`takeByteString` は、入力の残りすべてを 1 つのバイト列として読み取るパーサです。入力が複数のかたまりに分かれていても、まとめて 1 つの `ByteString` にします。

## コード

```haskell:line-numbers=335
takeByteString :: Parser ByteString
takeByteString = B.concat `fmap` takeRest
```

## 前提知識

- **`ByteString`**: バイト列を効率よく扱う型です。
- **`takeRest`**: 残りの入力を、かたまりのリストとして読む関数です。
- **`B.concat`**: バイト列のリストを、1 つのバイト列につなげる関数です。
- **`fmap`**: パーサの結果に関数を当てる関数です。

## 何をしているか

### 1. 残りを、かたまりのリストで読む

`takeRest` は、残りの入力を、分かれたままのかたまりの一覧として読みます。ここでは、かたまりの数を気にせず読めます。

### 2. かたまりを 1 つにまとめる

```haskell:line-numbers=336
takeByteString = B.concat `fmap` takeRest
```

`fmap` によって、読んだかたまりの一覧に `B.concat` を当てます。すると、すべてのかたまりがつながった 1 つの `ByteString` になります。

## ここがすごい

かたまりを分けたまま読み、最後に 1 回だけつなぎます。途中で何度もつなぎ直す必要がないので、効率よく 1 つにまとめられます。

また、`takeRest` を使い回しているので、読み方を変えるたびに新しい仕組みを書く必要がありません。

## まとめ

- 分かれた入力は、読み終わってから 1 回だけつなぐと速い。
- 既存の読み取りを、`fmap` で結果だけ変えて再利用できる。
- 残りをすべて読む処理は、入力の終わりを扱うときに役立つ。
