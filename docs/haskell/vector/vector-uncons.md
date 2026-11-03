---
title: "先頭の 1 件と残りを、安全に取り出す"
description: "vector の uncons。空かどうかを先に調べ、先頭の要素と残りのベクターを Maybe で返す。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov\""
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [462, 462]
function: "uncons"
difficulty: 1
format: 2
tags: [データ構造, 型システム]
---

## ひとことで

`uncons` は、ベクターから「先頭の要素」と「残りのベクター」を組にして取り出す関数です。ベクターが空のときは `Nothing` を返します。

## コード

```haskell:line-numbers=462
uncons xs = flip (,) (unsafeTail xs) <$> xs !? 0
```

## 前提知識

- **`Maybe`**: 値があるときは `Just`、ないときは `Nothing` を返す型です。空かもしれない処理に使います。
- **`!?`**: 添字 `i` の要素を `Maybe` で返す演算子です。添字が範囲外なら `Nothing` になります。
- **`flip (,)`**: 2 つの引数の順番を入れ替えて、組を作る書き方です。
- **`<$>`**: `Maybe` の中の値に関数を当てる演算子です。`Nothing` ならそのまま `Nothing` になります。

## 何をしているか

### 1. 先頭が存在するかを調べる

```haskell:line-numbers=462
uncons xs = flip (,) (unsafeTail xs) <$> xs !? 0
```

`xs !? 0` は、添字 0 の要素が存在するときだけ `Just` を返します。空のベクターなら `Nothing` になり、ここで処理が止まります。

### 2. 先頭と残りを組にする

`flip (,) (unsafeTail xs)` は、先頭の要素 `x` を受け取り、`(x, unsafeTail xs)` の組を作る関数です。`<$>` が `Just x` の中の `x` にこの関数を当てるので、結果は `Just (x, 残り)` になります。

`unsafeTail` は、先頭が存在することが分かっているので、範囲のチェックを省けます。チェックを 1 回にまとめるための書き方です。

## ここがすごい

範囲外の添字を読むと、プログラムが落ちる言語があります。`uncons` は、先に `!?` で存在を確かめ、そのあとだけ速い `unsafeTail` を使っています。安全性と速さを両立しています。

戻り値が `Maybe` なので、呼ぶ側は `Nothing` の場合を書き忘れると、コンパイラに注意されます。

## まとめ

- 先頭と残りを一度に取り出すときは、`uncons` が便利。
- 空かどうかの判定は `Maybe` で表すと、取りこぼしにくい。
- `unsafe` の付いた関数は、直前のチェックとセットで使う。
