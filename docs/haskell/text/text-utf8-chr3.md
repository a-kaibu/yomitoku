---
title: "3 バイトの UTF-8 から、文字を組み立て直す"
description: "3 バイトの UTF-8 を、1 つのコードポイントに戻す chr3。ビットをシフトして足し合わせ、MagicHash の型で素早く計算する。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) 2008, 2009 Tom Harper, (c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Encoding/Utf8.hs
lines: [172, 180]
function: "chr3"
difficulty: 3
format: 2
tags: [Unicode, ビット演算, 低レイヤ]
---

## ひとことで

`chr3` は、3 バイトの UTF-8 の並び（先頭の 1 バイトと続きの 2 バイト）から、元の文字（`Char`）を組み立てる関数です。`'あ'`（U+3042）は、`E3 81 82` の 3 バイトで表されるので、この関数で `'あ'` に戻ります。

前の記事の `ord2` が「文字をバイトに変える」のに対し、こちらは「バイトを文字に戻す」関数です。

## コード

```haskell:line-numbers=172
chr3 :: Word8 -> Word8 -> Word8 -> Char
chr3 (W8# x1#) (W8# x2#) (W8# x3#) = C# (chr# (z1# +# z2# +# z3#))
    where
      !y1# = word2Int# (word8ToWord# x1#)
      !y2# = word2Int# (word8ToWord# x2#)
      !y3# = word2Int# (word8ToWord# x3#)
      !z1# = uncheckedIShiftL# (y1# -# 0xE0#) 12#
      !z2# = uncheckedIShiftL# (y2# -# 0x80#) 6#
      !z3# = y3# -# 0x80#
```

## 前提知識

- **`Word8` の 3 つの引数**: 3 バイトを、それぞれ `x1`、`x2`、`x3` として受け取ります。
- **MagicHash の `#`**: `W8#` や `C#`、`+#` のように `#` の付いた名前は、ボックスなしの値（プリミティブ）を表します。普通の値より、計算が速くなります。
- **`uncheckedIShiftL#`**: 整数を左にシフトする、境界の確認をしない演算です。
- **`chr#`**: 整数を文字に変換するプリミティブです。
- **`where` と `!`**: 中間の値に名前を付けて、厳密に計算させています。

## 何をしているか

### 1. 3 つのバイトを整数に変えて、ビットを取り出す

```haskell:line-numbers=175
      !y1# = word2Int# (word8ToWord# x1#)
      !y2# = word2Int# (word8ToWord# x2#)
      !y3# = word2Int# (word8ToWord# x3#)
      !z1# = uncheckedIShiftL# (y1# -# 0xE0#) 12#
      !z2# = uncheckedIShiftL# (y2# -# 0x80#) 6#
      !z3# = y3# -# 0x80#
```

各バイトから、先頭の目印を引いて、残りのビットだけを取り出します。

- `x1` は `1110xxxx` の形で、`0xE0` を引くと下位 4 ビットが残ります。それを 12 ビット左にずらします。
- `x2` と `x3` は `10xxxxxx` の形で、`0x80` を引くと下位 6 ビットが残ります。`x2` は 6 ビット左にずらし、`x3` はそのままです。

### 2. 3 つを足し合わせて文字にする

```haskell:line-numbers=172
chr3 :: Word8 -> Word8 -> Word8 -> Char
chr3 (W8# x1#) (W8# x2#) (W8# x3#) = C# (chr# (z1# +# z2# +# z3#))
```

`z1 +# z2 +# z3` は、3 つのビット列を足し合わせた整数です。ビットが重ならないように作られているので、足し算がそのまま「並べること」になります。最後に `chr#` で文字に変換します。

具体例で確かめます。`E3 81 82` は、`z1 = (0xE3-0xE0) << 12 = 0x3000`、`z2 = (0x81-0x80) << 6 = 0x40`、`z3 = 0x82-0x80 = 0x02` です。合計は `0x3042` で、`'あ'` になります。

## ここがすごい

3 つの値は、ビットの位置が互いに重ならないので、`+` の代わりに `or` と書いても同じ結果になります。加算を使うことで、計算の意図が「並べる」であることが分かりやすくなります。

また、`#` の付いた計算は、ボックス化のコストがかからないので、大量の文字を変換するときに速さが出ます。ただし、前提（3 バイトで正しい形）を確かめてから呼ぶ必要があり、その確認は別の関数（`validate3`）が担当しています。

## まとめ

- UTF-8 の文字は、各バイトから目印を引いて、ビットを並べ直すと戻せる。
- ビットの位置が重ならなければ、足し算で並べられる。
- 高速な計算と、前提の確認は、別々の関数に分けると安全になる。
