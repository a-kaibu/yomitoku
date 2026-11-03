---
title: "4 バイトの UTF-8 から、絵文字などの文字を組み立てる"
description: "4 バイトの UTF-8 を 1 つのコードポイントに戻す chr4。絵文字のような、U+10000 以上の文字を組み立てる。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) 2008, 2009 Tom Harper, (c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Encoding/Utf8.hs
lines: [184, 195]
function: "chr4"
difficulty: 3
format: 2
tags: [Unicode, ビット演算, 低レイヤ]
---

## ひとことで

`chr4` は、4 バイトの UTF-8 の並びから、元の文字を組み立てる関数です。絵文字のように、コードポイントが `0x10000` 以上の文字を扱います。

前の記事の `chr3` と同じ考え方で、先頭の目印を引いてから、ビットを並べ直します。違うのは、バイトが 4 つあることだけです。

## コード

```haskell:line-numbers=184
chr4 :: Word8 -> Word8 -> Word8 -> Word8 -> Char
chr4 (W8# x1#) (W8# x2#) (W8# x3#) (W8# x4#) =
    C# (chr# (z1# +# z2# +# z3# +# z4#))
    where
      !y1# = word2Int# (word8ToWord# x1#)
      !y2# = word2Int# (word8ToWord# x2#)
      !y3# = word2Int# (word8ToWord# x3#)
      !y4# = word2Int# (word8ToWord# x4#)
      !z1# = uncheckedIShiftL# (y1# -# 0xF0#) 18#
      !z2# = uncheckedIShiftL# (y2# -# 0x80#) 12#
      !z3# = uncheckedIShiftL# (y3# -# 0x80#) 6#
      !z4# = y4# -# 0x80#
```

## 前提知識

- **4 バイトの UTF-8**: 先頭のバイトは `11110xxx`、続きの 3 バイトは `10xxxxxx` の形です。
- **`uncheckedIShiftL#`**: 整数を左にずらす、境界を確かめない演算です。
- **MagicHash の `#`**: ボックスなしの値を表します。
- **`chr#`**: 整数を文字にするプリミティブです。

## 何をしているか

### 1. 4 つのバイトから目印を引き、ビットをずらす

```haskell:line-numbers=192
      !z1# = uncheckedIShiftL# (y1# -# 0xF0#) 18#
      !z2# = uncheckedIShiftL# (y2# -# 0x80#) 12#
      !z3# = uncheckedIShiftL# (y3# -# 0x80#) 6#
      !z4# = y4# -# 0x80#
```

先頭のバイトから `0xF0` を引き、18 ビット左へずらします。続く 3 バイトは、それぞれ `0x80` を引いて、12 ビット、6 ビット、0 ビットの位置へずらします。こうして、各バイトのビットが、正しい位置に入ります。

### 2. 4 つを足し合わせて文字にする

```haskell:line-numbers=185
chr4 (W8# x1#) (W8# x2#) (W8# x3#) (W8# x4#) =
    C# (chr# (z1# +# z2# +# z3# +# z4#))
```

4 つの値を足し合わせ、`chr#` で文字に戻します。ビットの位置が重ならないので、足し算が並べることと同じになります。

具体例で見ます。絵文字 😀（U+1F600）は、UTF-8 では `F0 9F 98 80` です。先頭の `F0` からは 0 が、次の `9F` からは `0x1F << 12 = 0x1F000` が、`98` からは `0x18 << 6 = 0x600` が、最後の `80` からは 0 が得られます。合計は `0x1F600` になり、😀 に戻ります。

## ここがすごい

4 バイトの処理を、3 バイトの場合と同じ形で書いています。規則が揃っているので、読む人は 1 つ理解すれば、残りもすぐに読めます。

また、関数の名前の `chr4` は、バイト数を名前に含めています。`chr2`、`chr3`、`chr4` と並ぶことで、どの長さの文字を扱うかが一目で分かります。

## まとめ

- UTF-8 の各長さは、同じ規則の繰り返しとして書ける。
- ビットの位置を決めてずらすと、バイトから文字を組み立てられる。
- 名前にバイト数を含めると、どの場合の関数か分かりやすい。
