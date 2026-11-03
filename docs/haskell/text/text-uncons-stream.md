---
title: "列の先頭の文字と、残りの列を取り出す"
description: "text の Stream 版 uncons。列の先頭の文字と残りの列を組にして返す。空の列なら Nothing を返す。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [295, 301]
function: "uncons"
difficulty: 2
format: 2
tags: [文字列処理, 関数型, 防御的プログラミング]
---

## ひとことで

`uncons s` は、文字列の列 `s` の先頭の 1 文字と、残りの列を組にして返す関数です。列が空のときは `Nothing` を返します。

## コード

```haskell:line-numbers=295
uncons :: Stream Char -> Maybe (Char, Stream Char)
uncons (Stream next s0 len) = loop_uncons s0
    where
      loop_uncons !s = case next s of
                         Yield x s1 -> Just (x, Stream next s1 (len - codePointsSize 1))
                         Skip s'    -> loop_uncons s'
                         Done       -> Nothing
```

## 前提知識

- **`Maybe`**: 値があれば `Just`、なければ `Nothing` を返す型です。
- **`Yield x s1`**: 文字 `x` が取れて、次の状態が `s1` であることを表します。
- **`codePointsSize`**: 残りの長さを計算するための内部の補助関数です。
- **`Stream next s1 len`**: 次の状態と長さを持つ、列の値の作り方です。

## 何をしているか

### 1. 文字が取れたら、先頭と残りを返す

```haskell:line-numbers=298
      loop_uncons !s = case next s of
                         Yield x s1 -> Just (x, Stream next s1 (len - codePointsSize 1))
```

次の状態が文字 `x` を持っていれば、`x` と、1 つ進めた列 `Stream next s1 ...` の組を `Just` で返します。残りの長さは、取り除いた分だけ減らします。

### 2. 空の部分は読み飛ばす

```haskell:line-numbers=300
                         Skip s'    -> loop_uncons s'
```

`Skip` は文字がない状態なので、そのまま次へ進みます。

### 3. 終わっていたら Nothing

```haskell:line-numbers=301
                         Done       -> Nothing
```

列が終わっていれば、先頭の文字は存在しないので `Nothing` を返します。

## ここがすごい

先頭の文字と残りを、新しいリストを作らずに取り出せます。残りの列は、元の列の続きを指す小さな値として返されるので、コピーのコストがかかりません。

また、空かどうかを `Maybe` で返すので、呼び出す側が空の場合を忘れずに扱えます。

## まとめ

- 先頭と残りを分けて返すと、順番に読む処理が書きやすい。
- 残りを新しい値として返すと、元の列をコピーせずに済む。
- 空の場合を `Maybe` で表すと、扱いを忘れにくい。
