---
title: "日付の通し番号から、曜日を 1 回の剰余で求める"
description: ".NET の DateTime.DayOfWeek。0001 年 1 月 1 日からの経過日数に 1 を足し、7 で割った余りを曜日の番号にする。日曜日を 0 とする DayOfWeek の並びに合わせた計算。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/DateTime.cs
lines: [1435, 1435]
function: "DateTime.DayOfWeek"
difficulty: 1
format: 2
tags: [日時, 数値計算, 可読性]
---

## ひとことで

`DateTime.DayOfWeek` は、その日付が **何曜日か** を返す値です。
たとえば `DayOfWeek.Monday` や `DayOfWeek.Sunday` のように、列挙型（enum）の値で返ります。

曜日を計算するために、暦の表や長い条件分岐は使わず、**経過日数を 7 で割った余り** だけで求めています。

## コード

```csharp:line-numbers=1435
        public DayOfWeek DayOfWeek => (DayOfWeek)(((uint)(UTicks / TimeSpan.TicksPerDay) + 1) % 7);
```

## 前提知識

- **tick**: `DateTime` の時刻の単位です。1 日は `TimeSpan.TicksPerDay` 個の tick です。
- **`UTicks`**: 0001 年 1 月 1 日 0 時からの tick の数です。この値を 1 日の tick 数で割ると、経過日数になります。
- **剰余（`%`）**: 割り算の余りです。7 で割った余りは、0 から 6 のどれかになり、曜日の循環を表せます。
- **`DayOfWeek` 列挙型**: `Sunday = 0`, `Monday = 1`, …, `Saturday = 6` と番号が決まっています。
- **0001 年 1 月 1 日**: この日は月曜日です。そのため、経過日数 0 が月曜日になります。

## 何をしているか

### 1. 経過日数を求める

```csharp:line-numbers=1435
        public DayOfWeek DayOfWeek => (DayOfWeek)(((uint)(UTicks / TimeSpan.TicksPerDay) + 1) % 7);
```

`UTicks / TimeSpan.TicksPerDay` で、0001 年 1 月 1 日からの経過日数（整数）を求めます。小数の部分は切り捨てられます。

### 2. 1 を足して 7 で割る

経過日数に 1 を足し、7 で割った余りを求めます。0001 年 1 月 1 日（経過 0 日）は、`(0 + 1) % 7 = 1` になり、`Monday` に対応します。

### 3. 列挙型に変換する

求めた余りを `DayOfWeek` に変換して返します。`(uint)` でキャストしてから計算するのは、負の値を出さないようにするためです。

### 具体例で確かめる

```
経過 0 日 → (0 + 1) % 7 = 1 → Monday
経過 6 日 → (6 + 1) % 7 = 0 → Sunday
経過 7 日 → (7 + 1) % 7 = 1 → Monday
```

週は 7 日で繰り返すので、どの日付でも、この剰余で正しい曜日が求まります。

## ここがすごい

- **割り算 1 回で済む**: 暦の月や年を数えずに、経過日数だけで曜日が決まります。
- **基準日の選び方が巧み**: 0 日目を月曜日に合わせたので、1 を足すだけで日曜日を 0 にできます。
- **`uint` で符号を避ける**: 符号付きの剰余は、負の値になる危険があります。`uint` に直してから計算しています。
- **プロパティの中で完結**: 利用する側は、ただ `DayOfWeek` を読むだけで、計算の詳細を意識しなくてよいです。

## まとめ

- `DayOfWeek` は、経過日数に 1 を足して 7 で割った余りで求める。
- 0001 年 1 月 1 日が月曜日なので、その基準に合わせて 1 を足している。
- 符号を避けるため `uint` で計算し、結果を `DayOfWeek` の番号として返す。
