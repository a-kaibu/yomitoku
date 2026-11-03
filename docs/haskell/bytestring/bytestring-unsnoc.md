---
title: "バイト列の末尾 1 バイトを、前の部分と一緒に取り出す"
description: "bytestring の unsnoc。空なら Nothing、そうでなければ末尾を除いたバイト列と、末尾のバイトの組を返す。uncons の末尾版。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "\"Copyright (c) Don Stewart 2005-2009\""
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString.hs
lines: [460, 465]
function: "unsnoc"
difficulty: 2
format: 2
tags: [文字列処理, 型システム, メモリ管理]
---

## ひとことで

`unsnoc` は、バイト列の末尾の 1 バイトと、その前の部分を組にして取り出す関数です。空のバイト列には `Nothing` を返します。

## コード

```haskell:line-numbers=460
unsnoc :: ByteString -> Maybe (ByteString, Word8)
unsnoc (BS x l)
    | l <= 0    = Nothing
    | otherwise = Just (BS x (l-1),
                        accursedUnutterablePerformIO $
                          unsafeWithForeignPtr x $ \p -> peekByteOff p (l-1))
```

## 前提知識

- **`uncons`**: 先頭を取り出す対になる関数です。`unsnoc` は末尾を取り出します。
- **`Word8`**: 0 から 255 までの 1 バイトの数です。
- **`peekByteOff`**: 番地からずれた位置にある値を読む操作です。ずれの大きさをバイト数で指定します。

## 何をしているか

### 1. 空かどうかを調べる

```haskell:line-numbers=462
    | l <= 0    = Nothing
```

長さ `l` が 0 以下なら、末尾がないので `Nothing` を返します。

### 2. 前の部分を作る

```haskell:line-numbers=463
    | otherwise = Just (BS x (l-1),
```

末尾を除いた部分は、同じ番地から、長さを 1 減らして作ります。コピーはしません。

### 3. 末尾のバイトを読む

```haskell:line-numbers=464
                        accursedUnutterablePerformIO $
                          unsafeWithForeignPtr x $ \p -> peekByteOff p (l-1))
```

末尾のバイトは、先頭から `l-1` バイト進んだ番地を読んで取り出します。

## ここがすごい

前の部分は、元のバッファを指したまま長さだけを変えています。末尾の 1 バイトを外すだけなので、バイト列の長さに関係なく一定の時間で済みます。

先頭版の `uncons` と同じ形で書かれているため、両方を並べて読むと違いがよく分かります。

この関数は `uncons` と違い、末尾へのアクセスが必要な場面で使われます。たとえば、区切り文字の後ろの部分を、末尾から順に読み取るような処理です。戻り値が組になっているので、呼ぶ側は「前の部分」と「末尾の値」を同時に受け取れます。空のときに `Nothing` を返すので、末尾がないことを忘れずに扱えます。

## まとめ

- 末尾を外すのは、長さを 1 減らすだけで済む。
- 末尾のバイトは、長さから 1 を引いた位置を読めばよい。
- 対になる関数を揃えて書くと、読み比べやすい。
