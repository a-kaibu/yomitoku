---
title: "割り算をほぼ使わずに日数から年月日を求める最新アルゴリズム"
description: "DateTime の内部の日数から年・月・日を一度に求める GetDate。2021 年の論文の「ユークリッド的アフィン関数」を使い、3 月始まりの暦に置き換えて掛け算とシフトで計算する。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/DateTime.cs
lines: [1348, 1374]
function: "DateTime.GetDate"
difficulty: 3
format: 2
tags: [日時, 数値計算, アルゴリズム]
---

## ひとことで

`GetDate` は、`DateTime` が内部に持っている「西暦 1 年 1 月 1 日からの時間」から、**年・月・日** を求める関数です。
うるう年や月ごとの日数の違いがあるので、素直に書くと「1 年ずつ引いていく」「月の日数表と比べる」といった処理になりがちですが、この関数は **ほぼ掛け算とシフトだけ** で 3 つを同時に出します。

コメントにある通り、Cassio Neri と Lorenz Schneider による 2021 年の論文の手法が使われています。

## コード

::: code-group

```csharp:line-numbers=1348 [日本語訳]
        // Year・Month・Day プロパティと同じ結果だが、
        // 1 つだけでなく年・月・日を一度に計算する。
        // 3 つすべてが必要なとき、それぞれを計算し直さないために使う。
        //
        // 実装は次の論文に基づく: https://arxiv.org/pdf/2102.06959.pdf
        //   Cassio Neri, Lorenz Schneider - Euclidean Affine Functions and Applications to Calendar Algorithms - 2021（論文題名）
        internal void GetDate(out int year, out int month, out int day) => GetDate(_dateData, out year, out month, out day);
        private static void GetDate(ulong dateData, out int year, out int month, out int day)
        {
            // y100 = 3/1/0000 からの 100 年単位の数
            // r1 = 100 年周期の中での日数 × 4
            (uint y100, uint r1) = Math.DivRem(((uint)((dateData & TicksMask) / TicksPer6Hours) | 3U) + 1224, DaysPer400Years);
            ulong u2 = Math.BigMul(EafMultiplier, r1 | 3U);
            uint daySinceMarch1 = (uint)u2 / EafDivider;
            uint n3 = 2141 * daySinceMarch1 + 197913;
            year = (int)(100 * y100 + (uint)(u2 >> 32));
            // 月と日を計算する
            month = (int)(n3 >> 16);
            day = (ushort)n3 / 2141 + 1;

            // 12 月 31 日からの繰り上がり
            if (daySinceMarch1 >= March1BasedDayOfNewYear)
            {
                ++year;
                month -= 12;
            }
        }
```

```csharp:line-numbers=1348 [原文]
        // Exactly the same as Year, Month, Day properties, except computing all of
        // year/month/day rather than just one of them. Used when all three
        // are needed rather than redoing the computations for each.
        //
        // Implementation based on article https://arxiv.org/pdf/2102.06959.pdf
        //   Cassio Neri, Lorenz Schneider - Euclidean Affine Functions and Applications to Calendar Algorithms - 2021
        internal void GetDate(out int year, out int month, out int day) => GetDate(_dateData, out year, out month, out day);
        private static void GetDate(ulong dateData, out int year, out int month, out int day)
        {
            // y100 = number of whole 100-year periods since 3/1/0000
            // r1 = (day number within 100-year period) * 4
            (uint y100, uint r1) = Math.DivRem(((uint)((dateData & TicksMask) / TicksPer6Hours) | 3U) + 1224, DaysPer400Years);
            ulong u2 = Math.BigMul(EafMultiplier, r1 | 3U);
            uint daySinceMarch1 = (uint)u2 / EafDivider;
            uint n3 = 2141 * daySinceMarch1 + 197913;
            year = (int)(100 * y100 + (uint)(u2 >> 32));
            // compute month and day
            month = (int)(n3 >> 16);
            day = (ushort)n3 / 2141 + 1;

            // rollover December 31
            if (daySinceMarch1 >= March1BasedDayOfNewYear)
            {
                ++year;
                month -= 12;
            }
        }
```

:::

使われている定数は同じファイルで次のように定義されています。

```csharp:line-numbers=102
        private const uint EafMultiplier = (uint)(((1UL << 32) + DaysPer4Years - 1) / DaysPer4Years);   // 2,939,745
        private const uint EafDivider = EafMultiplier * 4;                                              // 11,758,980

        private const ulong TicksPer6Hours = TimeSpan.TicksPerHour * 6;
        private const int March1BasedDayOfNewYear = 306;              // Days between March 1 and January 1
```

