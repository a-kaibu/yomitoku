---
title: "月の最後の日かどうかを、一日の終わりの時刻で比べて判定する"
description: "date-fns の isLastDayOfMonth。その日の終わり（23:59:59.999）と、月の終わりを比べて、同じなら月末とみなす。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/isLastDayOfMonth/index.ts
lines: [26, 32]
function: "isLastDayOfMonth"
difficulty: 2
format: 2
tags: [日時, イディオム, アルゴリズム]
---

## ひとことで

`isLastDayOfMonth(date)` は、日付がその月の最後の日かどうかを判定する関数です。`2026-02-28` を渡すと `true` を返します（2026 年はうるう年ではないため）。日付の数字だけを見る代わりに、「その日の終わり」と「月の終わり」が同じ時刻かを比べて判定しています。

```ts
isLastDayOfMonth(new Date(2026, 1, 28)) // true
isLastDayOfMonth(new Date(2026, 1, 27)) // false
```

## コード

```ts:line-numbers=26
export function isLastDayOfMonth(
  date: DateArg<Date> & {},
  options?: IsLastDayOfMonthOptions | undefined,
): boolean {
  const _date = toDate(date, options?.in);
  return +endOfDay(_date, options) === +endOfMonth(_date, options);
}
```

## 前提知識

- **`endOfDay`**: その日の最後の時刻（23 時 59 分 59.999 秒）を返す date-fns の関数です。
- **`endOfMonth`**: その月の最後の時刻を返す date-fns の関数です。月末の日の最後の瞬間を指します。
- **タイムスタンプ**: 日時を数で表したものです。`+date` で取り出せます。
- **`===`**: 数どうしが同じかを比べます。タイムスタンプが一致すれば、同じ時刻です。

## 何をしているか

### 1. 日付を読み直す

```ts:line-numbers=30
  const _date = toDate(date, options?.in);
```

引数を `Date` にそろえて、`_date` に入れます。

### 2. その日の終わりと、月の終わりを比べる

```ts:line-numbers=31
  return +endOfDay(_date, options) === +endOfMonth(_date, options);
```

`endOfDay(_date)` と `endOfMonth(_date)` の時刻を、それぞれタイムスタンプにして比べます。同じなら、その日の終わりが月の終わりと一致しているので、月末です。

## ここがすごい

- **日付の数字を見なくていい**: 「28 日か 29 日か 30 日か 31 日か」を、月ごとに書き分ける必要がありません。月の長さの知識を、`endOfMonth` の仕事にまかせています。
- **時刻を揃える発想**: 日付だけを比べると、月末の判定が複雑になります。時刻の最後同士を比べることで、比較が 1 回で済みます。
- **うるう年も自動で扱う**: 2 月の末日は `endOfMonth` が決めるので、うるう年の判定は、この関数の中に書いていません。
- **数で比べる**: `Date` のオブジェクトではなく数で比べるので、同じ時刻かどうかが確実に判定できます。

## まとめ

- 月末の判定は、「その日の終わり」と「月の終わり」が同じかを比べると簡単。
- 月の長さを自分で書かず、既存の関数に任せると、うるう年も含めて正しく判定できる。
- 日付の比較は、時刻を揃えてから数で行うと、ずれが起きにくい。
