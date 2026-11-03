---
title: "通算日数から年月日へ、割り算だけで戻す"
description: "calendar:gregorian_days_to_date/1 は、通算日数を西暦の年月日に戻す。Neri-Schneider の逆の手順を、紀元・年・月の順に割り算で求める。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/calendar.erl
lines: [306, 320]
function: "calendar:gregorian_days_to_date/1"
difficulty: 3
format: 2
tags: ["日時", "アルゴリズム", "数値計算"]
---
## ひとことで

`calendar:gregorian_days_to_date/1` は、通算日数を年・月・日に戻す関数です。前の記事の `date_to_gregorian_days` の逆の計算です。
基準日からの日数を、400 年の紀元、紀元の中の年、年の中の日と、段階的に割っていきます。

## コード

::: code-group

```erlang:line-numbers=306 [日本語訳]
gregorian_days_to_date(Days) ->
    %% Neri-Schneider のアルゴリズム。
    %% 紀元 0 年 3 月 1 日を基準の日にずらす。
    Z = Days - ?MARCH_1_YEAR_0,
    Era = if Z >= 0 -> Z div ?DAYS_PER_ERA; true -> (Z - ?DAYS_PER_ERA + 1) div ?DAYS_PER_ERA end,
    DayOfEra = Z - Era * ?DAYS_PER_ERA,
    YearOfEra = (DayOfEra - DayOfEra div ?DAYS_PER_4_YEARS + DayOfEra div ?DAYS_PER_100_YEARS
                 - DayOfEra div (?DAYS_PER_ERA - 1)) div ?DAYS_PER_YEAR,
    DayOfYear = DayOfEra - (?DAYS_PER_YEAR * YearOfEra + YearOfEra div 4 - YearOfEra div 100),
    MonthPrime = (?MONTHS_PER_CYCLE * DayOfYear + 2) div ?DAYS_PER_5_MONTHS,
    Day = DayOfYear - (?DAYS_PER_5_MONTHS * MonthPrime + 2) div ?MONTHS_PER_CYCLE + 1,
    Month = if MonthPrime < 10 -> MonthPrime + 3; true -> MonthPrime - 9 end,
    Y = YearOfEra + Era * ?YEARS_PER_ERA,
    Year = if Month =< 2 -> Y + 1; true -> Y end,
    {Year, Month, Day}.
```

```erlang:line-numbers=306 [原文]
gregorian_days_to_date(Days) ->
    %% Neri-Schneider algorithm.
    %% Shift to March 1, year 0 epoch.
    Z = Days - ?MARCH_1_YEAR_0,
    Era = if Z >= 0 -> Z div ?DAYS_PER_ERA; true -> (Z - ?DAYS_PER_ERA + 1) div ?DAYS_PER_ERA end,
    DayOfEra = Z - Era * ?DAYS_PER_ERA,
    YearOfEra = (DayOfEra - DayOfEra div ?DAYS_PER_4_YEARS + DayOfEra div ?DAYS_PER_100_YEARS
                 - DayOfEra div (?DAYS_PER_ERA - 1)) div ?DAYS_PER_YEAR,
    DayOfYear = DayOfEra - (?DAYS_PER_YEAR * YearOfEra + YearOfEra div 4 - YearOfEra div 100),
    MonthPrime = (?MONTHS_PER_CYCLE * DayOfYear + 2) div ?DAYS_PER_5_MONTHS,
    Day = DayOfYear - (?DAYS_PER_5_MONTHS * MonthPrime + 2) div ?MONTHS_PER_CYCLE + 1,
    Month = if MonthPrime < 10 -> MonthPrime + 3; true -> MonthPrime - 9 end,
    Y = YearOfEra + Era * ?YEARS_PER_ERA,
    Year = if Month =< 2 -> Y + 1; true -> Y end,
    {Year, Month, Day}.
```

:::

## 前提知識

