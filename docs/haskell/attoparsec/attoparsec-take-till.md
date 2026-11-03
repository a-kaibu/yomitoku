---
title: "条件に合わないバイトが来るまで読む"
description: "attoparsec の takeTill。条件に合うバイトに出会うまで読み、そこで止まる。条件に合うものが最初から無ければ、空の結果で成功する。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [248, 249]
function: "takeTill"
difficulty: 1
format: 2
tags: [パース, 文字列処理, 関数型]
---

## ひとことで

`takeTill p` は、条件 `p` に合うバイトに出会うまで入力を読み取り、その手前までを返すパーサです。`p` に合うバイトが最初から来ていた場合は、何も読まずに空のまとまりを返します。

## コード

```haskell:line-numbers=248
takeTill :: (Word8 -> Bool) -> Parser ByteString
takeTill p = takeWhile (not . p)
```

## 前提知識

- **`takeWhile`**: 条件に合う間だけ読み取る関数です。前の記事の `takeWhile1` と同じ仲間です。
- **`not`**: 真偽値を反対にする関数です。
- **`not . p`**: 「`p` の反対」を表す関数を作る書き方です。合成の記号 `.` を使っています。
- **`ByteString`**: バイト列の型です。

## 何をしているか

### 1. 条件を反対にする

```haskell:line-numbers=249
takeTill p = takeWhile (not . p)
```

`not . p` は、「条件 `p` に合わないバイト」を表す関数です。`p` が真のバイトで止めたいので、`takeWhile` にはその反対の条件を渡します。

### 2. 条件に合う間だけ読む

`takeWhile (not . p)` は、「条件 `p` に合わない」バイトが続く間だけ読み取ります。条件 `p` に合うバイトが来た時点で、そこで止まります。止まったバイトは読まれずに残ります。

## ここがすごい

「区切りの文字まで読む」という処理を、条件の反対を取るだけで書けます。新しい読み取りの仕組みを作らずに、既にある `takeWhile` を再利用しています。

また、この関数は失敗しません。読めるものが無いときは空のまとまりを返すので、呼び出し側が失敗の場合を考えずに済みます。

## まとめ

- 「〜まで読む」は、条件の反対を使うと既存の部品で書ける。
- 失敗しない読み取りは、結果が空でも成功するので扱いやすい。
- 小さな関数を組み替えて、新しい動きを作ることができる。
