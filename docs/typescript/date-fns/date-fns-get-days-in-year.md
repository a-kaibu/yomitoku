---
title: "年の日数を、うるう年の判定を使って 365 か 366 で返す"
description: "date-fns の getDaysInYear。isLeapYear の結果から、その年の日数を 366 か 365 にする。日付が無効なら NaN を返す。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/getDaysInYear/index.ts
lines: [28, 35]
function: "getDaysInYear"
difficulty: 1
format: 2
tags: [日時, 数値計算, 防御的プログラミング]
---

## ひとことで

`getDaysInYear(date)` は、その日付の年が何日あるかを返す関数です。うるう年なら `366`、そうでなければ `365` です。日付が無効（`Invalid Date` など）なら、`NaN` を返します。前に見た `isLeapYear` を、そのまま使っています。

```ts
getDaysInYear(new Date(2024, 5, 1))  // 366（2024 年はうるう年）
getDaysInYear(new Date(2026, 5, 1))  // 365
getDaysInYear(new Date('x'))         // NaN
```

## コード

```ts:line-numbers=28
export function getDaysInYear(
  date: DateArg<Date> & {},
  options?: GetDaysInYearOptions | undefined,
): number {
  const _date = toDate(date, options?.in);
  if (Number.isNaN(+_date)) return NaN;
  return isLeapYear(_date) ? 366 : 365;
}
```

## 前提知識

- **うるう年**: 2 月が 29 日まである年です。1 年は、平年なら 365 日、うるう年なら 366 日です。
- **`isLeapYear`**: 日付の年がうるう年かを判定する date-fns の関数です。4、100、400 の規則を使っています。
- **無効な日付（Invalid Date）**: 日付として解釈できない値です。`new Date('x')` などで作られます。その時刻の数は `NaN` になります。
- **`Number.isNaN`**: 値が `NaN` かを判定します。

## 何をしているか

### 1. 日付を読み直す

```ts:line-numbers=32
  const _date = toDate(date, options?.in);
```

引数を `Date` にそろえます。

### 2. 無効な日付なら NaN を返す

```ts:line-numbers=33
  if (Number.isNaN(+_date)) return NaN;
```

`+_date` は、無効な日付なら `NaN` になります。その場合は、日数が決まらないので `NaN` を返します。

### 3. うるう年かで 366 か 365 を選ぶ

```ts:line-numbers=34
  return isLeapYear(_date) ? 366 : 365;
```

`isLeapYear` が `true` なら `366`、そうでなければ `365` を返します。条件式が 1 行に収まっています。

## ここがすごい

- **既存の部品を再利用**: うるう年の規則は `isLeapYear` にだけ書かれています。この関数は、その結果を日数に変えるだけなので、規則が 1 か所に保たれます。
- **無効な入力を値で表す**: 例外を投げずに `NaN` を返します。呼び出し側は、`Number.isNaN` で判定して、続きの処理を決められます。
- **条件演算子で短く**: `? :` の 1 行で、2 つの値から選んでいます。
- **早い return**: 無効な日付は、本体の判定の前に弾いています。後の式が、常に正しい入力だけを扱えます。

## まとめ

- 年の日数は、うるう年かどうかで 366 と 365 を選ぶだけで求まる。
- 規則は既存の関数に任せ、この関数は結果を変換するだけにすると、保守しやすい。
- 無効な日付は例外ではなく `NaN` で返すと、呼び出し側が扱いやすい。
