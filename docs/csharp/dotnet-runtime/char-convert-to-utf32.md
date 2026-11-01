---
title: "2 つの char から、1 文字の Unicode 番号を計算する"
description: ".NET の Char.ConvertToUtf32(char, char)。絵文字などを表す 2 つの char（サロゲートペア）を、1 つの Unicode の番号（コードポイント）に戻す。範囲の検査も 1 回の比較で済ませる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Char.cs
lines: [1125, 1138]
function: "Char.ConvertToUtf32(char, char)"
difficulty: 3
format: 2
tags: [Unicode, 文字列処理, ビット演算]
---

## ひとことで

`Char.ConvertToUtf32(high, low)` は、2 つの `char` からなる **サロゲートペア** を、1 つの **Unicode の番号** に戻す関数です。
たとえば絵文字の `😀`（U+1F600）は、`'\uD83D'` と `'\uDE00'` の 2 つの `char` で表されます。この関数に渡すと `0x1F600` が返ります。

C# の `char` は 1 文字で 16 ビットしかありません。そのため、65536 を超える文字は 2 つの `char` に分けて格納されます。

## コード

::: code-group

```csharp:line-numbers=1125 [日本語訳]
            uint highSurrogateOffset = (uint)highSurrogate - CharUnicodeInfo.HIGH_SURROGATE_START;
            uint lowSurrogateOffset = (uint)lowSurrogate - CharUnicodeInfo.LOW_SURROGATE_START;

            // 上位と下位の両方を、1 回の比較で範囲チェックできる。
            // 2 つの範囲は同じ長さなので、どちらかが外れていれば、論理和の結果が範囲を超える。
            // 比較に失敗したら、正しい例外メッセージを出すための補助関数を呼ぶ。

            if ((highSurrogateOffset | lowSurrogateOffset) > CharUnicodeInfo.HIGH_SURROGATE_RANGE)
            {
                ConvertToUtf32_ThrowInvalidArgs(highSurrogateOffset);
            }

            // 0x40 << 10 は、サロゲートの符号化で uuuuu = wwww + 1 となる規則を補正するためのもの。
            return ((int)highSurrogateOffset << 10) + (lowSurrogate - CharUnicodeInfo.LOW_SURROGATE_START) + (0x40 << 10);
```

```csharp:line-numbers=1125 [原文]
            uint highSurrogateOffset = (uint)highSurrogate - CharUnicodeInfo.HIGH_SURROGATE_START;
            uint lowSurrogateOffset = (uint)lowSurrogate - CharUnicodeInfo.LOW_SURROGATE_START;

            // This is a single comparison which allows us to check both for validity at once since
            // both the high surrogate range and the low surrogate range are the same length.
            // If the comparison fails, we call to a helper method to throw the correct exception message.

            if ((highSurrogateOffset | lowSurrogateOffset) > CharUnicodeInfo.HIGH_SURROGATE_RANGE)
            {
                ConvertToUtf32_ThrowInvalidArgs(highSurrogateOffset);
            }

            // The 0x40u << 10 below is to account for uuuuu = wwww + 1 in the surrogate encoding.
            return ((int)highSurrogateOffset << 10) + (lowSurrogate - CharUnicodeInfo.LOW_SURROGATE_START) + (0x40 << 10);
```

:::

## 前提知識

- **UTF-16**: 文字を 16 ビット（`char` 1 個）単位で表す方式です。C# の文字列は、この方式で保存されています。
- **サロゲートペア**: 16 ビットに収まらない文字を、上位（high）と下位（low）の 2 つの `char` で表す仕組みです。上位は `0xD800`〜`0xDBFF`、下位は `0xDC00`〜`0xDFFF` の範囲にあります。
- **コードポイント**: Unicode で文字に割り当てられた番号です。`U+1F600` のように表します。
- **ビットシフト（`<<`）**: 2 進数の桁を左へずらす演算です。`x << 10` は、`x` に 1024 を掛けることと同じです。
- **論理和（`|`）**: 桁ごとに、どちらかが 1 なら 1 にする演算です。2 つの値を 1 回の比較にまとめるために使います。

## 何をしているか

### 1. 上位と下位のずれを求める

```csharp:line-numbers=1125
            uint highSurrogateOffset = (uint)highSurrogate - CharUnicodeInfo.HIGH_SURROGATE_START;
            uint lowSurrogateOffset = (uint)lowSurrogate - CharUnicodeInfo.LOW_SURROGATE_START;
```

上位の `char` から `0xD800` を引き、下位の `char` から `0xDC00` を引きます。それぞれの範囲の先頭からの位置（オフセット）が求まります。

### 2. 範囲を 1 回の比較で確かめる

```csharp:line-numbers=1132
            if ((highSurrogateOffset | lowSurrogateOffset) > CharUnicodeInfo.HIGH_SURROGATE_RANGE)
            {
                ConvertToUtf32_ThrowInvalidArgs(highSurrogateOffset);
            }
```

2 つのオフセットを `|` でまとめて、範囲の大きさ（`HIGH_SURROGATE_RANGE`）と比べます。どちらかが範囲外なら、まとめた値が大きくなるので、ここで検出できます。

### 3. 番号を組み立てる

```csharp:line-numbers=1138
            return ((int)highSurrogateOffset << 10) + (lowSurrogate - CharUnicodeInfo.LOW_SURROGATE_START) + (0x40 << 10);
```

上位のオフセットを 10 ビット左へずらし、下位のオフセットを足し、最後に `0x40 << 10`（`0x10000`）を足します。

### 具体例で確かめる

`😀` は `high = 0xD83D`, `low = 0xDE00` です。

```
上位のオフセット = 0xD83D - 0xD800 = 0x003D
下位のオフセット = 0xDE00 - 0xDC00 = 0x0200
(0x003D << 10) + 0x0200 + 0x10000 = 0xF400 + 0x0200 + 0x10000 = 0x1F600
```

## ここがすごい

- **範囲の検査が 1 回の比較**: 上位と下位の範囲が同じ長さであることを使い、`|` で 2 つをまとめて比べています。条件分岐を減らせます。
- **計算がビット操作だけ**: 割り算や条件分岐を使わず、ずらしと足し算で番号を求めます。
- **補正の理由を注釈に残す**: `0x40 << 10` の意味を注釈で説明しています。数字だけ見ても分かりにくい部分です。
- **例外の中身は別に決める**: 正常な経路を速く保ち、エラーの詳しい説明は補助関数に任せています。

## まとめ

- `ConvertToUtf32` は、サロゲートペアの 2 つの `char` から、Unicode の番号を計算する。
- 範囲の検査は `|` でまとめて 1 回で行う。
- 計算は、上位のずらしと下位の足し算、そして `0x10000` の補正から成る。
