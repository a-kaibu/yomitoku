---
title: "次に来たものを、中身を見ずに 1 つ読む"
description: "parsec の anyToken。入力の次のトークンを何でも 1 つ読んで返す。読むものを選ばない、いちばん単純な部品。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [250, 250]
function: "anyToken"
difficulty: 1
format: 2
tags: [パース, 入出力, 関数型]
---

## ひとことで

`anyToken` は、入力の次にあるトークン（1 文字や 1 要素）を、どんなものでも 1 つ読んで返すパーサです。入力が終わっていれば失敗します。

## コード

```haskell:line-numbers=250
anyToken            = tokenPrim show (\pos _tok _toks -> pos) Just
```

## 前提知識

- **トークン**: 入力を分けた最小の単位です。文字列なら 1 文字が多いです。
- **`show`**: 値を文字列に変換する関数です。エラーメッセージに使います。
- **ラムダ（`\ 引数 -> 式`）**: その場で作る無名の関数です。
- **`Just`**: 読めたトークンを成功として返すための包みです。

## 何をしているか

### 1. 型で、何でも読めることを示す

```haskell
anyToken :: (Stream s m t, Show t) => ParsecT s u m t
```

`Show t` の制約は、読んだものをエラー表示に使うためです。戻り値は読んだトークン `t` です。

### 2. tokenPrim に、表示と進め方を渡す

```haskell:line-numbers=250
anyToken            = tokenPrim show (\pos _tok _toks -> pos) Just
```

`tokenPrim` は、トークンごとの振る舞いを 3 つの関数で受け取ります。`show` は失敗時の表示です。`\pos _tok _toks -> pos` は、位置を変えずに次の位置を決める関数です。`Just` は、どのトークンでも成功とみなします。

例えば `'a'` の入力に `anyToken` を使うと、`'a'` を返して読み進みます。

## ここがすごい

「何でも読む」は、条件を一切見ない 1 つの部品です。ほかのパーサと組み合わせれば、「数字だけ」や「改行まで」といった読み方を、条件を足して作れます。

位置の更新を `pos` のまま返すなど、必要な振る舞いを関数の引数だけで指定しています。

## まとめ

- 何でも 1 つ読むパーサは、ほかの読み方を組み立てる土台になる。
- `tokenPrim` に表示・判定・位置の決め方を渡して作る。
- `Show` の制約があるので、失敗時にどのトークンか表示できる。
