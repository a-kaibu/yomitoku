---
title: "月の番号を 3 で割るだけで、四半期を求める"
description: "date-fns の getQuarter。1 月から 3 か月ごとに区切った四半期（1〜4）を、月の番号を 3 で割った商から求める。短い計算で、表を使わない。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/getQuarter/index.ts
lines: [27, 34]
function: "getQuarter"
difficulty: 1
format: 2
tags: [日時, 数値計算, イディオム]
---

## ひとことで

`getQuarter(date)` は、日付が年の第何四半期かを、`1` から `4` の数で返す関数です。四半期とは、1 年を 3 か月ずつ 4 つに分けた区切りのことです。1 月〜3 月は第 1 四半期、10 月〜12 月は第 4 四半期になります。

```ts
getQuarter(new Date(2026, 0, 15))  // 1（1 月）
getQuarter(new Date(2026, 4, 1))   // 2（5 月）
getQuarter(new Date(2026, 11, 31)) // 4（12 月）
```

## コード

```ts:line-numbers=27
export function getQuarter(
  date: DateArg<Date> & {},
  options?: GetQuarterOptions | undefined,
): number {
  const _date = toDate(date, options?.in);
  const quarter = Math.trunc(_date.getMonth() / 3) + 1;
  return quarter;
}
```

## 前提知識

- **四半期（quarter）**: 1 年を 4 つに分けた期間です。会計や売上の報告でよく使われます。
- **月の番号**: `getMonth()` は 1 月を `0`、12 月を `11` で返します。
- **`Math.trunc`**: 小数点以下を切り捨てて整数にする組み込み関数です。`Math.trunc(2.9)` は `2` です。
- **整数の割り算**: JavaScript の `/` は小数の結果を返します。`Math.trunc` で切り捨てると、区切りごとの整数の番号になります。

## 何をしているか

### 1. 月の番号を 3 で割る

```ts:line-numbers=32
  const quarter = Math.trunc(_date.getMonth() / 3) + 1;
```

`getMonth()` の値を `3` で割ると、0 から 3 までの小数になります。たとえば 1 月（`0`）は `0`、4 月（`3`）は `1`、7 月（`6`）は `2`、10 月（`9`）は `3` です。

切り捨てると、1 月〜3 月は `0`、4 月〜6 月は `1` になります。最後に `+ 1` を足して、四半期の番号（1 から始まる数）にします。

### 2. 結果を返す

```ts:line-numbers=33
  return quarter;
```

四半期の番号をそのまま返します。

## ここがすごい

- **表が要らない**: 「1〜3 月は 1、4〜6 月は 2…」と全部の月を書く代わりに、割り算 1 回で同じ結果になります。
- **区切りの幅を変えやすい**: 「3」を別の数に変えるだけで、2 か月ごとや 4 か月ごとの区切りにも応用できます。
- **0 から数える月と、1 から数える四半期**: 月は 0 始まり、四半期は 1 始まりです。`+ 1` で、人が読む番号に直しています。この違いがわかると、他の日付の関数も読みやすくなります。
- **1 行の計算に名前を付ける**: `quarter` という変数に入れて返すことで、何の値かが読んだだけで伝わります。

## まとめ

- 月の番号を 3 で割って切り捨てると、四半期の番号の前段階が求まる。
- 0 から数える値は、人向けに `+ 1` で直す。
- 区切りを作る計算は、割る数と切り捨てを組み合わせると短く書ける。
- 表を用意せずに、規則を式に置き換えるのは、日付の計算でよく使う考え方。
- 日付の関数は、組み込みの `getMonth()` や `getDay()` のような小さな部品を組み合わせて作られていることが多い。その部品の値域（0 始まりか 1 始まりか）を押さえると、どの関数も読みやすくなる。
- この関数は、同じ考え方で月の区切りを変えた関数（2 か月ごとの区切りなど）にも応用できる。
