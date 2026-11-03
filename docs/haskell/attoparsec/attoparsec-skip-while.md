---
title: "条件に合う間だけ読み飛ばし、結果は捨てる"
description: "attoparsec の skipWhile。条件に合うバイトが続く限り読み進め、読んだ内容は捨てる。空白や区切り文字を飛ばすときに使う。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [229, 235]
function: "skipWhile"
difficulty: 2
format: 2
tags: [パース, 最適化, 関数型]
---

## ひとことで

`skipWhile p` は、条件 `p` に合うバイトが続く間、入力を読み進める処理です。読んだ内容は結果として返さず、捨ててしまいます。

## コード

```haskell:line-numbers=229
skipWhile :: (Word8 -> Bool) -> Parser ()
skipWhile p = go
 where
  go = do
    t <- B8.takeWhile p <$> get
    continue <- inputSpansChunks (B.length t)
    when continue go
```

## 前提知識

- **`Parser ()`**: 結果として何も意味のある値を返さないパーサです。読み進めることだけが目的です。
- **`get`**: 今の入力の残りを取り出す処理です。読み位置は動きません。
- **`when`**: 条件が真のときだけ処理を行う関数です。
- **再帰（`go`）**: 同じ処理を、続く限り繰り返すための書き方です。

## 何をしているか

### 1. 条件に合う部分をまとめて取る

```haskell:line-numbers=233
    t <- B8.takeWhile p <$> get
```

今の入力から、条件に合うバイトが続く部分 `t` を取り出します。1 バイトずつ確かめるより、まとめて取るほうが速いです。

### 2. かたまりをまたいで続くか確かめる

```haskell:line-numbers=234
    continue <- inputSpansChunks (B.length t)
```

取り出した長さの分だけ読み進めた結果、まだ入力のかたまりが続いているかを調べます。続きがあるなら `continue` は真になります。

### 3. 続くならもう一度

```haskell:line-numbers=235
    when continue go
```

続きがあれば、同じ `go` をもう一度実行します。条件に合わないバイトが出てきたところで、繰り返しは止まります。

## ここがすごい

結果のリストを作らないので、メモリをほとんど使いません。読み飛ばすだけの用途では、結果を集める `many` よりも軽くなります。

また、かたまりごとに区切って読むので、長い入力でも効率よく進みます。

## まとめ

- 読み飛ばすだけなら、結果を集めない関数を使うと軽くなる。
- 一括で取ってから位置を進めると、1 バイトずつより速い。
- 入力が分かれていても、続きを確かめる処理を入れると正しく動く。
