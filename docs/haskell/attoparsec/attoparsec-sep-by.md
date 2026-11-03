---
title: "区切りで分けられた要素を、0 個以上まとめて読む"
description: "attoparsec の sepBy。要素を読み、区切りを挟みながら続けて読み、結果のリストを返す。要素が 1 つもない場合も空のリストで成功する。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Copyright (c) Lennart Kolmodin"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Combinator.hs
lines: [137, 138]
function: "sepBy"
difficulty: 2
format: 2
tags: [パース, 関数型, イディオム]
---

## ひとことで

`sepBy p s` は、`p` で要素を読み、その間に `s` で区切りを読みながら、要素の列をリストにして返すパーサです。カンマ区切りの数の並びなどを読むときに使います。

## コード

```haskell:line-numbers=137
sepBy :: Alternative f => f a -> f s -> f [a]
sepBy p s = liftA2 (:) p ((s *> sepBy1 p s) <|> pure []) <|> pure []
```

## 前提知識

- **`liftA2`**: 2 つの処理の結果を、関数に渡してまとめる関数です。ここでは「先頭の要素」と「残りのリスト」を `(:)` でつなげています。
- **`*>`**: 左の区切りを読んで捨て、右の結果を使う演算子です。
- **`pure []`**: 何も読まずに、空のリストで成功する処理です。
- **`<|>`**: 失敗したときに、右の候補を試す演算子です。

## 何をしているか

### 1. 最初の要素を読む

```haskell:line-numbers=138
sepBy p s = liftA2 (:) p ((s *> sepBy1 p s) <|> pure []) <|> pure []
```

まず `p` で 1 つ目の要素を読もうとします。成功したら、その後ろに「区切りと次の要素」が続くかを調べます。

### 2. 区切りがあれば続け、なければ終わる

```haskell:line-numbers=138
sepBy p s = liftA2 (:) p ((s *> sepBy1 p s) <|> pure []) <|> pure []
```

`s *> sepBy1 p s` は、区切りを読んでから、残りの要素を 1 つ以上読みます。区切りがなければ `pure []` で、残りは空になります。外側の `<|> pure []` は、最初の要素すら無い場合に、空のリストで成功させる役割を持ちます。

## ここがすごい

区切りを先に読んでから要素を読むので、「最後にカンマが余る」といった形のずれが起きにくくなっています。区切りは `*>` で捨てるので、結果のリストには要素だけが並びます。

また、要素が 0 個でも成功するように `pure []` を用意しているので、空の入力を特別扱いしなくても済みます。

## まとめ

- 区切り付きの列は、「要素」と「区切りの後の残り」に分けると書きやすい。
- `*>` で区切りを捨てると、結果をきれいなリストにできる。
- 0 個の場合を `pure []` で表すと、例外的な処理が要らない。