## 前提知識

- **tick**: .NET の時間の単位で、100 ナノ秒です。`DateTime` は「西暦 1 年 1 月 1 日 0 時から何 tick 経ったか」を 64 ビット整数 `_dateData` に持っています（上位 2 ビットは UTC かローカルかの情報なので `& TicksMask` で取り除きます）。
- **`out` 引数**: `out int year` は「呼び出し元の変数に結果を書き込む」引数です。複数の値を返したいときに使います。
- **タプルの分解**: `(uint y100, uint r1) = Math.DivRem(a, b);` は、商と余りを 2 つの変数で同時に受け取る書き方です。
- **`Math.BigMul(a, b)`**: 32 ビット同士を掛けて、あふれない 64 ビットの結果を返します。
- **`>> 32`、`>> 16`、`(ushort)`**: それぞれ「上位 32 ビットを取る」「上位 16 ビットを取る」「下位 16 ビットだけを残す」操作です。

## 何をしているか

### 1. 3 月 1 日始まりの暦に置き換える

```csharp:line-numbers=1359
            (uint y100, uint r1) = Math.DivRem(((uint)((dateData & TicksMask) / TicksPer6Hours) | 3U) + 1224, DaysPer400Years);
```

うるう日（2 月 29 日）が「年の最後」に来るよう、**3 月 1 日を年の始まり** とみなします。そうすると月の日数は 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 31, (28 か 29) と規則的になり、うるう年の影響は最後の月だけに閉じ込められます。

tick を 6 時間単位にすると「日数 × 4 + 時刻」になり、`| 3` で時刻の部分をそろえます。`+ 1224`（= 306 × 4）は、西暦 0 年 3 月 1 日から 1 年 1 月 1 日までの 306 日ぶんです。これを 400 年の日数（146097）で割ると、商が「100 年単位の数」、余りが「その 100 年の中での位置 × 4」になります。

### 2. 100 年の中の年と日を 1 回の掛け算で

```csharp:line-numbers=1360
            ulong u2 = Math.BigMul(EafMultiplier, r1 | 3U);
            uint daySinceMarch1 = (uint)u2 / EafDivider;
            uint n3 = 2141 * daySinceMarch1 + 197913;
            year = (int)(100 * y100 + (uint)(u2 >> 32));
```

4 年の日数（1461）の逆数を固定小数点で表した `EafMultiplier` を掛けると、64 ビットの結果の **上位 32 ビットに「何年目か」、下位 32 ビットに「その年の中の位置」** が入ります。下位を `EafDivider` で割ると、3 月 1 日から何日目か（`daySinceMarch1`）がわかります。

### 3. 月と日を 1 つの式で

`n3 = 2141 × 日 + 197913` の上位 16 ビットが月、下位 16 ビットを 2141 で割ったものが日になります。3 月 1 日（日 = 0）なら `n3 = 197913`、`197913 >> 16 = 3`（3 月）、下位は 1305 で `1305 / 2141 = 0`、つまり 1 日です。

### 4. 1 月と 2 月の補正

```csharp:line-numbers=1369
            if (daySinceMarch1 >= March1BasedDayOfNewYear)
            {
                ++year;
                month -= 12;
            }
```

3 月始まりの暦では 1 月・2 月は「13 月・14 月」として出てくるので、306 日目（1 月 1 日）以降なら年を 1 つ進め、月から 12 を引きます。

実際に 2024 年 1 月 15 日で計算すると、`daySinceMarch1 = 320`、`n3 >> 16 = 13` となり、補正で 2024 年 1 月になります。

## ここがすごい

- **割り算を掛け算に置き換える**: 400 年で割る 1 回を除けば、残りは掛け算・シフト・定数での割り算（コンパイラが掛け算に置き換えられる）だけです。年・月・日を別々に求めると同じ計算を何度もすることになりますが、まとめて 1 回で出しています。
- **3 月始まりという発想**: うるう日を年の最後に回すことで、月の計算から例外をなくしています。古くからある暦計算の工夫を、最新の論文の手法と組み合わせています。
- **係数 2141 と 197913**: 月の長さ 30.6 日をうまく近似する 1 次式で、表を引かずに月と日を同時に出しています。
- **出典を明記**: 論文の URL がコメントにあるので、魔法の数字の根拠をたどれます。

## まとめ

- 暦の計算は、年の始まりを 3 月にするとうるう年の扱いが単純になる。
- 「整数 × 固定小数点の逆数」で、商（上位ビット）と余り（下位ビット）を同時に得られる。
- 研究で見つかった新しいアルゴリズムが、標準ライブラリにすぐ取り込まれることもある。
