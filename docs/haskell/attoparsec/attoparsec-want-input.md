---
title: "入力がまだあるかを、真偽値で確かめる"
description: "attoparsec の wantInput。今の位置に入力があれば True を返す。足りなければ続きを要求し、続きが来なければ False を返す。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Internal.hs
lines: [98, 105]
function: "wantInput"
difficulty: 3
format: 2
tags: [パース, 防御的プログラミング, 入出力]
---

## ひとことで

`wantInput` は、読み進められる入力があるかを調べて、真偽値で返すパーサです。入力が今のかたまりに残っていなければ、続きを要求し、続きが来なければ `False` を返します。

## コード

```haskell:line-numbers=98
wantInput :: forall t . Chunk t => Parser t Bool
wantInput = Parser $ \t pos more _lose succ ->
  case () of
    _ | pos < atBufferEnd (undefined :: t) t -> succ t pos more True
      | more == Complete -> succ t pos more False
      | otherwise       -> let lose' t' pos' more' = succ t' pos' more' False
                               succ' t' pos' more' = succ t' pos' more' True
                           in prompt t pos more lose' succ'
```

## 前提知識

- **`Parser t Bool`**: 入力 `t` を読んで、真偽値を返すパーサです。読み位置は動きません。
- **`more`**: まだ入力が続く可能性があるかを表す印です。`Complete` は、続きがないことを表します。
- **`prompt`**: 続きの入力を要求する処理です。
- **`case () of` と `_ |`**: 条件を上から順に調べる書き方です。

## 何をしているか

### 1. まだ残っていれば True を返す

```haskell:line-numbers=101
    _ | pos < atBufferEnd (undefined :: t) t -> succ t pos more True
```

読み位置 `pos` が、今のかたまりの終わりより前にあれば、入力はまだあります。そのまま `True` で成功します。

### 2. 続きが来ないと分かれば False

```haskell:line-numbers=102
      | more == Complete -> succ t pos more False
```

かたまりが終わっていて、続きも来ないと分かっているなら、`False` で成功します。

### 3. 続きを要求する

```haskell:line-numbers=103
      | otherwise       -> let lose' t' pos' more' = succ t' pos' more' False
```

それ以外のときは、続きを要求します。続きが届かなかったら `False`、届いたら `True` を返すように、2 つの継続を用意します。

## ここがすごい

「入力があるか」を、例外ではなく真偽値で返すので、呼び出し側は普通の `if` で分岐できます。継続を 2 つ使い分けることで、待つ処理と判定を 1 つにまとめています。

## まとめ

- 入力の有無は、真偽値で返すと分岐が簡単になる。
- 続きを待つ処理は、成功と失敗の継続で表せる。
- 読み位置を動かさずに判定できるので、先読みに安心して使える。