- **通算日数**: 紀元 0 年 3 月 1 日を 0 とした日数です。
- **`div`**: 整数の割り算で、小数点以下を切り捨てます。
- **`rem` のような剰余**: この関数では、割り算の商を使って、残りを次の段階に回します。
- **`if` 式**: 値の条件分岐に使います。
- **マクロ**: `?DAYS_PER_ERA`（400 年の日数）や `?MONTHS_PER_CYCLE`（5 か月）などの定数です。

## 何をしているか

### 1. 基準日を合わせる

```erlang:line-numbers=309
    Z = Days - ?MARCH_1_YEAR_0,
```

まず、入力された通算日数から、基準日（`?MARCH_1_YEAR_0`）を引きます。以後は、紀元 0 年 3 月 1 日からの日数として扱います。

### 2. 紀元と、紀元の中の日数を求める

```erlang:line-numbers=310
    Era = if Z >= 0 -> Z div ?DAYS_PER_ERA; true -> (Z - ?DAYS_PER_ERA + 1) div ?DAYS_PER_ERA end,
    DayOfEra = Z - Era * ?DAYS_PER_ERA,
```

400 年（`?DAYS_PER_ERA` = 146097 日）ごとの紀元 `Era` を求めます。負の日数のときは、割り算の切り捨てがずれるので、補正の式を使います。余りが `DayOfEra` で、紀元の中の通算日数です。

### 3. 紀元の中の年を求める

```erlang:line-numbers=312
    YearOfEra = (DayOfEra - DayOfEra div ?DAYS_PER_4_YEARS + DayOfEra div ?DAYS_PER_100_YEARS
                 - DayOfEra div (?DAYS_PER_ERA - 1)) div ?DAYS_PER_YEAR,
```

`DayOfEra` から、4 年ごと、100 年ごと、400 年ごとの区切りを引き算します。その結果を 365 で割ると、紀元の中の年 `YearOfEra` になります。

### 4. 年の中の日と、月を求める

```erlang:line-numbers=314
    DayOfYear = DayOfEra - (?DAYS_PER_YEAR * YearOfEra + YearOfEra div 4 - YearOfEra div 100),
    MonthPrime = (?MONTHS_PER_CYCLE * DayOfYear + 2) div ?DAYS_PER_5_MONTHS,
    Day = DayOfYear - (?DAYS_PER_5_MONTHS * MonthPrime + 2) div ?MONTHS_PER_CYCLE + 1,
```

`DayOfYear` は、その年の 3 月 1 日からの通算日数です。`MonthPrime` は、5 か月ごとの周期を使って、3 月始まりの月を求めます。`Day` は、その月の中の日付です。

### 5. 年を元に戻す

```erlang:line-numbers=317
    Month = if MonthPrime < 10 -> MonthPrime + 3; true -> MonthPrime - 9 end,
    Y = YearOfEra + Era * ?YEARS_PER_ERA,
    Year = if Month =< 2 -> Y + 1; true -> Y end,
    {Year, Month, Day}.
```

3 月始まりの月番号を、1 月始まりの番号に戻します。1 月と 2 月は、ずらしてあった分だけ翌年に属するので、`Year` に 1 を足します。最後に、`{Year, Month, Day}` を返します。

## ここがすごい

### 逆の手順を、同じ定数で組み立てている

日付から日数を求める式と、日数から日付を求める式は、同じ定数を使います。順番を逆にしたものを、そのまま書いているので、2 つを組み合わせると元に戻ります。
定数を書き換えるときも、2 か所を同時に直すだけで済みます。

### 割り算の回数で、ループを避けている

日数を 1 日ずつ数えて日付を求めると、遠い過去では何万回もの繰り返しになります。この関数は、紀元、年、月の順に割り算を 4 回ほど行うだけで答えが出ます。
計算量が日数に依存しないので、どれだけ離れた日付でも同じ速さで答えられます。

## まとめ

- 日数から日付への変換も、紀元、年、月の順に割り算で求められます。
- 日付から日数への変換と、同じ定数を使うと、2 つの関数は互いに逆になります。
- ループを使わないので、遠い日付でも一定の時間で計算できます。
