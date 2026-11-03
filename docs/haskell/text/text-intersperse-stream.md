---
title: "文字と文字のあいだに、同じ文字を差し込む"
description: "text の Stream 版 intersperse。列の文字と文字のあいだに、指定した文字を 1 つずつ入れる。3 つの状態を使い分けて、区切りの位置を管理する。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [460, 471]
function: "intersperse"
difficulty: 3
format: 2
tags: [文字列処理, 関数型, 状態機械]
---

## ひとことで

`intersperse c s` は、文字列の列 `s` の文字と文字のあいだに、区切りの文字 `c` を 1 つずつ入れた列を作る関数です。たとえば `"abc"` に `','` を入れると、`"a,b,c"` になります。

## コード

```haskell:line-numbers=460
intersperse :: Char -> Stream Char -> Stream Char
intersperse c (Stream next0 s0 len) = Stream next (I1 s0) (len + unknownSize)
    where
      next (I1 s) = case next0 s of
        Done       -> Done
        Skip s'    -> Skip (I1 s')
        Yield x s' -> Skip (I2 s' x)
      next (I2 s x)  = Yield x (I3 s)
      next (I3 s) = case next0 s of
        Done       -> Done
        Skip s'    -> Skip    (I3 s')
        Yield x s' -> Yield c (I2 s' x)
```

## 前提知識

- **`Stream`**: 文字を 1 つずつ流しながら扱う列の型です。
- **`I1`、`I2`、`I3`**: 区切りを入れる段階を表す、内部の状態の印です。
- **`Skip`**: 要素がないが、次へ進むことを表す状態です。
- **`intersperse`**: 名前の意味は「あいだに差し込む」です。リストの同名の関数と同じ働きをします。

## 何をしているか

### 1. 最初の文字を読む

```haskell:line-numbers=463
      next (I1 s) = case next0 s of
```

最初の段階 `I1` では、元の列から文字を 1 つ読みます。文字が取れたら、次の段階 `I2` へ移ります。

### 2. 文字を 1 つ返してから、区切りを入れる

```haskell:line-numbers=467
      next (I2 s x)  = Yield x (I3 s)
```

`I2` の段階では、読んだ文字 `x` をそのまま返します。次の段階 `I3` では、区切りを入れる準備ができています。

### 3. 区切りを入れてから、次の文字へ

```haskell:line-numbers=471
        Yield x s' -> Yield c (I2 s' x)
```

`I3` の段階で次の文字が取れたら、まず区切り `c` を返します。そのあと `I2` に戻って、取った文字 `x` を返します。こうして、文字と区切りが交互に並びます。

## ここがすごい

状態を 3 つに分けることで、「区切りを入れるかどうか」を状態だけで管理しています。文字が最後まで来たら、区切りを入れずに終わります。

中間のリストを作らず、列を流しながら区切りを挟むので、長い文字列でも効率よく作れます。

## まとめ

- 区切りを挟む処理は、状態を分けると分かりやすくなる。
- 状態機械の形にすると、途中の段階を正しく管理できる。
- 中間の配列を作らないことで、大きな入力にも強くなる。
