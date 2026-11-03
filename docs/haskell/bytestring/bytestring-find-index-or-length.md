---
title: "見つからないときは「長さ」を返す検索"
description: "ByteString の内部関数 findIndexOrLength。見つからなければ Nothing ではなく長さを返すことで、Maybe の箱を作らずに済ませる。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "Copyright (c) Don Stewart 2005-2009"
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString/Internal/Type.hs
lines: [410, 420]
function: "findIndexOrLength"
difficulty: 2
format: 2
tags: [文字列処理, 最適化, 低レイヤ]
---

## ひとことで

`findIndexOrLength` は、バイト列の中で条件を満たす最初の位置を探す関数です。見つからなかったときは `Nothing` ではなく、**バイト列の長さ** を返します。

長さを返すのは、「見つからない」を「末尾にいる」として扱うと、呼ぶ側が簡単になるからです。内部の処理で使うために作られた関数です。

## コード

```haskell:line-numbers=410
findIndexOrLength :: (Word8 -> Bool) -> ByteString -> Int
findIndexOrLength k (BS x l) =
    accursedUnutterablePerformIO $ g x
  where
    g ptr = go 0
      where
        go !n | n >= l    = return l
              | otherwise = do w <- peekFp $ ptr `plusForeignPtr` n
                               if k w
                                 then return n
                                 else go (n+1)
```

## 前提知識

- **`ByteString` の中身**: `BS x l` は、メモリ上のバイト列へのポインタ `x` と長さ `l` の組です。
- **`ForeignPtr`**: C 言語とやりとりするためのメモリのポインタです。`peekFp` で、その位置の 1 バイトを読みます。
- **`where` のネスト**: `g` の中に `go` が定義されていて、`go` が位置 `n` を 1 つずつ進めます。
- **`!n`**: 引数を厳密に評価させる印です。ループの添字を毎回確定させます。
- **`accursedUnutterablePerformIO`**: 純粋な関数の中で、メモリを読むための内部の仕組みです。名前の通り、慎重に使う必要があります。

## 何をしているか

### 1. 終端なら長さを返す

```haskell:line-numbers=416
        go !n | n >= l    = return l
```

位置 `n` が長さ `l` 以上になったら、もう探す場所がありません。そのとき、戻り値は `l` です。

### 2. 1 バイトずつ条件を調べる

```haskell:line-numbers=417
              | otherwise = do w <- peekFp $ ptr `plusForeignPtr` n
                               if k w
                                 then return n
                                 else go (n+1)
```

`peekFp` で `n` 番目のバイトを読み、条件 `k` に合えば、その位置 `n` を返します。合わなければ、次の位置 `n+1` へ進みます。

具体例で見ます。`"abc"` で「`'b'` かどうか」を探すと、位置 1 で条件が合うので、1 を返します。`'z'` を探すと、どこにもないので、長さの 3 を返します。

## ここがすごい

見つからないときに `Maybe Int` を返すと、結果を毎回 `Just` や `Nothing` で包み、呼ぶ側でも取り出す必要があります。この関数は、長さという「ちょうど範囲外の値」を使うことで、包む手間を省いています。

さらに、`go` の中の `n` を `!` で厳密にしておけば、ループの途中で遅延した計算がたまりません。内部の関数だからこそ、速さを優先した書き方を選んでいます。

## まとめ

- 見つからないときの値を、範囲外の数（長さ）にすると、箱を省ける。
- 内部用の関数は、公開しない前提で、速さを優先できる。
- ループの添字は `!` で確定させると、メモリがたまりにくい。
