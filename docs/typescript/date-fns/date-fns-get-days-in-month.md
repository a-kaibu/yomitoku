---
title: "来月の 0 日目を使って、今月の最終日を求める"
description: "date-fns の getDaysInMonth。月ごとの日数表を持たず、翌月の 0 日（＝今月の末日）を作って日付を読むことで、うるう年も含めて日数を求める。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/getDaysInMonth/index.ts
lines: [28, 39]
function: "getDaysInMonth"
difficulty: 2
format: 2
tags: [日時, イディオム, 数値計算]
---

## ひとことで

`getDaysInMonth(date)` は、その日付が属する月の日数を返す関数です。`2026-02` なら `28`、`2028-02` なら `29` を返します。日数を書いた表を持たず、「日付 0 の作り方」だけで答えを出しているのが特徴です。

```ts
getDaysInMonth(new Date(2028, 1, 10)) // 29（うるう年の 2 月）
getDaysInMonth(new Date(2026, 3, 1))  // 30（4 月）
```

## コード

```ts:line-numbers=28
export function getDaysInMonth(
  date: DateArg<Date> & {},
  options?: GetDaysInMonthOptions | undefined,
): number {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const monthIndex = _date.getMonth();
  const lastDayOfMonth = constructFrom(_date, 0);
  lastDayOfMonth.setFullYear(year, monthIndex + 1, 0);
  lastDayOfMonth.setHours(0, 0, 0, 0);
  return lastDayOfMonth.getDate();
}
```

## 前提知識

- **月は 0 から数える**: JavaScript の `Date` では、月を `0`（1 月）から `11`（12 月）で表します。`getMonth()` の値に `1` を足すと、次の月になります。
- **日付の 0 日**: `new Date(2026, 4, 0)` のように日を `0` にすると、1 日前の日、つまり前の月の最終日になります。これは JavaScript の `Date` の仕様です。
- **`setFullYear(年, 月, 日)`**: 年・月・日をまとめて設定するメソッドです。
- **`getDate()`**: その日付の「日」の部分（1〜31）を返します。
- **タイムゾーンと時刻**: 日付には時刻も含まれます。`setHours(0, 0, 0, 0)` は、時刻を真夜中にそろえるための処理です。
- **`constructFrom`**: 元の日付と同じ種類（`Date` や別のタイムゾーン付きの日付）で、新しい日付を作るための date-fns の内部関数です。

## 何をしているか

### 1. 年と月を取り出す

```ts:line-numbers=33
  const year = _date.getFullYear();
  const monthIndex = _date.getMonth();
```

調べたい日付の年と、月（0 から数えた番号）を取り出します。

### 2. 翌月の 0 日を作る

```ts:line-numbers=35
  const lastDayOfMonth = constructFrom(_date, 0);
  lastDayOfMonth.setFullYear(year, monthIndex + 1, 0);
```

`monthIndex + 1` は翌月の番号です。その月の「0 日」は、今月の最終日になります。2 月なら、3 月の 0 日、つまり 2 月 28 日（うるう年なら 29 日）です。

### 3. 時刻をそろえて、日を読む

```ts:line-numbers=37
  lastDayOfMonth.setHours(0, 0, 0, 0);
  return lastDayOfMonth.getDate();
```

時刻を真夜中にそろえてから、`getDate()` で日を読みます。時刻がずれていると、夏時間の切り替えなどで日付が 1 日ずれることがあるので、その対策です。

## ここがすごい

- **日数の表が要らない**: 「4 月は 30 日、2 月は…」のような表や、うるう年の条件分岐を書かずに、正しい日数が出ます。カレンダーの仕組みを、日付の計算そのものに任せています。
- **うるう年を自動で扱う**: 2 月の日数は、翌月の 0 日を作るときに自動で決まります。`isLeapYear` を呼ぶ必要もありません。
- **元の日付の型を保つ**: `constructFrom(_date, 0)` で作るので、入力が別のタイムゾーンや型の日付でも、同じ種類の日付で計算されます。
- **短く読める**: 「翌月の 0 日を読む」という 1 つの考え方で、3 行程度に収まっています。

## まとめ

- JavaScript の日付で日を `0` にすると、前の月の最終日になる。
- 月の日数は、翌月の 0 日を作って読むと、うるう年も含めて正しく求まる。
- 夏時間などの影響を避けるため、時刻を真夜中にそろえてから日を読む。
- 表や条件分岐を書かず、仕様の性質を使うと短いコードになる。
