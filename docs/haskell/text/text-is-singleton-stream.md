---
title: "文字が 1 つだけかどうかを、途中で打ち切って調べる"
description: "text の Stream 版 isSingleton。文字が 2 つ見つかった時点で False を返す。全体を数えずに、1 文字だけかを判定できる。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [416, 424]
function: "isSingleton"
difficulty: 2
format: 2
tags: [文字列処理, 再帰, 最適化]
---

## ひとことで

`isSingleton s` は、文字列の列 `s` がちょうど 1 文字だけでできているかを調べる関数です。2 文字目が見つかった時点で、結果が決まるので、残りを数えずに `False` を返します。

## コード

```haskell:line-numbers=416
isSingleton :: Stream Char -> Bool
isSingleton (Stream next s0 _len) = loop 0 s0
    where
      loop !z s  = case next s of
                     Done            -> z == (1::Int)
                     Skip    s'      -> loop z s'
                     Yield _ s'
                         | z >= 1    -> False
                         | otherwise -> loop (z+1) s'
```

## 前提知識

- **`Stream Char`**: 文字を 1 つずつ流しながら扱う列の型です。
- **`z`**: ここまでに見つけた文字の数です。
- **`Done`、`Skip`、`Yield`**: 列の状態を表す印です。`Yield` は文字がある、`Skip` は文字がないが次へ進む、`Done` は終わりを表します。
- **`(1::Int)`**: 数の型を `Int` に決める書き方です。

## 何をしているか

### 1. 列が終わったときは、数を確かめる

```haskell:line-numbers=420
                     Done            -> z == (1::Int)
```

列が終わったら、数えた個数 `z` が 1 かどうかを返します。

### 2. 2 文字目が来たら、すぐに False

```haskell:line-numbers=423
                         | z >= 1    -> False
```

すでに 1 文字を見つけている状態で、もう 1 文字来たなら、1 文字だけの列ではありません。そこで `False` を返して終わります。

### 3. 1 文字目なら数を増やす

```haskell:line-numbers=424
                         | otherwise -> loop (z+1) s'
```

まだ 1 文字も見つけていなければ、数を 1 増やして次へ進みます。

## ここがすごい

全部数えてから `== 1` と比べる方法と違って、2 文字目が見つかった時点で止まります。長い文字列でも、先頭の 2 文字だけで答えが決まることがあります。

「1 かどうか」だけを知りたいときに、必要な分だけ読むという考え方がよく表れています。

## まとめ

- 判定の答えが途中で決まるなら、そこで止めると無駄が減る。
- 数えるかわりに「もう 1 つ来たか」を見ると、結果を早く出せる。
- 状態に数を持たせると、途中の判断が簡単になる。
