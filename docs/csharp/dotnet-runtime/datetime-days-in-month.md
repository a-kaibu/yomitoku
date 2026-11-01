---
title: "月の日数を、うるう年かどうかで表から選んで求める"
description: ".NET の DateTime.DaysInMonth。うるう年かどうかで 2 つの表を切り替え、月の番号で日数を引く。2 月だけを特別扱いする条件分岐を書かずに済ませる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/DateTime.cs
lines: [1151, 1156]
function: "DateTime.DaysInMonth(int, int)"
difficulty: 1
format: 2
tags: [日時, 数値計算, 可読性]
---

## ひとことで

`DateTime.DaysInMonth(year, month)` は、指定した年と月の **日数** を返します。
たとえば `DaysInMonth(2024, 2)` は `29`（2024 年はうるう年）、`DaysInMonth(2023, 2)` は `28` です。

月の日数は、大半の月は決まっていますが、2 月だけはうるう年によって変わります。この関数は、その違いを 2 つの表で表しています。

## コード

::: code-group

```csharp:line-numbers=1151 [日本語訳]
        public static int DaysInMonth(int year, int month)
        {
            if (month < 1 || month > 12) ThrowHelper.ThrowArgumentOutOfRange_Month(month);
            // IsLeapYear が年の値を確かめるので、ここでは年の検査を重ねない。
            return (IsLeapYear(year) ? DaysInMonth366 : DaysInMonth365)[month - 1];
        }
```

```csharp:line-numbers=1151 [原文]
        public static int DaysInMonth(int year, int month)
        {
            if (month < 1 || month > 12) ThrowHelper.ThrowArgumentOutOfRange_Month(month);
            // IsLeapYear checks the year argument
            return (IsLeapYear(year) ? DaysInMonth366 : DaysInMonth365)[month - 1];
        }
```

:::

## 前提知識

- **うるう年**: 2 月が 29 日まである年です。西暦が 4 で割り切れる年（ただし 100 で割り切れて 400 で割り切れない年は除く）です。
- **表（配列）による引き当て**: 月の番号を添字にして、その月の日数を配列から読む方法です。条件分岐を並べずに済みます。
- **`ReadOnlySpan<byte>`**: 読み取り専用で、配列の一部を指す型です。定数の表を、余分なコピーなしで扱えます。
- **月の番号**: 1 月が 1、12 月が 12 です。表の添字は 0 から始まるので、`month - 1` で引きます。
- **`ThrowHelper`**: 例外を投げる処理をまとめた補助の仕組みです。

## 何をしているか

### 1. 月の範囲を確かめる

```csharp:line-numbers=1153
            if (month < 1 || month > 12) ThrowHelper.ThrowArgumentOutOfRange_Month(month);
```

月が 1 から 12 の範囲にないと、例外を投げます。

### 2. うるう年かどうかで表を選ぶ

```csharp:line-numbers=1154
            // IsLeapYear が年の値を確かめるので、ここでは年の検査を重ねない。
            return (IsLeapYear(year) ? DaysInMonth366 : DaysInMonth365)[month - 1];
```

`IsLeapYear(year)` で、うるう年なら 366 日用の表を、そうでなければ 365 日用の表を選びます。その表を `month - 1` の添字で読みます。

### 3. 2 つの表

```csharp:line-numbers=111
        private static ReadOnlySpan<byte> DaysInMonth365 => [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        private static ReadOnlySpan<byte> DaysInMonth366 => [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
```

365 日用の表では 2 月が 28、366 日用の表では 2 月が 29 です。それ以外の月は、どちらの表でも同じ日数です。

## ここがすごい

- **分岐が 1 か所だけ**: うるう年の判定は 1 回だけ行い、あとは表を読むだけです。月ごとの条件分岐が要りません。
- **表は読み取り専用**: `ReadOnlySpan` を使うので、表を書き換える心配がなく、コピーも発生しません。
- **月の範囲を先に検査する**: 13 月などの間違った入力を、表の範囲外アクセスより前に見つけられます。
- **うるう年の判定を再利用**: 同じ判定の関数を、日付の計算の別の場所でも使っています。

## まとめ

- `DaysInMonth` は、うるう年かどうかで 2 つの表を選び、月の番号で日数を読む。
- 2 月の違いだけを表で表し、分岐を 1 か所にまとめる。
- 月の範囲を先に確かめ、不正な入力を早く知らせる。
