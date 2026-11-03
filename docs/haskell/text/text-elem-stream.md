---
title: "列の中に、指定した文字があるかを調べる"
description: "text の Stream 版 elem。文字を順に調べて、指定した文字が見つかった時点で True を返す。見つからなければ最後まで調べて False を返す。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [1063, 1070]
function: "elem"
difficulty: 2
format: 2
tags: [文字列処理, 探索, 再帰]
---

## ひとことで

`elem w s` は、文字列の列 `s` の中に、文字 `w` が含まれるかを調べる関数です。見つかった時点で `True` を返し、見つからなければ最後まで読んで `False` を返します。

## コード

```haskell:line-numbers=1063
elem :: Char -> Stream Char -> Bool
elem w (Stream next s0 _len) = loop_elem s0
    where
      loop_elem !s = case next s of
                       Done -> False
                       Skip s' -> loop_elem s'
                       Yield x s' | x == w -> True
                                  | otherwise -> loop_elem s'
```

## 前提知識

- **`Stream Char`**: 文字を 1 つずつ流しながら扱う列の型です。
- **`Yield`、`Skip`、`Done`**: 文字がある状態、文字がなく次へ進む状態、終わりの状態を表す印です。
- **`x == w`**: 取り出した文字と探している文字が等しいかを調べる式です。
- **`where` の `loop_elem`**: 列を先頭から進める補助の再帰関数です。

## 何をしているか

### 1. 列の終わりなら False

```haskell:line-numbers=1067
                       Done -> False
```

列を最後まで読んでも見つからなかったら、`False` を返します。

### 2. 空の部分を読み飛ばす

```haskell:line-numbers=1068
                       Skip s' -> loop_elem s'
```

文字がない状態では、そのまま次の状態へ進みます。

### 3. 同じ文字が見つかったら True

```haskell:line-numbers=1069
                       Yield x s' | x == w -> True
```

取り出した文字 `x` が探している文字 `w` と同じなら、すぐに `True` で終わります。残りの列は読みません。

## ここがすごい

見つかった時点で止まるので、文字列の先頭近くに目的の文字があれば、ほとんど全部を読まずに答えが出ます。

また、「文字が取れたかどうか」を状態で表しているので、新しいリストを作らずに調べられます。

## まとめ

- 含まれるかの判定は、見つかった時点で止めると速い。
- 状態を分けて書くと、空の部分を自然に読み飛ばせる。
- 一致しないときの答えを最後に返す、という形で終わりを明確にできる。
