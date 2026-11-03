---
title: "候補のパーサを、先頭から順に試す"
description: "attoparsec の choice。パーサのリストを先頭から順に試し、最初に成功したものの結果を返す。すべて失敗したら全体も失敗する。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Copyright (c) Lennart Kolmodin"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Combinator.hs
lines: [78, 79]
function: "choice"
difficulty: 1
format: 2
tags: [パース, 関数型, イディオム]
---

## ひとことで

`choice` は、パーサのリストを受け取り、先頭から順に試して、最初に成功したものの結果を返すパーサです。「どれかに当てはまればよい」という読み方に使えます。

## コード

```haskell:line-numbers=78
choice :: Alternative f => [f a] -> f a
choice = asum
```

## 前提知識

- **`Alternative f`**: 失敗したら別の候補を試せる型の制約です。
- **`asum`**: リストの中の候補を、先頭から `<|>` でつないでくれる関数です。
- **`<|>`**: 左が失敗したら右を試す演算子です。
- **点フリー（引数を書かない）**: `choice = asum` のように、引数を書かずに関数を別の関数に置き換える書き方です。

## 何をしているか

### 1. 候補を `<|>` でつなげる

```haskell:line-numbers=79
choice = asum
```

`[p1, p2, p3]` という候補のリストは、`asum` によって `p1 <|> p2 <|> p3` と同じ形につながれます。左から順に試されるので、先頭に近い候補ほど優先されます。

### 2. 成功したところで止まる

`p1` が成功すれば、`p2` と `p3` は試されません。`p1` が失敗したときに初めて `p2` が試されます。すべて失敗すると、最後の失敗が全体の失敗になります。

## ここがすごい

候補を並べるだけで、「先頭から試す」という仕組みがそのまま手に入ります。`choice` の中身は `asum` 1 つだけで、読み手が迷う部分がありません。

同じ考え方で、キーワードの一覧から 1 つを選ぶ読み方などにも使えます。

## まとめ

- 候補を並べて、先頭から試す形は `asum` で短く書ける。
- 点フリーで書くと、関数の役割が一目で分かる。
- 優先順位は、リストの並び順で決まる。
