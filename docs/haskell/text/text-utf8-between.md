---
title: "範囲の判定を 1 行にまとめる「between」"
description: "バイトが下限と上限の間にあるかを調べる小さな関数 between。UTF-8 の検査では、この判定が何度も組み合わされる。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) 2008, 2009 Tom Harper, (c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Encoding/Utf8.hs
lines: [63, 67]
function: "between"
difficulty: 1
format: 2
tags: [Unicode, 防御的プログラミング, 最適化]
---

## ひとことで

`between` は、1 バイトの値 `x` が、下限 `y` 以上かつ上限 `z` 以下かを調べる関数です。たとえば `between 0x41 0x41 0x5A` は、`'A'` が大文字の範囲に入るかを判定して `True` を返します。

小さな関数ですが、UTF-8 の正しさを確かめる処理の中で何度も使われます。判定の書き方を 1 か所にまとめておくと、読む人も直す人も迷いません。

## コード

::: code-group

```haskell:line-numbers=63 [日本語訳]
between :: Word8                -- ^ 調べるバイト
        -> Word8                -- ^ 下限
        -> Word8                -- ^ 上限
        -> Bool
between x y z = x >= y && x <= z
```

```haskell:line-numbers=63 [原文]
between :: Word8                -- ^ byte to check
        -> Word8                -- ^ lower bound
        -> Word8                -- ^ upper bound
        -> Bool
between x y z = x >= y && x <= z
```

:::

## 前提知識

- **`Word8` の比較**: 1 バイトの整数同士は、`>=` や `<=` で大小を比べられます。
- **`&&`（かつ）**: 両方が真のときだけ真になる演算子です。
- **ハスケルの型注釈 `::`**: 関数の引数と戻り値の型を書いたものです。`Word8 -> Word8 -> Word8 -> Bool` は「3 つの `Word8` を受け取って、`Bool` を返す」という意味です。
- **`INLINE` の指示**: コンパイラに、呼び出し先へ直接展開してよいと伝える指示です。小さな関数を速くします。

## 何をしているか

### 1. 下限と上限の両方を満たすかを判定する

```haskell:line-numbers=67
between x y z = x >= y && x <= z
```

`x >= y && x <= z` は、`x` が閉区間 `[y, z]` に入っているかを判定します。両方が真なら `True` です。

### 2. 型注釈のコメント

型の行には、`-- ^` で始まるコメントが付いています。これは Haddock（Haskell のドキュメント生成ツール）用の書き方で、引数の意味を説明しています。コードの動きには影響しません。

## ここがすごい

範囲の判定は、どんな言語でも似たものを書きます。この関数の良さは、名前が `between`（間にある）と書かれていて、読めば意味が分かることです。`x >= y && x <= z` と毎回書くより、呼び出し側が「範囲にあるか」を一目で読めます。

また、`INLINE` の指定で、呼び出し先にそのまま展開されるので、関数呼び出しの手間がなくなります。小さくてよく使う関数では、この指定が効きます。

UTF-8 の検査では、`validate2` や `validate3` の中で、この関数を組み合わせて使っています。部品を小さく分けると、組み合わせで複雑な規則も書けます。

## まとめ

- 範囲の判定は、名前を付けた関数にすると読みやすい。
- 小さな関数は、`INLINE` の指定で速くできる。
- 大きな検査は、小さな判定を組み合わせて作る。
