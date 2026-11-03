---
title: "終わりの目印が来るまで、同じパーサを繰り返す"
description: "attoparsec の manyTill。終わりのパーサが成功するまで、本体のパーサを 0 回以上繰り返し、結果をリストで返す。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Copyright (c) Lennart Kolmodin"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Combinator.hs
lines: [191, 193]
function: "manyTill"
difficulty: 2
format: 2
tags: [パース, 関数型, イディオム]
---

## ひとことで

`manyTill p end` は、`end` が成功するまで `p` を 0 回以上繰り返し、`p` の結果を並べたリストを返すパーサです。文の終わりや区切りまで読みたいときに使います。

## コード

```haskell:line-numbers=191
manyTill :: Alternative f => f a -> f b -> f [a]
manyTill p end = scan
    where scan = (end *> pure []) <|> liftA2 (:) p scan
```

## 前提知識

- **パーサ**: 文字列を読み取って、意味のあるデータに変えるプログラムの部品です。
- **`Alternative f`**: 「失敗したら別の候補を試す」ことができる型の制約です。
- **`*>`**: 左の処理を実行して、その結果を捨て、右の結果を使う演算子です。
- **`<|>`**: 左が失敗したら右を試す演算子です。

## 何をしているか

### 1. 終わりかどうかを先に確かめる

```haskell:line-numbers=193
    where scan = (end *> pure []) <|> liftA2 (:) p scan
```

まず `end` を試します。`end` が成功したら、そこで読むのをやめて、空のリストを返します。`end` が失敗したときだけ、右側の `liftA2 (:) p scan` を試します。

### 2. 1 つ読んで、残りを再帰で読む

```haskell:line-numbers=193
    where scan = (end *> pure []) <|> liftA2 (:) p scan
```

右側では、`p` で 1 つ読み、その結果を `(:)` でリストの先頭に付けます。残りは再び `scan` で読みます。つまり「終わりでなければ 1 つ読む」を繰り返します。

## ここがすごい

`end` を先に試すので、終わりの目印を読み飛ばすことがありません。もし `p` を先に試すと、終わりの文字まで `p` が読んでしまうことがあります。順番を入れ替えるだけで、「ここまで読む」という意図がそのまま書けています。

また、`Alternative` の型で書かれているので、`ByteString` でも `Text` でも同じ書き方が使えます。

## まとめ

- 繰り返しを止める条件は、先に確かめると安全に書ける。
- `<|>` と再帰を組み合わせると、リストを読む処理が短く書ける。
- 型の制約を使うと、入力の型が違っても同じ関数を使い回せる。
