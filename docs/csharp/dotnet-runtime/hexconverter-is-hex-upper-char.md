---
title: "2 つの範囲の判定を「引き算して比べる」1 行にまとめる"
description: ".NET の HexConverter.IsHexUpperChar。'0'〜'9' と 'A'〜'F' の 2 つの範囲に入るかを、符号なしの引き算と比較で判定する。文字の範囲判定の定番の書き方。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/Common/src/System/HexConverter.cs
lines: [585, 589]
function: "HexConverter.IsHexUpperChar"
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 最適化]
---

## ひとことで

`IsHexUpperChar(c)` は、文字 `c` が **大文字の 16 進数字**（`'0'〜'9'` または `'A'〜'F'`）かどうかを返します。
たとえば `'7'` と `'C'` は true、`'G'` と `'c'` は false です。

関数の中身は 1 行の式ですが、2 つの範囲の判定をどちらも比較 1 回で行っています。

## コード

```csharp:line-numbers=585
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static bool IsHexUpperChar(int c)
        {
            return ((uint)(c - '0') <= 9) || ((uint)(c - 'A') <= ('F' - 'A'));
        }
```

## 前提知識

- **`(uint)(c - '0') <= 9`**: `c - '0'` は、`c` が `'0'` 以上なら 0 以上、`'0'` より小さければ負になります。それを `uint` にすると、負の数は巨大な正の数になります。そのため、「0 以上 9 以下」の判定が 1 回の比較で済みます。
- **`||`**: 「または」です。左が真なら右は評価しません。
- **`(uint)` のキャスト**: 符号なしの整数として扱うための変換です。
- **`'F' - 'A'`**: 文字の差で、5 です。コンパイル時に計算される定数になります。

## 何をしているか

### 1. 数字の範囲

```csharp:line-numbers=588
            return ((uint)(c - '0') <= 9) || ((uint)(c - 'A') <= ('F' - 'A'));
```

`c - '0'` が 0 から 9 の範囲に入るかを判定します。`'5'` なら `5 <= 9` で true、`'G'` なら `'G' - '0' = 23` で false です。

### 2. A から F の範囲

同じ式の後半は、`c - 'A'` が 0 から 5 の範囲に入るかを判定しています。`'C'` なら `'C' - 'A' = 2` で true、`'G'` なら `6` で false です。

2 つの判定のどちらかが true なら、結果は true です。

## ここがすごい

- **範囲の判定を 1 回の比較に**: 「下限以上かつ上限以下」は、引き算して符号なしで比べる 1 回の比較で書けます。範囲の下限より小さい値は、引き算の結果が巨大な正の数になるので、比べた時点で false になります。
- **分岐を使わない**: 表を引いたり、文字の範囲を複数の if で書いたりしないので、CPU の分岐予測に左右されず、どの文字でもほぼ同じ速さで判定されます。
- **大文字版と小文字版**: 同じファイルの `IsHexLowerChar` は `'a'` を使う版です。大文字と小文字を別々に用意して、用途に合わせて使い分けています。
- **短くても正確**: 1 行で書けるのに、範囲外の入力（負の値も含む）も正しく false になります。

## まとめ

- 範囲の判定は「引き算して符号なしで比べる」で 1 回の比較にできる。
- 2 つの範囲は、それぞれの判定を `||` でつなげばよい。
- 分岐を減らすと、入力によって速さがぶれにくくなる。
