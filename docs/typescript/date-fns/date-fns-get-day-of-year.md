---
title: "1 月 1 日からの差を数えて、年の何日目かを求める"
description: "date-fns の getDayOfYear。年初との日数の差を取り、1 を足すだけで、1 月 1 日を 1 日目として数える。時刻の影響を受けない差の求め方を使っている。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/getDayOfYear/index.ts
lines: [29, 37]
function: "getDayOfYear"
difficulty: 2
format: 2
tags: [日時, 数値計算, イディオム]
---

## ひとことで

`getDayOfYear(date)` は、その日付が年の何日目かを返す関数です。1 月 1 日なら `1`、12 月 31 日なら `365`（うるう年は `366`）を返します。年初の日付との「カレンダー上の日数の差」を求めて、1 を足すだけの単純な作りです。

```ts
getDayOfYear(new Date(2026, 0, 1))  // 1
getDayOfYear(new Date(2026, 11, 31)) // 365
```

## コード

```ts:line-numbers=29
export function getDayOfYear(
  date: DateArg<Date> & {},
  options?: GetDayOfYearOptions | undefined,
): number {
  const _date = toDate(date, options?.in);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}
```

## 前提知識

- **年初（`startOfYear`）**: その年の 1 月 1 日 0 時を返す関数です。
- **`differenceInCalendarDays(a, b)`**: 2 つの日付の、カレンダー上の日数の差を返す関数です。時刻の違いは無視され、日付だけで数えます。
- **「差 + 1」の考え方**: 1 月 1 日と 1 月 1 日の差は `0` です。1 日目として数えるために、最後に `1` を足します。
- **`const`**: 一度決めた値を変えない変数の宣言です。

## 何をしているか

### 1. 日付を読み直す

```ts:line-numbers=33
  const _date = toDate(date, options?.in);
```

渡された値を `Date` にそろえます。

### 2. 年初からの日数を求める

```ts:line-numbers=34
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
```

`startOfYear(_date)` は、同じ年の 1 月 1 日です。その日との差を `differenceInCalendarDays` で求めます。たとえば 1 月 10 日なら、差は `9` です。

### 3. 1 を足して、何日目かにする

```ts:line-numbers=35
  const dayOfYear = diff + 1;
  return dayOfYear;
```

1 月 1 日の差は `0` なので、`1` を足して「1 日目」にします。1 月 10 日は `9 + 1 = 10` で、10 日目です。

## ここがすごい

- **時刻を気にしない差**: 「1 日 = 24 時間」と単純に割ると、夏時間の切り替えで 1 時間ずれて答えが合わなくなります。カレンダーの日数で差を取るので、この問題を避けています。
- **既存の部品を組み合わせる**: 年初を求める関数と、日数の差を求める関数を組み合わせるだけで、新しい計算を書く必要がありません。
- **変数に名前を付ける**: `diff` と `dayOfYear` の 2 つに分けて、途中の値に名前を付けています。「差」と「何日目」の意味の違いが、読むだけでわかります。
- **1 を足す理由が明確**: 「差」と「番号」は 1 ずれるという、よくある間違いを、コードの形で防いでいます。

## まとめ

- 年の何日目かは、年初からの差に 1 を足して求める。
- 時間の差で日数を割ると、夏時間で 1 日ずれることがある。カレンダー上の差を使うと安全。
- 「差」と「番号」のずれ（+1）は、コードの中で名前を付けて明示すると間違えにくい。
- 既存の関数を組み合わせると、少ない行数で目的の計算ができる。
