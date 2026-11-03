---
title: "足し算のオーバーフローを、負の値で見つける"
description: "非負の整数どうしの足し算で、Int が溢れたかを調べる checkedAdd。溢れると負の値になる性質を利用して、例外を投げる。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "Copyright (c) Don Stewart 2005-2009"
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString/Internal/Type.hs
lines: [1132, 1139]
function: "checkedAdd"
difficulty: 3
format: 2
tags: [防御的プログラミング, 数値計算, 低レイヤ]
---

## ひとことで

`checkedAdd` は、2 つの非負の整数を足し、結果が `Int` の範囲を超えていないかを確かめる関数です。超えていたら、エラーを投げます。

バイト列の大きさを計算するときに、溢れた値を使うと、メモリの確保が壊れてしまいます。そのため、足し算を安全に行う必要があります。

## コード

::: code-group

```haskell:line-numbers=1132 [日本語訳]
checkedAdd :: String -> Int -> Int -> Int
{-# INLINE checkedAdd #-}
checkedAdd fun x y
  -- r < 0 の確認は、mallocPlainForeignPtrBytes の条件と合わせるため。
  -- コンパイラが、後の場所で同じ確認を省けるようにするため。
  | r < 0     = overflowError fun
  | otherwise = r
  where r = assert (min x y >= 0) $ x + y
```

```haskell:line-numbers=1132 [原文]
checkedAdd :: String -> Int -> Int -> Int
{-# INLINE checkedAdd #-}
checkedAdd fun x y
  -- checking "r < 0" here matches the condition in mallocPlainForeignPtrBytes,
  -- helping the compiler see the latter is redundant in some places
  | r < 0     = overflowError fun
  | otherwise = r
  where r = assert (min x y >= 0) $ x + y
```

:::

## 前提知識

- **`Int` の溢れ**: `Int` は固定幅の整数です。最大値を超えると、折り返して負の値になります。
- **`assert`**: 前提を確かめるための関数です。デバッグ時だけ有効になることがあります。
- **`where` の `r`**: 足し算の結果に名前を付けています。
- **ガード**: `r < 0` と `otherwise` で、2 つの場合に分けています。

## 何をしているか

### 1. 足し算をして、結果に名前を付ける

```haskell:line-numbers=1139
  where r = assert (min x y >= 0) $ x + y
```

`assert (min x y >= 0)` は、両方が非負であることを確かめます（デバッグ用）。その上で `x + y` を計算し、`r` に入れます。

### 2. 負になったら溢れた

```haskell:line-numbers=1137
  | r < 0     = overflowError fun
  | otherwise = r
```

`r < 0` なら、非負の数どうしの和が負になったので、溢れています。そのときは `overflowError` でエラーを投げます。そうでなければ、結果の `r` を返します。

具体例で見ます。`Int` の最大値に 1 を足すと、負の最小値に折り返します。この関数は、そうなったときを確実に捕まえます。

## ここがすごい

非負の数どうしの和は、溢れると必ず負になります。この性質を使えば、大きい数どうしを比べなくても、1 回の判定で溢れを見つけられます。

また、コメントにあるように、`r < 0` の判定を、メモリ確保の関数の条件と合わせています。コンパイラが、後ろの確認を重複と判断して省けるように、書き方まで気を配っています。

## まとめ

- 非負の数の和は、溢れると負になる。その性質で判定を 1 回で済ませられる。
- 溢れたときの処理は、エラーとして明示すると安全。
- 後段の処理と判定の書き方を揃えると、コンパイラの最適化も効きやすい。
