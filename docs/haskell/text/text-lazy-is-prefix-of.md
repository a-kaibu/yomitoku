---
title: "遅延テキストの先頭が、指定の文字列と一致するか確かめる"
description: "text の遅延版 Text（Lazy）で、塊に分かれた入力の先頭が指定の文字列か調べる isPrefixOf。塊をまたぐ比較を、塊の長さで分けて扱う。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) 2009, 2010 Bryan O'Sullivan"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Lazy/Search.hs
lines: [121, 125]
function: "isPrefixOf"
difficulty: 2
format: 2
tags: [文字列処理, 遅延評価, 再帰]
---

## ひとことで

`isPrefixOf x t` は、文字列 `x` が、遅延テキスト `t` の先頭に来ているかを調べる関数です。遅延テキストは細かい塊（チャンク）の列なので、塊をまたいでも正しく比べます。

## コード

```haskell:line-numbers=121
isPrefixOf :: T.Text -> Text -> Bool
isPrefixOf (T.Text _ _ xlen) Empty = xlen == 0
isPrefixOf x@(T.Text xarr xoff xlen) (Chunk y@(T.Text _ _ ylen) ys)
  | xlen <= ylen = x `T.isPrefixOf` y
  | otherwise = y `T.isPrefixOf` x && T.Text xarr (xoff + ylen) (xlen - ylen) `isPrefixOf` ys
```

## 前提知識

- **遅延テキスト（`Text` の Lazy 版）**: 文字列を、小さな塊（チャンク）の連なりとして持つ型です。`Empty` は終わりを、`Chunk` は塊と残りを表します。
- **`T.Text`**: 1 つの塊の本体です。配列、開始位置、長さの 3 つの情報を持ちます。
- **`x@(...)`**: パターン全体にも名前を付ける書き方です。
- **`` `isPrefixOf` ``**: 関数を中置（間に書く）で使う書き方です。

## 何をしているか

### 1. 入力が空のとき

```haskell:line-numbers=122
isPrefixOf (T.Text _ _ xlen) Empty = xlen == 0
```

遅延テキストが空なら、比べる文字列 `x` も空のときだけ一致します。

### 2. 指定の文字列の方が短いとき

```haskell:line-numbers=124
  | xlen <= ylen = x `T.isPrefixOf` y
```

`x` の長さが、最初の塊 `y` 以下なら、塊の中だけで比べられます。普通の `T.isPrefixOf` を使えば済みます。

### 3. 塊をまたぐとき

```haskell:line-numbers=125
  | otherwise = y `T.isPrefixOf` x && T.Text xarr (xoff + ylen) (xlen - ylen) `isPrefixOf` ys
```

`x` が塊より長いときは、まず塊 `y` が `x` の先頭に一致するかを確かめます。一致したら、`x` の残りを、残りの塊 `ys` に対して再び `isPrefixOf` で比べます。

## ここがすごい

塊がどこで区切られているかを、呼び出す側は気にしなくてよいように作られています。1 つの文字列が 2 つの塊にまたがっても、正しく比べられます。

また、比べる長さを毎回減らしながら再帰するので、無駄な比較を繰り返しません。

## まとめ

- 塊に分かれたデータは、塊ごとに比べ、残りを再帰で続けると分かりやすい。
- 短い方が塊に収まるかどうかで、処理を分けると効率がよい。
- 再帰で残りの長さを減らすと、終わりが必ず来ることが読み取れる。
