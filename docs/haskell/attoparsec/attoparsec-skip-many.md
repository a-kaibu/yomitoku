---
title: "同じパーサを読めるだけ読み、結果は捨てる"
description: "attoparsec の skipMany。パーサを 0 回以上繰り返し、読んだ結果は捨てて、何も返さない形で成功する。空白などを読み飛ばすときに使う。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Copyright (c) Lennart Kolmodin"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Combinator.hs
lines: [219, 221]
function: "skipMany"
difficulty: 2
format: 2
tags: [パース, 関数型, 再帰]
---

## ひとことで

`skipMany p` は、パーサ `p` が成功する限り何度でも読み進め、読んだ結果はすべて捨てる関数です。成功するときの結果は `()` だけになります。空白や区切りを読み飛ばすときに便利です。

## コード

```haskell:line-numbers=219
skipMany :: Alternative f => f a -> f ()
skipMany p = scan
    where scan = (p *> scan) <|> pure ()
```

## 前提知識

- **`()`（ユニット）**: 「値は要らない」ことを表す型です。ここでは「成功したことだけ」を返します。
- **`*>`**: 左を実行して結果を捨て、右の結果を使う演算子です。
- **`<|>`**: 左が失敗したら右を試します。
- **`scan`**: `where` で作った、自分自身を呼び出す補助の処理です。

## 何をしているか

### 1. まず p を読んで、次に scan を続ける

```haskell:line-numbers=221
    where scan = (p *> scan) <|> pure ()
```

`p *> scan` は、`p` を 1 回読み、その後で同じ `scan` を続けます。`p` の結果は `*>` によって捨てられます。成功すれば、同じ処理がまた始まります。

### 2. 読めなくなったら、何もせず成功する

```haskell:line-numbers=221
    where scan = (p *> scan) <|> pure ()
```

`p` が失敗すると、`<|>` の右側 `pure ()` が使われます。これは「何も読まなくても成功」という意味なので、0 回でも全体は成功します。

## ここがすごい

結果を集めるリストを作らないので、メモリを無駄に使いません。読み飛ばすだけなら、リストを作る `many` より軽くなります。

また、再帰の終わりを `pure ()` で表しているので、止める条件を別に書く必要がありません。失敗したところが、そのまま終わりになります。

## まとめ

- 結果が要らないときは、リストを作らずに済ませると軽くなる。
- 「失敗したら成功で止める」形にすると、終わりの条件が自然に書ける。
- `()` を返すことで、成功だけを表せる。
