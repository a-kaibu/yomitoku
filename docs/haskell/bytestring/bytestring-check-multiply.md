---
title: "掛け算の溢れを、上位ビットの有無で調べる"
description: "非負の整数どうしの掛け算で、結果が Int に収まるかを判定する checkedMultiply。CPU の命令か、2 語の積のビットで溢れを見つける。"
language: haskell
project: "bytestring"
repo: https://github.com/haskell/bytestring
license: "BSD-3-Clause"
copyright: "Copyright (c) Don Stewart 2005-2009"
commit: "35404dd65f4fbe09e5d28e4342b22bff5ac92fc2"
file: Data/ByteString/Internal/Type.hs
lines: [1145, 1155]
function: "checkedMultiply"
difficulty: 3
format: 2
tags: [防御的プログラミング, 数値計算, 低レイヤ]
---

## ひとことで

`checkedMultiply` は、2 つの非負の整数を掛けて、結果が `Int` に収まるかを確かめる関数です。収まらなければ、エラーを投げます。

掛け算は、足し算より早く溢れます。たとえば、大きな数どうしを掛けると、結果はすぐに `Int` の範囲を超えます。そのため、掛け算専用の確認が必要です。

## コード

```haskell:line-numbers=1145
checkedMultiply fun !x@(I# x#) !y@(I# y#) = assert (min x y >= 0) $
#if HS_timesInt2_PRIMOP_AVAILABLE
  case timesInt2# x# y# of
    (# 0#, _, result #) -> I# result
    _ -> overflowError fun
#else
  case timesWord2# (int2Word# x#) (int2Word# y#) of
    (# hi, lo #) -> case or# hi (uncheckedShiftRL# lo shiftAmt) of
      0## -> I# (word2Int# lo)
      _   -> overflowError fun
  where !(I# shiftAmt) = finiteBitSize (0 :: Word) - 1
```

## 前提知識

- **`!x@(I# x#)`**: 値に名前を付けると同時に、中の「ボックスなしの整数」`x#` も取り出すパターンです。
- **`timesInt2#`**: 2 つの整数の積を、上位と下位に分けて返す CPU の命令です。溢れたかどうかが分かります。
- **`timesWord2#`**: 符号なし版の積で、上位と下位を組で返します。
- **`#if`**: 環境によって、どちらのコードを使うかを切り替える仕組みです。
- **`finiteBitSize`**: 型のビット数を返す関数です。

## 何をしているか

### 1. CPU の命令を使える場合

```haskell:line-numbers=1147
  case timesInt2# x# y# of
    (# 0#, _, result #) -> I# result
    _ -> overflowError fun
```

`timesInt2#` は、積の結果が `Int` に収まるかどうかを、命令の結果の 1 つ目の値（溢れの有無）で返します。`0#` なら、収まったので結果を返します。それ以外なら、エラーを投げます。

### 2. 使えない場合の代替

```haskell:line-numbers=1151
  case timesWord2# (int2Word# x#) (int2Word# y#) of
    (# hi, lo #) -> case or# hi (uncheckedShiftRL# lo shiftAmt) of
      0## -> I# (word2Int# lo)
      _   -> overflowError fun
```

`timesWord2#` で、上位と下位の 2 つの語に分けて積を求めます。上位の語と、下位を右へずらした値を「または」でまとめて、0 なら溢れていません。0 でなければ、溢れています。

`shiftAmt` は、`Int` のビット数から 1 を引いた数（符号ビットの位置）です。

## ここがすごい

溢れを、積の上位ビットを見るだけで判定できます。大きな数の掛け算を実際に行わずに、「収まるか」を知る方法です。

また、CPU の命令が使えるかどうかで、2 通りの書き方を用意しています。速さを優先しつつ、どの環境でも正しく動くように、`#if` で書き分けています。

## まとめ

- 掛け算の溢れは、積の上位ビットを見ると判定できる。
- 速い命令が使えるなら、それを優先し、無理なら代替の計算を使う。
- 環境ごとの違いは、`#if` で一か所にまとめると読みやすい。
