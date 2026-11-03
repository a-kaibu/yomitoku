---
title: "文字の集合に含まれるバイトかどうかを判定する"
description: "attoparsec の inClass。'a-n' のような範囲付きの文字の集合を、1 度だけビットマップにして、そのあとは高速に判定する。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [435, 437]
function: "inClass"
difficulty: 3
format: 2
tags: [パース, ビット演算, 最適化]
---

## ひとことで

`inClass` は、`"aeiou"` のような文字の集合を受け取り、あるバイトがその集合に含まれるかを判定する関数です。`"a-n"` のような範囲の書き方もできます。

## コード

```haskell:line-numbers=435
inClass :: String -> Word8 -> Bool
inClass s = (`memberWord8` mySet)
    where mySet = charClass s
```

## 前提知識

- **`String -> Word8 -> Bool`**: 文字列を受け取って、「バイトを受け取り真偽値を返す関数」を返す形です。`inClass "aeiou"` の時点で、判定の関数ができあがります。
- **集合（クラス）**: 「この文字は含む、この文字は含まない」を決めた一覧です。
- **`NOINLINE`**: コンパイラに、この値を関数の中へ展開させないように伝える指示です。
- **セクション `(`memberWord8` mySet)`**: 関数の 2 番目の引数だけを先に渡した、部分適用の書き方です。

## 何をしているか

### 1. 集合を一度だけ作る

```haskell:line-numbers=437
    where mySet = charClass s
```

`charClass s` は、文字列 `s` を読んで、含まれる文字を表すビットマップを作ります。ビットマップとは、256 個の値それぞれについて「含むかどうか」を 1 ビットずつ記録したものです。

### 2. 判定を作って返す

```haskell:line-numbers=436
inClass s = (`memberWord8` mySet)
```

`memberWord8` は、ビットマップを使って、バイトが含まれるかを調べる関数です。`inClass s` は、このバイトの判定を返します。

### 3. 作った集合を使い回す


`mySet` を毎回作り直さないように、`NOINLINE` で指示しています（コードの最後の行にあたる指示です）。こうすると、同じパーサを何度呼び出しても、集合は最初の 1 回だけ作られます。

## ここがすごい

判定のたびに文字列を調べると、長い集合では時間がかかります。この関数は、集合を 1 度だけビット列に変えておき、あとは 1 回のビット演算で判定します。

また、`inClass` の引数の書き方によって、「集合を作る」という仕事と、「判定する」という仕事を分けています。これにより、判定の関数を何度も使っても、無駄がありません。

## まとめ

- 変わらない条件は、先に一度だけ準備しておくと速い。
- 集合の判定は、ビットマップにすると 1 回の計算で済む。
- `NOINLINE` は、共有したい値を守るための道具になる。
