---
title: "条件に合う文字を、1 つ以上まとめて読み取る"
description: "attoparsec の takeWhile1。条件に合うバイトを先頭から読み、1 つも無ければ失敗する。入力が途中で切れても続きを待ってから読む。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [410, 422]
function: "takeWhile1"
difficulty: 2
format: 2
tags: [パース, 入出力, 関数型]
---

## ひとことで

`takeWhile1 p` は、条件 `p` に合うバイトが続く限り読み取り、そのまとまりを返すパーサです。最初の 1 バイトから条件に合わない場合は、0 個しか読めないので失敗します。

## コード

```haskell:line-numbers=410
takeWhile1 :: (Word8 -> Bool) -> Parser ByteString
takeWhile1 p = do
  (`when` demandInput) =<< endOfChunk
  s <- B8.takeWhile p <$> get
  let len = B.length s
  if len == 0
    then fail "takeWhile1"
    else do
      advance len
      eoc <- endOfChunk
      if eoc
        then takeWhileAcc p [s]
        else return s
```

## 前提知識

- **`Parser`**: 入力を読み進めながら結果を作る部品です。読んだ分だけ、入力の位置が進みます。
- **`do` 記法**: 処理を上から順番に書く書き方です。前の結果を `<-` で受け取れます。
- **`demandInput`**: 入力がまだ足りないときに、続きを要求する処理です。
- **`fail`**: パーサを失敗させる処理です。

## 何をしているか

### 1. 入力を用意して、条件に合う部分を取る

```haskell:line-numbers=412
  (`when` demandInput) =<< endOfChunk
  s <- B8.takeWhile p <$> get
```

まず、現在のかたまりが終わっていれば、続きの入力を求めます。その後、`B8.takeWhile p` で、条件に合うバイトを先頭から取ります。

### 2. 1 つも読めなければ失敗させる

```haskell:line-numbers=415
  if len == 0
    then fail "takeWhile1"
```

`len` が 0 なら、条件に合うものが 1 つもありません。この場合は `fail` で止めます。`takeWhile` と違い、空のまとまりを返さない点が名前の「1」の意味です。

### 3. かたまりの端まで読んだら、続きも読む

```haskell:line-numbers=418
      advance len
      eoc <- endOfChunk
      if eoc
        then takeWhileAcc p [s]
```

読んだ分だけ入力を進めます。もし、かたまりの終わりまで来ていたら、`takeWhileAcc` で次のかたまりも続けて読みます。そうでなければ、そのまま `s` を返します。

## ここがすごい

入力は、一度にすべて届くとは限りません。この関数は、かたまりの境目で止まっても、続きを読んで正しい答えを返せるように作られています。

また、`B8.takeWhile` の結果を使うので、1 バイトずつ確かめる遅い処理を避けられます。

## まとめ

- 「1 つ以上」の読み取りは、空のときに失敗させると正しく書ける。
- 入力が分割されて届く場合は、境目の処理を忘れてはいけない。
- 一括で取れる部分は、まとめて扱うと速い。
