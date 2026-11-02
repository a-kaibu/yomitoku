---
title: "時刻を無視して、同じ日かどうかを比べる"
description: "date-fns の isSameDay。2 つの日付を、それぞれその日の 0 時に合わせてから、ミリ秒の値を比べる。同じ日の別の時刻でも、同じ日と判定できる。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/isSameDay/index.ts
lines: [39, 50]
function: "isSameDay"
difficulty: 1
format: 2
tags: [日時, 防御的プログラミング, イディオム]
---

## ひとことで

`isSameDay(a, b)` は、2 つの日付が同じ日（同じ年・同じ月・同じ日）かどうかを判定する関数です。時刻の違いは無視します。午前 9 時と午後 6 時でも、同じ日なら `true` を返します。

```ts
isSameDay(new Date(2026, 3, 1, 9, 0), new Date(2026, 3, 1, 18, 0)) // true
isSameDay(new Date(2026, 3, 1, 23, 59), new Date(2026, 3, 2, 0, 0)) // false
```

## コード

```ts:line-numbers=39
export function isSameDay(
  laterDate: DateArg<Date> & {},
  earlierDate: DateArg<Date> & {},
  options?: IsSameDayOptions | undefined,
): boolean {
  const [dateLeft_, dateRight_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate,
  );
  return +startOfDay(dateLeft_) === +startOfDay(dateRight_);
}
```

## 前提知識

- **タイムスタンプ**: 日付を、1970 年 1 月 1 日からのミリ秒の数で表したものです。`+date` と書くと、この数が取り出せます。
- **`startOfDay`**: その日付の 0 時 0 分 0 秒を返す date-fns の関数です。
- **`normalizeDates`**: 引数をすべて `Date` に直し、タイムゾーンの設定を揃える date-fns の内部関数です。
- **`+` 単項演算子**: `+date` は、`Date` をタイムスタンプ（数）に変換します。
- **分割代入 `const [a, b] = …`**: 配列の要素を、別々の変数に取り出す書き方です。

## 何をしているか

### 1. 2 つの日付をそろえる

```ts:line-numbers=44
  const [dateLeft_, dateRight_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate,
  );
```

2 つの引数を `Date` に変えて、同じタイムゾーンで扱えるようにします。関数の中では、`dateLeft_` と `dateRight_` という名前で使います。

### 2. 同じ日の 0 時にそろえて、数で比べる

```ts:line-numbers=49
  return +startOfDay(dateLeft_) === +startOfDay(dateRight_);
```

それぞれの日付を、その日の 0 時に合わせます。さらに `+` でミリ秒の数に変えてから、`===` で比べます。数が同じなら、同じ日です。

## ここがすごい

- **比べる前に、時刻を消す**: 時刻の部分が違っても、0 時にそろえれば、日付の部分だけが比べられます。「日が同じか」という問いに、そのまま答えられます。
- **数どうしで比べる**: `Date` のオブジェクト同士を `===` で比べると、同じ時刻でない限り `false` になります。数に直すことで、正しい比較になります。
- **比較の基準を 1 か所にまとめる**: 「同じ日」の定義（0 時にそろえる）が、この関数の 1 行に入っています。他の関数が同じ考え方を使えるよう、部品として使い回せます。
- **タイムゾーンを揃える**: `normalizeDates` を通すので、片方が別のタイムゾーンで渡されても、正しく比べられます。

## まとめ

- 同じ日かどうかは、時刻を 0 時にそろえてから比べる。
- `Date` を `+` で数に変えると、正しく大小や一致を比べられる。
- 比較の前に日付を正規化すると、入力の形の違いに振り回されない。
- 「同じ」の定義をどこで決めるかを意識すると、日付の処理のバグが減る。
