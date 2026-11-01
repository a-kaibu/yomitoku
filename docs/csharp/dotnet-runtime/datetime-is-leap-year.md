---
title: "うるう年判定を「4・16・25」で割るだけにする"
description: "DateTime.IsLeapYear は、4・100・400 で割る代わりに、ビット演算で 4 と 16 の倍数を調べ、最後に 25 で割る 1 回だけで判定する。数学的に同じ結果になる理由を読む。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/DateTime.cs
lines: [1551, 1564]
function: "DateTime.IsLeapYear"
difficulty: 1
format: 2
tags: [日時, ビット演算, 最適化]
---

## ひとことで

`IsLeapYear(year)` は、西暦 `year` 年が **うるう年かどうか** を返します。2024 年は true、2023 年は false、1900 年は false、2000 年は true です。

教科書どおりなら「4 で割り切れ、かつ 100 で割り切れない、または 400 で割り切れる」と 3 回割り算をしますが、この関数は **ビット演算 2 回と割り算 1 回** で同じ判定をしています。

## コード

::: code-group

```csharp:line-numbers=1551 [日本語訳]
        // 与えられた年がうるう年かどうかを判定する。
        // うるう年なら true、そうでなければ false を返す。
        //
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static bool IsLeapYear(int year)
        {
            if (year < 1 || year > 9999)
            {
                ThrowHelper.ThrowArgumentOutOfRange_Year();
            }
            if ((year & 3) != 0) return false;
            if ((year & 15) == 0) return true;
            return (uint)year % 25 != 0;
        }
```

```csharp:line-numbers=1551 [原文]
        // Checks whether a given year is a leap year. This method returns true if
        // year is a leap year, or false if not.
        //
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static bool IsLeapYear(int year)
        {
            if (year < 1 || year > 9999)
            {
                ThrowHelper.ThrowArgumentOutOfRange_Year();
            }
            if ((year & 3) != 0) return false;
            if ((year & 15) == 0) return true;
            return (uint)year % 25 != 0;
        }
```

:::

## 前提知識

- **うるう年の規則**: 4 で割り切れる年はうるう年。ただし 100 で割り切れる年は平年。ただし 400 で割り切れる年はうるう年。
- **`year & 3`**: `&` はビットごとの AND です。3 は 2 進数で `11` なので、`year & 3` は下位 2 ビット、つまり **4 で割った余り** と同じです。同じように `year & 15` は **16 で割った余り** です（2 のべき乗での割り算の余りは、ビット演算で求められます）。
- **`ThrowHelper.ThrowArgumentOutOfRange_Year()`**: 例外を投げる専用の関数です。例外を作るコードを別の関数に追い出すことで、この関数を小さく保ち、インライン化しやすくしています。
- **`(uint)year % 25`**: 符号なしにしてから割り算しています。負の数の考慮がいらない分、CPU の命令が少し単純になります。

## 何をしているか

### 1. 4 の倍数でなければ平年

```csharp:line-numbers=1561
            if ((year & 3) != 0) return false;
```

ほとんどの年（4 分の 3）はここで終わります。2023 年は `2023 & 3 = 3` なので false です。

### 2. 16 の倍数ならうるう年

```csharp:line-numbers=1562
            if ((year & 15) == 0) return true;
```

ここがおもしろいところです。16 の倍数の年は、もし 100 で割り切れたとしても、100 = 4 × 25 なので「16 の倍数かつ 25 の倍数」= 400 の倍数になります。つまり **16 の倍数は必ずうるう年** です。2000 年は 2000 = 16 × 125 なので true です。

### 3. 残りは 25 で割り切れるかで決まる

```csharp:line-numbers=1563
            return (uint)year % 25 != 0;
```

ここに来るのは「4 の倍数だが 16 の倍数ではない」年です。このとき、

- 25 で割り切れる → 100 の倍数だが、16 の倍数でないので 400 の倍数ではない → **平年**（1900 年など）
- 25 で割り切れない → 100 の倍数ではない → **うるう年**（2024 年など）

1900 = 4 × 475 で 16 の倍数ではなく、25 で割り切れるので false。2024 = 4 × 506 で 16 の倍数ではなく（2024 & 15 = 8）、25 で割り切れないので true です。

## ここがすごい

- **100 と 400 を 25 と 16 に分解**: 100 = 4 × 25、400 = 16 × 25 という関係を使い、2 のべき乗の部分（4 と 16）をビット演算に、残りの 25 を割り算 1 回に分けています。
- **よくある順に判定**: 4 の倍数でない年（75%）が最初の 1 行で終わり、16 の倍数（約 6%）も 2 つ目の if で終わります。割り算が必要なのは残りの年だけです。
- **定数での割り算はさらに速い**: `% 25` は定数での割り算なので、JIT は掛け算とシフトに置き換えられます。結果として、この関数には遅い割り算命令が 1 つも出てきません。
- **入力チェックは別関数に**: 例外を投げる部分を ThrowHelper に任せることで、関数本体が小さくなり `AggressiveInlining` が効きやすくなっています。.NET の標準ライブラリ全体で使われている書き方です。

## まとめ

- 2 のべき乗での余りは `& (2ⁿ − 1)` で求められる。
- 割る数を素因数に分けると、ビット演算で済む部分と割り算が必要な部分に分けられる。
- 条件は「よく当てはまるもの」から順に判定すると、平均的に速くなる。
