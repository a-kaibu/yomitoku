---
title: "バイト列の先頭 1 バイトを、残りと一緒に取り出す"
description: "bytestring の uncons。空なら Nothing、そうでなければ先頭のバイトと、残りのバイト列を組にして返す。残りは元のバッファを共有する。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "\"Copyright (c) Don Stewart 2005-2009\""
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString.hs
lines: [429, 434]
function: "uncons"
difficulty: 2
format: 2
tags: [文字列処理, 型システム, メモリ管理]
---

## ひとことで

`uncons` は、バイト列の先頭の 1 バイトと、残りのバイト列を組にして取り出す関数です。空のバイト列には `Nothing` を返します。

## コード

```haskell:line-numbers=429
uncons :: ByteString -> Maybe (Word8, ByteString)
uncons (BS x l)
    | l <= 0    = Nothing
    | otherwise = Just (accursedUnutterablePerformIO $ unsafeWithForeignPtr x
                                                     $ \p -> peek p,
                        BS (plusForeignPtr x 1) (l-1))
```

## 前提知識

- **`ByteString`**: バイトの並びを表す型です。文字列より低い層で、メモリの塊をそのまま扱います。
- **`Word8`**: 0 から 255 までの 1 バイトの数です。
- **`ForeignPtr`**: GC の管理下にある、メモリの番地を指す値です。バイト列の本体はこれで指されています。
- **`peek`**: 番地から値を読む操作です。

## 何をしているか

### 1. 空かどうかを調べる

```haskell:line-numbers=431
    | l <= 0    = Nothing
```

長さ `l` が 0 以下なら、取り出せる 1 バイトがありません。`Nothing` を返して終わります。

### 2. 先頭のバイトを読む

```haskell:line-numbers=432
    | otherwise = Just (accursedUnutterablePerformIO $ unsafeWithForeignPtr x
                                                     $ \p -> peek p,
```

番地 `p` の先頭から 1 バイトを `peek` で読みます。`accursedUnutterablePerformIO` は、この読み取りを純粋な値として取り出すための仕組みです。

### 3. 残りを、番地をずらして作る

```haskell:line-numbers=434
                        BS (plusForeignPtr x 1) (l-1))
```

残りのバイト列は、元のバッファの先頭番地を 1 つ進め、長さを 1 減らして作ります。コピーはしません。

## ここがすごい

残りを作るのに、バイトを 1 つずつ複写しません。番地と長さの組を作り直すだけなので、長いバイト列でも一定の時間で取り出せます。

先頭を読む処理は純粋に見えますが、実際にはメモリを読んでいます。その危険な部分を 1 か所に閉じ込めて、外からは安全な関数に見せています。

## まとめ

- バイト列の先頭を取るのは、バッファの番地をずらすだけで済む。
- 空の場合は `Nothing` で表すと、取り出しの失敗を扱いやすい。
- 危険な読み取りは小さな範囲にまとめ、外からは純粋な関数に見せる。
