---
title: "読み進めずに、先の文字だけをのぞき見する"
description: "attoparsec の lookAhead。パーサを実行して結果を得るが、入力の読み位置は元に戻す。次に何が来るかを確かめてから、続きを決めるときに使う。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Copyright (c) Lennart Kolmodin"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Combinator.hs
lines: [252, 255]
function: "lookAhead"
difficulty: 2
format: 2
tags: [パース, 関数型, 防御的プログラミング]
---

## ひとことで

`lookAhead p` は、パーサ `p` を実行して結果を返しますが、入力の読み位置は動かしません。つまり、先の文字を「のぞき見」してから、同じ場所から次の読み取りを続けられます。

## コード

```haskell:line-numbers=252
lookAhead :: Parser i a -> Parser i a
lookAhead p = Parser $ \t pos more lose succ ->
  let succ' t' _pos' more' = succ t' pos more'
  in runParser p t pos more lose succ'
```

## 前提知識

- **`Parser i a`**: 入力 `i` を読み、型 `a` の値を作るパーサの型です。
- **読み位置（pos）**: 入力のどこまで読んだかを表す位置です。
- **継続（`succ` と `lose`）**: 成功したときと失敗したときに、次に何をするかを渡す仕組みです。
- **`runParser`**: パーサを、与えられた入力と継続で実行する関数です。

## 何をしているか

### 1. 成功したときの継続を置き換える

```haskell:line-numbers=253
lookAhead p = Parser $ \t pos more lose succ ->
  let succ' t' _pos' more' = succ t' pos more'
```

`succ'` は、`p` が成功したときに呼ばれる新しい継続です。ここで、`p` が読んだ後の位置 `_pos'` を捨てて、元の `pos` を使っています。これにより、読み位置が最初に戻ります。

### 2. 元の入力で p を実行する

```haskell:line-numbers=255
  in runParser p t pos more lose succ'
```

`p` は元の位置 `pos` から実行されます。成功すれば、先ほどの `succ'` が呼ばれ、結果は受け取れますが、読み位置は進んでいません。

## ここがすごい

読み位置を戻すために、入力をコピーしたり、巻き戻したりする仕組みは使っていません。継続の 1 つを差し替えるだけで、「読んだけど進まない」が実現されています。

このおかげで、`lookAhead` は一時的な確認にとても安く使えます。ただし、失敗したときの扱いは元のパーサと同じなので、確認に使うときは成功する条件を意識しておくと安全です。

## まとめ

- 読み位置を戻すには、継続を差し替える方法がある。
- 「先を見るだけ」の処理は、入力を進めずに結果だけ受け取れる。
- 小さな仕組みを組み替えると、新しい動きを少ないコードで作れる。
