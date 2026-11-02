---
title: "2 つの日付が同じ西暦の年かを、年の数字だけで比べる"
description: "date-fns の isSameYear。2 つの日付を、タイムゾーンをそろえてから、西暦の年の数どうしで比べる。月や日は見ない。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/isSameYear/index.ts
lines: [28, 39]
function: "isSameYear"
difficulty: 1
format: 2
tags: [日時, 防御的プログラミング, イディオム]
---

## ひとことで

`isSameYear(a, b)` は、2 つの日付が同じ西暦の年かを判定する関数です。月や日は見ず、年の数字だけを比べます。2026 年 1 月と 2026 年 12 月は `true` になり、2025 年 12 月と 2026 年 1 月は `false` になります。

```ts
isSameYear(new Date(2026, 0, 1), new Date(2026, 11, 31)) // true
isSameYear(new Date(2025, 11, 31), new Date(2026, 0, 1)) // false
```

## コード

```ts:line-numbers=28
export function isSameYear(
  laterDate: DateArg<Date> & {},
  earlierDate: DateArg<Date> & {},
  options?: IsSameYearOptions | undefined,
): boolean {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate,
  );
  return laterDate_.getFullYear() === earlierDate_.getFullYear();
}
```

## 前提知識

- **西暦の年**: `getFullYear()` で得られる、4 桁の年の数です。`2026` のような値です。
- **`normalizeDates`**: 2 つの引数を `Date` にそろえ、同じ設定で扱えるようにする date-fns の内部関数です。
- **分割代入**: 配列の要素を、別々の変数に取り出す書き方です。ここでは、そろえた 2 つの日付を名前付きで受け取っています。
- **`===`**: 数どうしが同じかを比べます。

## 何をしているか

### 1. 2 つの日付をそろえる

```ts:line-numbers=33
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate,
  );
```

`normalizeDates` で、2 つの引数を同じ形に直します。文字列や数が渡されても、ここで `Date` になります。

### 2. 年の数字だけを比べる

```ts:line-numbers=38
  return laterDate_.getFullYear() === earlierDate_.getFullYear();
```

それぞれの西暦の年を取り出し、`===` で比べます。月や日は、比較に使いません。

## ここがすごい

- **比べる情報を絞る**: 年だけを比べると決めているので、関数の名前と中身が一致します。「同じ年」の意味がずれません。
- **年末年始の境界が正しく扱える**: 12 月 31 日と 1 月 1 日は、年が違うので `false` です。日付の差ではなく、年の数字で比べるからこそ、この判定が素直です。
- **入力の形を統一**: `normalizeDates` を通すので、どんな形の日付が渡されても、同じ規則で比べられます。
- **1 行で答えが出る**: 比較は 1 行です。前処理の部分が、この関数の安全性を支えています。

## まとめ

- 「同じ年か」は、年の数字どうしを比べれば判定できる。
- 比べたい情報（年だけ）を明確にすると、関数の意味がぶれない。
- 入力の形をそろえる前処理を入れると、呼び出し側の心配が減る。
