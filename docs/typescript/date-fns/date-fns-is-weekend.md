---
title: "土曜と日曜を、曜日の番号 0 と 6 だけで判定する"
description: "date-fns の isWeekend。曜日を数で返す getDay の値のうち、日曜の 0 と土曜の 6 だけを週末とみなす。曜日の名前を文字列で比べずに済ませている。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/isWeekend/index.ts
lines: [27, 33]
function: "isWeekend"
difficulty: 1
format: 2
tags: [日時, 数値計算, イディオム]
---

## ひとことで

`isWeekend(date)` は、日付が土曜日か日曜日なら `true` を返す関数です。JavaScript の `Date` は曜日を数（日曜が 0、土曜が 6）で返すので、その 2 つの数だけを確かめれば判定できます。

```ts
isWeekend(new Date(2026, 10, 1)) // 2026 年 11 月 1 日（日曜）→ true
isWeekend(new Date(2026, 10, 2)) // 11 月 2 日（月曜）→ false
```

## コード

```ts:line-numbers=27
export function isWeekend(
  date: DateArg<Date> & {},
  options?: IsWeekendOptions | undefined,
): boolean {
  const day = toDate(date, options?.in).getDay();
  return day === 0 || day === 6;
}
```

## 前提知識

- **`getDay()`**: 日付の曜日を数で返すメソッドです。日曜が `0`、月曜が `1`、…、土曜が `6` です。
- **`toDate(date, options?.in)`**: 引数を `Date` にそろえる date-fns の関数です。`options?.in` は、タイムゾーンなどの設定を渡すための任意の値です。`?.`（オプショナルチェーン）は、`options` が無いときに安全に `undefined` を返します。
- **`||`（または）**: 左か右のどちらかが真なら真になります。
- **型 `DateArg<Date> & {}`**: 日付として受け取れる値の型を表します。`Date`、数（タイムスタンプ）、文字列などを扱えるように、date-fns が決めている型です。

## 何をしているか

### 1. 曜日を数で取り出す

```ts:line-numbers=31
  const day = toDate(date, options?.in).getDay();
```

まず日付を `Date` にそろえ、その曜日の番号を `day` に入れます。ここで 0 から 6 までの数になります。

### 2. 0 と 6 だけを週末とみなす

```ts:line-numbers=32
  return day === 0 || day === 6;
```

`0`（日曜）または `6`（土曜）なら `true` を返します。平日は 1 から 5 なので、この式で必ず `false` になります。

## ここがすごい

- **文字列を比べない**: `getDay()` が返すのは数なので、`'Sunday'` や `'日'` のような言語に依存する文字列と比べずに済みます。表示の言語が変わっても、判定の結果は同じです。
- **判定の式が 1 行**: 週末の定義は「0 か 6」だけなので、他の条件を足す必要がありません。読むだけで意味がわかります。
- **日付の形を問わない**: 関数の中で `toDate` を使うので、数や文字列で渡されても同じ判定になります。
- **数の意味を覚えておく**: 曜日の番号は JavaScript の仕様で決まっていて、日曜から始まります。月曜始まりの国の週末判定も、この番号を基準に組めます。

## まとめ

- `getDay()` の曜日は数（日曜 0、土曜 6）で返る。
- 週末の判定は、文字列ではなく数で比べると、表示言語に左右されない。
- 引数を `toDate` でそろえると、いろいろな形の日付を同じ方法で扱える。
- 判定の式が短く書けるのは、対象の定義が単純だからだと意識すると、他の関数にも応用できる。
