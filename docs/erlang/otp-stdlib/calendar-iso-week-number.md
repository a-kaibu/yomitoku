---
title: "年をまたぐ日の ISO 週番号を、前後の年の始まりと比べて決める"
description: "calendar:iso_week_number/1 は、日付の ISO 週番号を求める。年の初めの週がいつかを先に計算し、その日が今年・前年・翌年のどこに入るかで、答えの年と週を決める。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/calendar.erl
lines: [378, 398]
function: "calendar:iso_week_number/1"
difficulty: 3
format: 2
tags: ["日時", "アルゴリズム"]
---
## ひとことで

`calendar:iso_week_number/1` は、ISO 8601 の方式で、日付がその年の何週目かを返します。戻り値は `{年, 週番号}` の組です。
ISO の週は、月曜から始まります。年の初めの第 1 週は、木曜日を含む週と決まっています。そのため、年末の日が翌年の第 1 週になることもあり、年の境目の扱いが少し難しくなります。

## コード

::: code-group

```erlang:line-numbers=378 [日本語訳]
iso_week_number({Year, Month, Day}) ->
    D = date_to_gregorian_days({Year, Month, Day}),
    W01_1_Year = gregorian_days_of_iso_w01_1(Year),
    W01_1_NextYear = gregorian_days_of_iso_w01_1(Year + 1),
    if W01_1_Year =< D andalso D < W01_1_NextYear ->
	    % 今年の第 1 週から第 52 週（または 53 週）
	    {Year, (D - W01_1_Year) div 7 + 1};
	D < W01_1_Year ->
	    % 前の年の第 52 週か 53 週
	    PWN = case day_of_the_week(Year - 1, 1, 1) of
		4 -> 53;
		_ -> case day_of_the_week(Year - 1, 12, 31) of
			4 -> 53;
			_ -> 52
		     end
		end,
	    {Year - 1, PWN};
	W01_1_NextYear =< D ->
	    % 翌年の第 1 週
	    {Year + 1, 1}
    end.
```

```erlang:line-numbers=378 [原文]
iso_week_number({Year, Month, Day}) ->
    D = date_to_gregorian_days({Year, Month, Day}),
    W01_1_Year = gregorian_days_of_iso_w01_1(Year),
    W01_1_NextYear = gregorian_days_of_iso_w01_1(Year + 1),
    if W01_1_Year =< D andalso D < W01_1_NextYear ->
	    % Current Year Week 01..52(,53)
	    {Year, (D - W01_1_Year) div 7 + 1};
	D < W01_1_Year ->
	    % Previous Year 52 or 53
	    PWN = case day_of_the_week(Year - 1, 1, 1) of
		4 -> 53;
		_ -> case day_of_the_week(Year - 1, 12, 31) of
			4 -> 53;
			_ -> 52
		     end
		end,
	    {Year - 1, PWN};
	W01_1_NextYear =< D ->
	    % Next Year, Week 01
	    {Year + 1, 1}
    end.
```

:::

## 前提知識

- **ISO 週番号**: 月曜日から始まる週で数えた番号です。第 1 週は、その年の木曜日を含む最初の週と決まっています。
- **年またぎ**: 12 月末の日が翌年の第 1 週に、1 月初めの日が前年の第 52 週か 53 週になることがあります。
- **`date_to_gregorian_days/3`**: 年月日を、通算日数に変えます。前の記事で見た関数です。
- **`gregorian_days_of_iso_w01_1/1`**: その年の第 1 週の初日（月曜日）の通算日数を求める補助関数です。
- **`day_of_the_week/3`**: 曜日を 1（月）から 7（日）の数で返します。
- **`andalso`**: 両方が真のときだけ真になる演算子です。

## 何をしているか

### 1. 今年の週に入るとき

```erlang:line-numbers=379
    D = date_to_gregorian_days({Year, Month, Day}),
    W01_1_Year = gregorian_days_of_iso_w01_1(Year),
    W01_1_NextYear = gregorian_days_of_iso_w01_1(Year + 1),
```

まず、日付の通算日数 `D` を求めます。さらに、今年と翌年の第 1 週の初日を求めます。

```erlang:line-numbers=382
    if W01_1_Year =< D andalso D < W01_1_NextYear ->
	    % Current Year Week 01..52(,53)
	    {Year, (D - W01_1_Year) div 7 + 1};
```

日付が、今年の第 1 週の初日以上で、翌年の第 1 週の初日より前なら、その年の中にあります。週番号は、初日からの日数を 7 で割った商に 1 を足した値です。

### 2. 前の年の最後の週に入るとき

```erlang:line-numbers=385
	D < W01_1_Year ->
	    % Previous Year 52 or 53
	    PWN = case day_of_the_week(Year - 1, 1, 1) of
		4 -> 53;
		_ -> case day_of_the_week(Year - 1, 12, 31) of
			4 -> 53;
			_ -> 52
		     end
		end,
	    {Year - 1, PWN};
```

日付が今年の第 1 週より前なら、前の年の最後の週に属します。前の年の第 53 週があるかを、前の年の 1 月 1 日か 12 月 31 日が木曜日なら、前の年は 53 週あります。そうでなければ 52 週です。その週番号を答えにします。

### 3. 翌年の第 1 週に入るとき

```erlang:line-numbers=395
	W01_1_NextYear =< D ->
	    % Next Year, Week 01
	    {Year + 1, 1}
```

日付が翌年の第 1 週の初日以上なら、翌年の第 1 週になります。戻り値は `{Year + 1, 1}` です。

## ここがすごい

### 年の境目を、通算日数の比較だけで扱う

年またぎの判定を、年の数字だけで決めると、間違いやすくなります。この関数は、日付を通算日数に直して、第 1 週の初日と比べます。
その結果、12 月末や 1 月初めの日も、同じ比較の 3 つの場合で正しく分かれます。

### 53 週があるかを、曜日の組み合わせで決める

ISO の年には、52 週の年と 53 週の年があります。その違いは、年の初めと終わりの曜日で決まります。
この関数は、前の年の 1 月 1 日と 12 月 31 日の曜日を見るだけで、53 週かどうかを判定しています。

## まとめ

- ISO 週番号は、年の第 1 週の初日を先に求めると、年の境目を正しく扱えます。
- 日付は通算日数に変えて比べると、年またぎの判定が簡単になります。
- 53 週の年は、年の初めと終わりの曜日で決まります。
