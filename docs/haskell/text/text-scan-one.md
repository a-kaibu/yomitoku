---
title: "1 バイトの針を、メモリ検索でまとめて探す"
description: "針が 1 バイトだけのときの Data.Text 検索 scanOne。C 言語の memchr を使い、見つけた位置を次々に返す。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Search.hs
lines: [93, 98]
function: "scanOne"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, 低レイヤ]
---

## ひとことで

`scanOne` は、1 バイトだけの針 `c` を、文字列の中で探して、見つかった位置の一覧を返す関数です。前の記事の `indices'` とは別に、1 バイトだけの場合のための特別な近道です。

針が 1 バイトのとき、ビットマスクや飛ばし幅を計算するのは無駄です。この関数は、C 言語の `memchr` という、1 バイトを探すのに特化した関数を直接使っています。

## コード

```haskell:line-numbers=93
scanOne :: Word8 -> Text -> [Int]
scanOne c (Text (A.ByteArray harr#) hoff hlen) = loop 0
  where
    loop !i = case memchr harr# (hoff + i) (hlen - i) c of
      -1 -> []
      x  -> i + x : loop (i + x + 1)
```

## 前提知識

- **`Word8` と `Text`**: 1 バイトの整数と、UTF-8 のバイト列の文字列です。
- **`loop !i`**: `i` を厳密に扱いながら、繰り返し呼ばれる関数です。Haskell では、繰り返しを再帰で書きます。
- **`case ... of -1 -> ...`**: `memchr` の戻り値で場合分けしています。`-1` は「見つからなかった」を表す慣習です。
- **`:` によるリストの構築**: `i + x : loop (...)` は、先頭に値を付けて、残りのリストを作る式です。

## 何をしているか

### 1. memchr で次の位置を探す

```haskell:line-numbers=96
    loop !i = case memchr harr# (hoff + i) (hlen - i) c of
```

`memchr` は、先頭の位置 `hoff + i` から、残りの長さ `hlen - i` の範囲で `c` を探します。見つかれば、その位置からの差（オフセット）を返します。見つからなければ `-1` です。

### 2. 見つかったら、結果に入れて続きを探す

```haskell:line-numbers=97
      -1 -> []
      x  -> i + x : loop (i + x + 1)
```

`-1` なら、もう見つからないので空のリストを返します。見つかったら、`i + x` を結果の先頭に付けます。`i + x` は文字列の先頭からの位置です。続きの探索は、見つけた場所の 1 つ後ろ（`i + x + 1`）から始めます。

## ここがすごい

1 バイトの探索は、ほかの方法より単純です。だからこそ、特別な経路を用意すると、全体の速さに効きます。ここでは、マスクや飛ばし幅といった重い準備を省いて、C 言語の高速な関数に任せています。

また、結果は遅延リストとして作られるので、最初の一致だけ欲しい場合は、残りを探す必要がありません。Haskell の遅延評価と、必要な分だけ探す考え方が、よく合っています。

## まとめ

- 特別な場合（1 バイトの針）には、専用の近道を用意すると速い。
- C 言語の高速な関数を、安全な Haskell の関数の中から呼ぶことができる。
- 遅延リストで結果を返すと、必要な分だけ探せる。
