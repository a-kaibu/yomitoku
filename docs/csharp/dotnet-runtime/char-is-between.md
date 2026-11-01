---
title: "「min 以上 max 以下」を比較 1 回で判定する符号なしの技"
description: "char.IsBetween は、c - min を符号なし整数として扱うことで、下限と上限の 2 つの比較を 1 つにまとめる。.NET のあちこちで使われる範囲判定のイディオムを読む。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Char.cs
lines: [376, 387]
function: "char.IsBetween"
difficulty: 1
tags: [イディオム, 最適化, 文字列処理]
---

## ひとことで

`char.IsBetween(c, min, max)` は、文字 `c` が **`min` 以上 `max` 以下** にあるかを返します。
`char.IsBetween('5', '0', '9')` は true、`char.IsBetween('x', '0', '9')` は false です。同じファイルの `char.IsAsciiDigit` は、この関数を `IsBetween(c, '0', '9')` と呼ぶだけで実装されています。

ふつうは `c >= min && c <= max` と 2 回比べますが、この関数は **比較 1 回** で済ませます。

## コード

```csharp:line-numbers=376
        /// <summary>Indicates whether a character is within the specified inclusive range.</summary>
        /// <param name="c">The character to evaluate.</param>
        /// <param name="minInclusive">The lower bound, inclusive.</param>
        /// <param name="maxInclusive">The upper bound, inclusive.</param>
        /// <returns>true if <paramref name="c"/> is within the specified range; otherwise, false.</returns>
        /// <remarks>
        /// The method does not validate that <paramref name="maxInclusive"/> is greater than or equal
        /// to <paramref name="minInclusive"/>.  If <paramref name="maxInclusive"/> is less than
        /// <paramref name="minInclusive"/>, the behavior is undefined.
        /// </remarks>
        public static bool IsBetween(char c, char minInclusive, char maxInclusive) =>
            (uint)(c - minInclusive) <= (uint)(maxInclusive - minInclusive);
```

## 前提知識

- **`char`**: 16 ビットの文字型です。中身は数値なので、`c - min` のように引き算ができます。結果は `int`（32 ビット符号付き整数）になります。
- **`uint`**: 32 ビット符号なし整数です。0〜約 42 億の範囲で、負の数がありません。
- **`(uint)` キャストと負の数**: `int` の −1 を `uint` にすると、ビットの並びはそのままで 4294967295（最大値）として読まれます。**負の数はすべて、とても大きな正の数になる** のがポイントです。
- **XML ドキュメントコメント**: `/// <summary>` などで始まる行は、API の説明を書くためのコメントです。IDE のヒントやリファレンスに表示されます。

## 何をしているか

`min = '0'`（48）、`max = '9'`（57）として、右辺の `(uint)(max - min)` は 9 です。

- `c = '5'`（53）: `c - min = 5` → `5 <= 9` → **true**。
- `c = 'x'`（120）: `c - min = 72` → `72 <= 9` → **false**（上限を超えている）。
- `c = ' '`（空白、32）: `c - min = −16` → `(uint)` で 4294967280 → `<= 9` は **false**（下限を下回っている）。

つまり、

- `c < min` なら引き算が負になり、符号なしでは巨大な数になるので上限との比較で落ちる。
- `c > max` なら引き算の結果が `max - min` より大きくなるので落ちる。

という 2 つのケースが、1 回の比較でまとめて判定されています。

## ここがすごい

- **比較を 1 回にする**: `c >= min && c <= max` は 2 回の比較と、場合によっては分岐（`&&` の短絡評価）が必要です。この書き方は「引き算 1 回 + 比較 1 回」で、分岐が生まれません。
- **広く使われるイディオム**: .NET の標準ライブラリには、`(uint)index < (uint)length` で配列の添字が範囲内か確かめるなど、同じ考え方の書き方がたくさんあります。JIT コンパイラ自身も、`c >= 'a' && c <= 'z'` のような 2 回の比較を、この形に変換することがあります。
- **ドキュメントで前提を明記**: 382〜384 行目のコメントの通り、`max < min` のときの動作は未定義としています。チェックを入れると遅くなるので、呼び出し側の責任にして、その代わりにきちんと書き残しています。
- **`char` から `int` への自動拡張を利用**: `c - minInclusive` は `int` で計算されるので、`char` の範囲（0〜65535）の引き算は必ず正しい結果になり、オーバーフローの心配がありません。

## まとめ

- `(uint)(x - min) <= (uint)(max - min)` で、「min 以上 max 以下」を比較 1 回で判定できる。
- 符号なしにすると負の数は巨大な正の数になる、という性質を使う。
- 速さのために入力チェックを省くなら、前提をドキュメントにきちんと書く。
