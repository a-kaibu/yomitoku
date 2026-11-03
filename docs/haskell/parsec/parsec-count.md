---
title: "ちょうど n 回だけ同じパーサを読む"
description: "parsec の count。パーサを n 回だけ実行して結果をリストにする。n が 0 以下なら何も読まずに空リストを返す。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Combinator.hs
lines: [176, 176]
function: "count"
difficulty: 1
format: 2
tags: [パース, 関数型, イディオム]
---

## ひとことで

`count n p` は、パーサ `p` をちょうど `n` 回だけ実行し、その結果を順にリストへ入れて返します。`n` が 0 以下のときは、何も読まずに空のリストを返します。

## コード

```haskell:line-numbers=176
count n p           | n <= 0    = return []
```

## 前提知識

- **パーサ**: 入力から値を作る部品です。
- **ガード（`|`）**: 条件に応じて式を選ぶ書き方です。上から順に試されます。
- **`return []`**: 何も読まずに空のリストを結果にするパーサです。
- **`sequence`**: パーサのリストを順に実行し、結果のリストを作る関数です。

## 何をしているか

### 1. 型で、結果がリストになることを示す

```haskell
count :: (Stream s m t) => Int -> ParsecT s u m a -> ParsecT s u m [a]
```

回数 `Int` と、パーサ `p` を受け取ります。結果は `a` のリストです。

### 2. 回数が 0 以下なら空を返す

```haskell:line-numbers=176
count n p           | n <= 0    = return []
```

`n <= 0` のときは何も読まず、`return []` で空のリストを返します。ここで先に分けておくと、次の式が `replicate` で 0 以下の数を渡さずに済みます。

### 3. 残りは sequence で n 回読む

```haskell
                    | otherwise = sequence (replicate n p)
```

`replicate n p` は、`p` を `n` 個並べたリストです。`sequence` がそれを先頭から順に実行し、結果を 1 つのリストにまとめます。

例えば `count 3 digit` は、数字を 3 つ読み、`"123"` なら `"123"` の 3 文字を返します。

## ここがすごい

`replicate` と `sequence` の組み合わせは、`count` を数行で済ませる書き方です。読む回数を、そのままリストの長さとして扱えるので、同じ処理を手で書く必要がありません。

負の回数をガードで先に除くことで、`replicate` の不正な引数を避けています。

## まとめ

- 回数が決まった繰り返しは `count` で表せる。
- `replicate` で同じパーサを並べ、`sequence` で順に実行する。
- 回数が 0 以下の場合は、先にガードで空を返す。
