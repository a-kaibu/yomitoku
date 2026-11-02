---
title: "月末の日付を、翌月の 0 日として作り直す"
description: "date-fns の lastDayOfMonth。日付を月末の 0 時に変える。翌月の 0 日を使う JavaScript の日付の仕様を利用し、時刻もそろえてから返す。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/lastDayOfMonth/index.ts
lines: [32, 44]
function: "lastDayOfMonth"
difficulty: 2
format: 2
tags: [日時, イディオム, 標準ライブラリ]
---

## ひとことで

`lastDayOfMonth(date)` は、渡された日付と同じ月の最終日を、0 時の `Date` として返す関数です。たとえば `2026-02-10` を渡すと `2026-02-28` の 0 時を返します。月末の日付を求める処理は、日付の「0 日」の性質をうまく使うと短く書けます。

```ts
lastDayOfMonth(new Date(2026, 1, 10)) // 2026 年 2 月 28 日 0:00
lastDayOfMonth(new Date(2028, 1, 10)) // 2028 年 2 月 29 日 0:00（うるう年）
```

## コード

```ts:line-numbers=32
export function lastDayOfMonth<
  DateType extends Date,
  ResultDate extends Date = DateType,
>(
  date: DateArg<DateType>,
  options?: LastDayOfMonthOptions<ResultDate> | undefined,
): ResultDate {
  const _date = toDate(date, options?.in);
  const month = _date.getMonth();
  _date.setFullYear(_date.getFullYear(), month + 1, 0);
  _date.setHours(0, 0, 0, 0);
  return toDate(_date, options?.in) as ResultDate;
}
```

## 前提知識

- **0 日の性質**: JavaScript の `Date` は、日を `0` にすると前の月の最終日になります。`setFullYear(年, 月 + 1, 0)` は、今月の最終日を指します。
- **ジェネリクス `<DateType, ResultDate>`**: 入力と出力の日付の型を、呼び出し側に合わせて決める書き方です。入力が `Date` の派生型なら、結果も同じ型になります。
- **`as ResultDate`**: 型を、指定した型として扱うという指定です。実行時には何もしません。
- **`setHours(0, 0, 0, 0)`**: 時・分・秒・ミリ秒をすべて `0` にして、その日の 0 時にそろえる指定です。

## 何をしているか

### 1. 日付を読み直して、月を取り出す

```ts:line-numbers=39
  const _date = toDate(date, options?.in);
  const month = _date.getMonth();
```

入力を `Date` にそろえ、その月の番号を取り出します。

### 2. 翌月の 0 日に設定する

```ts:line-numbers=41
  _date.setFullYear(_date.getFullYear(), month + 1, 0);
```

年はそのままに、月を `month + 1`（翌月）、日を `0` にします。その結果、日付は今月の最終日になります。うるう年の 2 月でも、正しく 29 日になります。

### 3. 0 時にそろえて返す

```ts:line-numbers=42
  _date.setHours(0, 0, 0, 0);
  return toDate(_date, options?.in) as ResultDate;
```

時刻を 0 時にそろえてから、結果を返します。`toDate` に通すのは、タイムゾーンなどの設定を結果にも適用するためです。

## ここがすごい

- **月の長さを知らなくてもいい**: 「30 日の月」「31 日の月」「うるう年」の場合分けがなく、翌月の 0 日という仕様だけで答えが出ます。
- **1 回の `setFullYear` で済む**: 日付を 1 つずつ増減させるループや、大きな表を使う方法と比べて、ずっと短く速く計算できます。
- **結果の型を入力に合わせる**: 型のジェネリクスで、`Date` の派生型を渡すと、結果もその型になります。呼び出し側の型の情報を失いません。
- **時刻をそろえる理由が明確**: 月末の日付を比べたり表示したりするとき、時刻が残っていると判定が狂うので、0 時に固定しています。

## まとめ

- JavaScript の `Date` では、日を `0` にすると前の月の最終日になる。
- 月末の日付は、翌月の 0 日を作ると、月の長さを気にせず求まる。
- 月末を比べるときは、時刻を 0 時にそろえておくと安全。
- ジェネリクスで入力と出力の型を揃えると、呼び出し側の型の情報が保てる。
