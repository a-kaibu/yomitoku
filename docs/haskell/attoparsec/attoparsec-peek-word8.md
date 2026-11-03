---
title: "次のバイトを、読み位置を進めずに覗く"
description: "attoparsec の peekWord8。次のバイトを取り出すが、入力は進めない。入力の終わりでは Nothing を返すので、終わりかどうかも安全に判断できる。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/ByteString/Internal.hs
lines: [468, 474]
function: "peekWord8"
difficulty: 2
format: 2
tags: [パース, 防御的プログラミング, 入出力]
---

## ひとことで

`peekWord8` は、次に来るバイトを `Just` の中に入れて返しますが、読み位置は進めません。入力が終わっているときは `Nothing` を返すので、続きがあるかどうかを安全に調べられます。

## コード

```haskell:line-numbers=468
peekWord8 :: Parser (Maybe Word8)
peekWord8 = T.Parser $ \t pos@(Pos pos_) more _lose succ ->
  case () of
    _| pos_ < Buf.length t ->
       let !w = Buf.unsafeIndex t pos_
       in succ t pos more (Just w)
     | more == Complete ->
```

## 前提知識

- **`Maybe Word8`**: 値があれば `Just 値`、なければ `Nothing` を表す型です。終わりかどうかを型で表せます。
- **`Pos`**: 入力のどこを読んでいるかを表す位置です。
- **`more`**: まだ入力が続く可能性があるかを表す印です。`Complete` は、もう続きが来ないことを表します。
- **`case () of` と `_|`**: 条件を順に調べるための書き方です。`|` のあとに条件を並べられます。

## 何をしているか

### 1. まだ読める場所なら、その 1 バイトを返す

```haskell:line-numbers=469
peekWord8 = T.Parser $ \t pos@(Pos pos_) more _lose succ ->
```

パーサの中身は、入力 `t`、位置 `pos`、続きの有無 `more`、失敗時の処理 `_lose`、成功時の処理 `succ` を受け取る形になっています。`_lose` を使わないので、名前の前に `_` を付けています。

```haskell:line-numbers=472
       let !w = Buf.unsafeIndex t pos_
       in succ t pos more (Just w)
```

`pos_` が入力の長さより小さければ、その位置のバイトを `w` として取り出します。`succ` には、同じ位置 `pos` を渡しているので、読み位置は動きません。

### 2. 入力が終わったときの判断

```haskell:line-numbers=474
     | more == Complete ->
```

ここまで来ると、今いる位置にバイトがありません。続きが来ない `Complete` のときは、その後の処理で `Nothing` を返します。まだ続きがあるなら、入力を待つ処理に進みます。

## ここがすごい

「次のバイトがあるか」を、例外ではなく `Maybe` で返すので、失敗の扱いを型で明確にできます。読む側は `Nothing` を必ず処理しなければならないので、うっかり終わりを見落とすことがありません。

また、読み位置を動かさずに `succ` へ同じ `pos` を渡すことで、先読みを安く実現しています。

## まとめ

- 先読みの処理は、読み位置を動かさずに値だけ返すと書ける。
- 終わりの有無は `Maybe` で表すと安全になる。
- 入力が続くかどうかを区別すると、待つべき場面が分かる。
