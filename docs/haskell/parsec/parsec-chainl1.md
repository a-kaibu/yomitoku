---
title: "左から結合する演算子の列を、畳み込みながら読む「chainl1」"
description: "Parsec の chainl1。値と二項演算子が交互に並ぶ式を、左結合で読む。1 つ読むごとに、そこまでの結果と次の値を演算する。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [217, 223]
function: "chainl1"
difficulty: 3
format: 2
tags: [パース, アルゴリズム, 関数型]
---

## ひとことで

`chainl1 p op` は、値 `p` と演算子 `op` が交互に並ぶ式を読み、左から順に演算して 1 つの値にします。たとえば `1 - 2 - 3` は `((1 - 2) - 3)` として計算されます。

結合の向きを決めるための、式の解析の定番の部品です。

## コード

```haskell:line-numbers=217
chainl1 p op        = do{ x <- p; rest x }
                    where
                      rest x    = do{ f <- op
                                    ; y <- p
                                    ; rest (f x y)
                                    }
                                <|> return x
```

## 前提知識

- **左結合**: 演算子が、左から順に適用される結び方です。`a - b - c` は `(a - b) - c` です。
- **演算子のパーサー `op`**: 結果が `a -> a -> a` の関数になるパーサーです。読んだ演算子に対応する計算を返します。
- **`rest x`**: これまでの結果 `x` を受け取り、続きを読む補助の関数です。
- **`<|> return x`**: 続きがなければ、今の結果 `x` で終わります。

## 何をしているか

### 1. 最初の値を読み、rest に渡す

```haskell:line-numbers=217
chainl1 p op        = do{ x <- p; rest x }
```

まず値 `x` を 1 つ読みます。その値を、続きを読む `rest` に渡します。

### 2. 演算子と次の値を読み、畳み込む

```haskell:line-numbers=219
                      rest x    = do{ f <- op
                                    ; y <- p
                                    ; rest (f x y)
                                    }
```

演算子 `f` を読み、次の値 `y` を読みます。そして、今の結果 `x` と `y` を `f` で計算し、その結果を新しい `x` として、`rest` で続きを読みます。

### 3. 続きがなければ終わり

```haskell:line-numbers=223
                                <|> return x
```

演算子が読めなかったら、そこまでの結果 `x` を返して終わります。

具体例で見ます。`1 - 2 - 3` は、最初に `1`、次に `- 2` で `(1-2)`、次に `- 3` で `((1-2)-3)` と計算されます。

## ここがすごい

式全体の木を作らず、読みながら計算を進めています。途中の結果を `rest` の引数として持ち歩くので、長い式でも、ほぼ一定の仕組みで読めます。

また、左結合は、この再帰の形が決めています。`rest (f x y)` の形にするだけで、結合の向きを正しく表せます。結合の規則を、コードの形そのもので表した例です。

## まとめ

- 演算子の結合の向きは、畳み込みの形（左か右か）で決まる。
- 読みながら計算すると、式の木を作らずに済む。
- 続きがないときの `<|> return x` が、式の終わりを表す。
