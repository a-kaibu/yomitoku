---
title: "先頭の 1 バイトだけで、続くバイト数を決める"
description: "UTF-8 の先頭バイトを見るだけで、その文字が何バイトかを判定する utf8LengthByLeader。続きのバイトを読まずに済ませる。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) 2008, 2009 Tom Harper, (c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Encoding/Utf8.hs
lines: [90, 95]
function: "utf8LengthByLeader"
difficulty: 2
format: 2
tags: [Unicode, 文字列処理, 低レイヤ]
---

## ひとことで

`utf8LengthByLeader` は、UTF-8 の文字の**先頭バイト**だけを見て、その文字が何バイトで構成されるかを返す関数です。続きのバイトを読む必要はありません。

UTF-8 では、先頭のバイトの上の bit のパターンが、長さを教えてくれます。この関数は、そのパターンを境界値で分けて判定しています。

## コード

```haskell:line-numbers=90
utf8LengthByLeader :: Word8 -> Int
utf8LengthByLeader w
  | w < 0xC0  = 1
  | w < 0xE0  = 2
  | w < 0xF0  = 3
  | otherwise = 4
```

## 前提知識

- **`Word8`**: 1 バイトの整数です。0 から 255 までの値を取ります。
- **ガード**: `| 条件 = 値` の形で、条件を上から順に調べます。
- **UTF-8 の先頭バイト**: 1 バイトの文字（ASCII）は `0xxxxxxx`、2 バイトの文字の先頭は `110xxxxx`、3 バイトは `1110xxxx`、4 バイトは `11110xxx` で始まります。続きのバイトは `10xxxxxx` です。
- **16 進数**: `0xC0` のように、`0x` で始まる表記です。`0xC0` は 2 進数で `11000000` です。

## 何をしているか

### 1. 先頭バイトを境界値と比べる

```haskell:line-numbers=92
  | w < 0xC0  = 1
  | w < 0xE0  = 2
  | w < 0xF0  = 3
  | otherwise = 4
```

- `w < 0xC0`（2 進数で `10xxxxxx`）なら 1 です。ASCII でもあり得ますが、ここでは続きのバイトなので 1 とします。
- `w < 0xE0`（`110xxxxx`）なら 2 です。
- `w < 0xF0`（`1110xxxx`）なら 3 です。
- それ以外（`11110xxx`）なら 4 です。

境界値を並べて比べるだけで、先頭のビットパターンに対応した長さが分かります。

## ここがすごい

UTF-8 の設計が、この関数を単純にしています。先頭のバイトだけで、続きのバイト数が決まるように作られているので、文字列を先頭から安全に区切れます。

また、比べる値を `0xC0`、`0xE0`、`0xF0` と並べると、ビットの読み方とそのまま対応します。数字の境界を見るだけで、「どのビットから始まる文字か」が分かる書き方です。

コメントにあるように、続きのバイト（`10xxxxxx`）が来たときは 1 を返し、壊れた入力でも安全に進めるようにしています。

## まとめ

- UTF-8 は、先頭のバイトだけで文字の長さが分かるように作られている。
- 境界値を並べて比べると、ビットパターンの判定を短く書ける。
- 壊れた入力にも、落ちずに進める工夫が大切。
