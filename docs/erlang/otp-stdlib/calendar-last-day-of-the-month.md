---
title: "月の日数を、表ではなく規則で決める"
description: "calendar:last_day_of_the_month/2 は、年と月から、その月の最終日を返す。4、6、9、11 月は 30 日、2 月は閏年なら 29 日、それ以外は 31 日で、節の並びで場合分けしている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/calendar.erl
lines: [410, 424]
function: "calendar:last_day_of_the_month/2"
difficulty: 1
format: 2
tags: ["日時", "イディオム", "標準ライブラリ"]
---
## ひとことで

`calendar:last_day_of_the_month/2` は、年と月を受け取り、その月の最後の日（日数）を返します。たとえば 2026 年 2 月なら 28、2028 年 2 月なら 29 です。
月の日数を、大きな表で持つのではなく、月の番号と閏年の判定だけで決めています。

## コード

```erlang:line-numbers=410
last_day_of_the_month(Y, M) when is_integer(Y) ->
    last_day_of_the_month1(Y, M).

-spec last_day_of_the_month1(year(),month()) -> ldom().
last_day_of_the_month1(_, 4) -> 30;
last_day_of_the_month1(_, 6) -> 30;
last_day_of_the_month1(_, 9) -> 30;
last_day_of_the_month1(_,11) -> 30;
last_day_of_the_month1(Y, 2) ->
   case is_leap_year(Y) of
      true -> 29;
      _    -> 28
   end;
last_day_of_the_month1(_, M) when is_integer(M), M > 0, M < 13 ->
    31.
```

## 前提知識

- **月の日数の規則**: 4、6、9、11 月は 30 日です。2 月は 28 日か 29 日です。それ以外は 31 日です。
- **閏年**: 4 で割り切れる年がうるう年です。ただし 100 で割り切れる年は平年で、400 で割り切れる年はうるう年です。
- **`is_leap_year/1`**: 同じ `calendar` モジュールにある、閏年かどうかを判定する関数です。
- **関数の節の順番**: 上から順に試され、最初に一致した節が使われます。`_` は、どの値でもよいという意味です。
- **`when M > 0, M < 13`**: 月が 1 から 12 までの範囲にあるかを、ガードで確かめます。

## 何をしているか

### 1. 30 日の月

```erlang:line-numbers=414
last_day_of_the_month1(_, 4) -> 30;
last_day_of_the_month1(_, 6) -> 30;
last_day_of_the_month1(_, 9) -> 30;
last_day_of_the_month1(_,11) -> 30;
```

4、6、9、11 月は、どの年でも 30 日です。年は使わないので、`_` で受け流します。

### 2. 2 月

```erlang:line-numbers=418
last_day_of_the_month1(Y, 2) ->
   case is_leap_year(Y) of
      true -> 29;
      _    -> 28
   end;
```

2 月だけは、年によって日数が変わります。`is_leap_year/1` で閏年かを調べ、閏年なら 29、そうでなければ 28 を返します。

### 3. その他の月

```erlang:line-numbers=423
last_day_of_the_month1(_, M) when is_integer(M), M > 0, M < 13 ->
    31.
```

残りの月は、範囲（1 から 12）の確認のあとで、31 を返します。範囲外の月は、どの節にも一致しないので、例外になります。

## ここがすごい

### 表の代わりに、節の並べ方で規則を書く

12 か月ぶんの日数を、リストや表で持つこともできます。しかしこの関数は、「30 日の月は並べて書き、2 月は別に扱い、残りは 31」という規則を、節の並びで表しています。
どの月がどの値になるかが、節を読むだけで分かります。

### 閏年の判定だけは、別の関数に任せる

2 月の日数は、閏年の規則に依存します。その判定は `is_leap_year/1` に任せ、この関数は月の規則だけに集中しています。
関係するものを 1 か所にまとめ、役割を分けるのが、読みやすさの理由です。

## まとめ

- 月の日数は、表を持たずに、月の番号と閏年の判定だけで求められます。
- 節の並べ方で、同じ値になる月をまとめると、規則が一目で読めます。
- 閏年の判定を別の関数に任せると、日付の規則を分けて考えられます。

利用例として、`calendar:last_day_of_the_month(2028, 2)` は 29 を返し、`calendar:last_day_of_the_month(2027, 2)` は 28 を返します。同じ関数が、閏年の 2 月を正しく扱えることが分かります。
