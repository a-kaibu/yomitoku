---
title: "うるう年の判定を 1 行に収める 400 年ルール"
description: "date-fns の isLeapYear。4 で割り切れる年はうるう年だが、100 で割り切れる年は例外、さらに 400 で割り切れる年は再びうるう年になる。その規則を 1 行の式で表している。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/isLeapYear/index.ts
lines: [24, 31]
function: "isLeapYear"
difficulty: 1
format: 2
tags: [日時, 数値計算, 標準ライブラリ]
---

## ひとことで

`isLeapYear(date)` は、日付の年がうるう年かどうかを判定する関数です。うるう年は、2 月が 29 日まである年のことです。判定は「4 で割り切れる」だけでは足りず、100 と 400 の例外も必要です。date-fns では、その規則を 1 つの式にまとめています。

```ts
isLeapYear(new Date(2024, 0, 1)) // true（4 で割り切れる）
isLeapYear(new Date(1900, 0, 1)) // false（100 で割り切れるが 400 では割り切れない）
isLeapYear(new Date(2000, 0, 1)) // true（400 で割り切れる）
```

## コード

```ts:line-numbers=24
export function isLeapYear(
  date: DateArg<Date> & {},
  options?: IsLeapYearOptions | undefined,
): boolean {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}
```

## 前提知識

- **うるう年**: 地球が太陽を 1 周する時間に合わせて、2 月を 29 日にする年です。平年は 365 日、うるう年は 366 日です。
- **剰余演算子 `%`**: 割った余りを求めます。`year % 4 === 0` は「4 で割り切れる」という意味です。
- **論理演算子 `||`（または）と `&&`（かつ）**: `||` はどちらかが真なら真、`&&` は両方が真のときだけ真になります。
- **`getFullYear()`**: 日付の西暦（例: 2026）を返します。
- **`toDate` と `options`**: 引数の値を日付として読み直す date-fns の関数です。タイムゾーンなどの設定を `options` で渡せます。

## 何をしているか

### 1. 年を取り出す

```ts:line-numbers=28
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
```

どんな形で渡された日付でも、いったん `Date` として読み直し、西暦の年を取り出します。

### 2. 400 で割り切れる年は、うるう年

```ts:line-numbers=30
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
```

式の左側 `year % 400 === 0` は、400 で割り切れる年です。2000 年や 2400 年がここに入ります。これは必ずうるう年です。

### 3. 4 で割り切れて、100 では割り切れない年

同じ行の右側 `(year % 4 === 0 && year % 100 !== 0)` です。4 で割り切れ、かつ 100 では割り切れない年がうるう年です。たとえば 2024 年はここに入り、1900 年は 100 では割り切れるので入りません。

## ここがすごい

- **規則をそのまま式にしている**: 「4 で割り切れる、ただし 100 は例外、ただし 400 は例外の例外」という文章の規則が、3 つの剰余の判定で表せます。
- **先に 400 を判定して、短く書く**: 400 で割り切れる年は、4 でも割り切れるので、条件を分けて書くとわかりやすくなります。
- **日付のずれを防ぐ**: 年を `Date` 経由で取り出すので、タイムゾーンなどで年が 1 年ずれる場合にも、指定された日付の年で判定されます。
- **真偽値をそのまま返す**: `if` 文を使わず、式の結果が `true` か `false` で、判定の答えになります。

## まとめ

- うるう年は「4 で割り切れる」だけでは判定できず、100 と 400 の例外がある。
- 規則を、`%` の判定と `||`・`&&` の組み合わせで 1 行に書ける。
- 年の取り出しは `getFullYear()` で行い、日付の形を問わず使える。
- 規則が複雑なときは、例外の順番を意識して式を組み立てると読みやすい。
