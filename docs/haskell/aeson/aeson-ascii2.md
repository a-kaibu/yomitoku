---
title: "2 文字を、そのまま書き出す最小の部品"
description: "aeson の ascii2。2 つの ASCII 文字を、バッファに 2 バイトとして書く BoundedPrim を作る。ほかの ascii3 以上の部品の土台。"
language: haskell
project: "aeson"
repo: https://github.com/haskell/aeson
license: "BSD-3-Clause"
copyright: "Copyright (c) 2011, MailRank, Inc. 2014-2026 Aeson project contributors"
commit: "1dd465c115ccface4cbb5f17f038c5843d4d4ed9"
file: src/Data/Aeson/Encoding/Builder.hs
lines: [156, 157]
function: "ascii2"
difficulty: 3
format: 2
tags: [入出力, 最適化, 型システム]
---

## ひとことで

`ascii2` は、2 つの ASCII 文字の組を受け取り、出力バッファへ 2 バイトとして書き込む部品（`BoundedPrim`）を作る関数です。`'\\'` と `'"'` のような、エスケープの 2 文字を書くために使われます。

前の記事で見た `escapeAscii` が、この部品を組み合わせています。

## コード

```haskell:line-numbers=156
ascii2 :: (Char, Char) -> BP.BoundedPrim a
ascii2 cs = BP.liftFixedToBounded $ const cs BP.>$< BP.char7 >*< BP.char7
```

## 前提知識

- **`BoundedPrim`**: 上限が決まった書き込みの部品です。出力先の残りの容量を確かめながら、値を書き込みます。
- **`liftFixedToBounded`**: 固定長の書き込み（`FixedPrim`）を、上限つきの書き込みに変える関数です。
- **`char7`**: ASCII の 1 文字を書く部品です。
- **`>$<` と `>*<`**: 入力の値を分けて、複数の書き込み部品に渡す演算子です。
- **`const cs`**: 入力を無視して、固定の文字の組 `cs` を返す関数です。

## 何をしているか

### 1. 入力を無視して、固定の 2 文字を使う

```haskell:line-numbers=157
ascii2 cs = BP.liftFixedToBounded $ const cs BP.>$< BP.char7 >*< BP.char7
```

`const cs` は、どんな入力が来ても、固定の組 `cs` を返します。`BP.>$<` でその組を受け取り、`char7 >*< char7` で、1 文字目と 2 文字目をそれぞれ書きます。

そして `liftFixedToBounded` で、固定長の書き込みを、上限つきの部品に変えています。

## ここがすごい

固定の 2 文字を書くためだけに、わざわざ部品を作るのは、一見すると大げさです。しかし、この部品は、文字列を作るための中間の値を一切作りません。出力先へ、直接書き込めます。

また、`ascii3`、`ascii4`、と同じ形で、長さだけを増やした部品が並んでいます。小さな部品を型で積み上げているので、必要な長さを選ぶだけで使えます。

## まとめ

- 固定の文字列を書く部品は、中間の値を作らずに書き込める。
- 小さな部品を、型を使って組み合わせると、読みやすく速い。
- 入力を無視する関数は、固定値を部品に渡す役割として使える。
