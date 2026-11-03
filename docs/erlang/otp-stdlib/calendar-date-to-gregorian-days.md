---
title: "年月日から通算日数へ、うるう年の計算を 1 つの式にまとめる"
description: "calendar:date_to_gregorian_days/3 は、西暦の年月日を 0 年 1 月 1 日からの日数に変える。Neri-Schneider のアルゴリズムで、3 月を年の始まりにずらして、うるう年の処理を単純にしている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/calendar.erl
lines: [239, 248]
function: "calendar:date_to_gregorian_days/3"
difficulty: 3
format: 2
tags: ["日時", "アルゴリズム", "数値計算"]
---
## ひとことで

`calendar:date_to_gregorian_days/3` は、年・月・日の 3 つの値を、紀元 0 年 3 月 1 日からの通算日数に変えます。日付の差を計算したり、曜日を求めたりするときの土台になる値です。
うるう年や月の長さを、個別の表で調べることはしません。Neri-Schneider のアルゴリズムで、割り算と掛け算だけで答えを作ります。

## コード

::: code-group

```erlang:line-numbers=239 [日本語訳]
date_to_gregorian_days(Year, Month, Day) when is_integer(Day), Day > 0 ->
    %% Neri-Schneider のアルゴリズム。
    %% 年を 3 月始まりにずらす（うるう年を年の最後に寄せる）。
    Y = if Month =< 2 -> Year - 1; true -> Year end,
    Era = if Y >= 0 -> Y div ?YEARS_PER_ERA; true -> (Y - 399) div ?YEARS_PER_ERA end,
    YearOfEra = Y - Era * ?YEARS_PER_ERA,
    MonthPrime = if Month > 2 -> Month - 3; true -> Month + 9 end,
    DayOfYear = (?DAYS_PER_5_MONTHS * MonthPrime + 2) div ?MONTHS_PER_CYCLE + Day - 1,
    DayOfEra = ?DAYS_PER_YEAR * YearOfEra + YearOfEra div 4 - YearOfEra div 100 + DayOfYear,
    Era * ?DAYS_PER_ERA + DayOfEra + ?MARCH_1_YEAR_0.
```

```erlang:line-numbers=239 [原文]
date_to_gregorian_days(Year, Month, Day) when is_integer(Day), Day > 0 ->
    %% Neri-Schneider algorithm.
    %% Shift year so March is first month (simplifies leap year handling).
    Y = if Month =< 2 -> Year - 1; true -> Year end,
    Era = if Y >= 0 -> Y div ?YEARS_PER_ERA; true -> (Y - 399) div ?YEARS_PER_ERA end,
    YearOfEra = Y - Era * ?YEARS_PER_ERA,
    MonthPrime = if Month > 2 -> Month - 3; true -> Month + 9 end,
    DayOfYear = (?DAYS_PER_5_MONTHS * MonthPrime + 2) div ?MONTHS_PER_CYCLE + Day - 1,
    DayOfEra = ?DAYS_PER_YEAR * YearOfEra + YearOfEra div 4 - YearOfEra div 100 + DayOfYear,
    Era * ?DAYS_PER_ERA + DayOfEra + ?MARCH_1_YEAR_0.
```

:::

## 前提知識

- **うるう年**: 4 年に 1 回の年です。ただし 100 年に 1 回は平年で、400 年に 1 回はうるう年です。日数の計算は、この規則を正しく扱う必要があります。
- **通算日数**: ある基準日からの経過日数です。日付の引き算を、単純な整数の引き算に変えられます。
- **`div`**: 整数の割り算で、小数点以下を切り捨てます。
- **`rem`**: 割り算のあまりです。
- **`if ... -> ...; true -> ... end`**: 条件によって値を変える式です。Erlang では、`if` は式なので、結果を変数に入れられます。
- **マクロ `?DAYS_PER_ERA` など**: `-define` で決めた定数です。`?DAYS_PER_ERA` は 400 年の日数 146097 を表します。

## 何をしているか

### 1. 3 月を年の始まりにずらす

```erlang:line-numbers=242
    Y = if Month =< 2 -> Year - 1; true -> Year end,
```

1 月と 2 月は、前の年の後ろに付けて数えます。そうすると、うるう年の日（2 月 29 日）が、年の最後に来ます。
この 1 行で、うるう年の扱いを 1 か所にまとめています。

### 2. 400 年の周期を決める

```erlang:line-numbers=243
    Era = if Y >= 0 -> Y div ?YEARS_PER_ERA; true -> (Y - 399) div ?YEARS_PER_ERA end,
    YearOfEra = Y - Era * ?YEARS_PER_ERA,
```

ずらした年を 400 年ごとの「era（紀元）」に分けます。400 年の中での位置を `YearOfEra` で表します。`Y >= 0` でないときは、負の数の割り算が切り捨て方向にずれるので、別の式にしています。

### 3. 月を 3 月始まりで数える

```erlang:line-numbers=245
    MonthPrime = if Month > 2 -> Month - 3; true -> Month + 9 end,
    DayOfYear = (?DAYS_PER_5_MONTHS * MonthPrime + 2) div ?MONTHS_PER_CYCLE + Day - 1,
```

月の番号を、3 月を 0 とする数に変えます。`MonthPrime` は、3 月なら 0、4 月なら 1、というように数えます。`(153 * MonthPrime + 2) div 5` は、3 月から数えた月までの日数を求めます。`153` は、3 月から 7 月までの 5 か月の日数です。

### 4. 日数を合計する

```erlang:line-numbers=247
    DayOfEra = ?DAYS_PER_YEAR * YearOfEra + YearOfEra div 4 - YearOfEra div 100 + DayOfYear,
    Era * ?DAYS_PER_ERA + DayOfEra + ?MARCH_1_YEAR_0.
```

1 年ぶんの日数 `365` に、うるう年の分を `YearOfEra div 4`、`100` 年の分を `div 100` で足し引きします。そこに、この紀元の中の通算日数を加えます。最後に、紀元の日数と、基準日からの差 `?MARCH_1_YEAR_0` を足して、答えになります。

## ここがすごい

### うるう年の規則を、割り算の組み合わせで表している

素直に書くと、「4 で割り切れて、100 で割り切れなければ、400 で割り切れるときだけうるう年」という条件分岐が必要です。この関数は、`YearOfEra div 4 - YearOfEra div 100` の形で、その規則を直接数えています。
400 年の周期がそろうので、遠い過去や未来でも同じ式が使えます。

### 3 月始まりにする理由

1 月と 2 月を前の年に回すと、月ごとの日数の違いが 3 月から 7 月に連続して並びます。
そこで、月の日数を表にせず、`153` という 1 つの定数と割り算で表せるようになります。読み手にとっても、計算の意味がつかみやすくなります。

## まとめ

- うるう年の規則は、4、100、400 の割り算の組み合わせで表せます。
- 年の始まりを 3 月にずらすと、月の日数の計算が単純になります。
- 基準日を決めておけば、日付の差は整数の引き算として扱えます。
