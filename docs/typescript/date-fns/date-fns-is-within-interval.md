---
title: "期間の中に日時があるかを、開始と終了の順番を気にせず判定する"
description: "date-fns の isWithinInterval。期間の開始と終了を数の配列にして並べ替えてから、日時が間に入るかを調べる。開始と終了が逆でも正しく判定する。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/isWithinInterval/index.ts
lines: [49, 61]
function: "isWithinInterval"
difficulty: 2
format: 2
tags: [日時, 防御的プログラミング, アルゴリズム]
---

## ひとことで

`isWithinInterval(date, interval)` は、ある日時が期間（`start` から `end` まで）の中にあるかを判定する関数です。`start` と `end` の順番が逆になっていても、正しく判定します。たとえば、キャンペーン期間の中に今日が含まれるかを調べるときに使えます。

```ts
isWithinInterval(new Date(2026, 3, 5), {
  start: new Date(2026, 3, 1),
  end: new Date(2026, 3, 10),
}) // true
```

## コード

```ts:line-numbers=49
export function isWithinInterval(
  date: DateArg<Date> & {},
  interval: Interval,
  options?: IsWithinIntervalOptions | undefined,
): boolean {
  const time = +toDate(date, options?.in);
  const [startTime, endTime] = [
    +toDate(interval.start, options?.in),
    +toDate(interval.end, options?.in),
  ].sort((a, b) => a - b);

  return time >= startTime && time <= endTime;
}
```

## 前提知識

- **期間（Interval）**: 開始（`start`）と終了（`end`）の 2 つの日時をまとめた値です。
- **タイムスタンプ**: 日時を、1970 年 1 月 1 日からのミリ秒の数で表したものです。`+date` で取り出せます。数にすると、大小の比較ができます。
- **分割代入**: 配列の要素を、別々の変数に一度に取り出す書き方です。
- **`sort((a, b) => a - b)`**: 数を小さい順に並べる比較関数です。
- **`toDate` と `options?.in`**: 引数を `Date` にそろえる date-fns の仕組みです。タイムゾーンなどの設定を、`options` で渡せます。

## 何をしているか

### 1. 判定する日時を数にする

```ts:line-numbers=54
  const time = +toDate(date, options?.in);
```

調べる日時を、タイムスタンプの数にします。

### 2. 開始と終了を数にして、小さい順に並べる

```ts:line-numbers=55
  const [startTime, endTime] = [
    +toDate(interval.start, options?.in),
    +toDate(interval.end, options?.in),
  ].sort((a, b) => a - b);
```

開始と終了を数にして配列に入れ、`sort` で並べ替えます。そして分割代入で、小さい方を `startTime`、大きい方を `endTime` に入れます。ここで、順番が逆でも正しい範囲になります。

### 3. 範囲の中かを比べる

```ts:line-numbers=60
  return time >= startTime && time <= endTime;
```

日時が、開始以上で終了以下なら、期間の中にあるので `true` です。両端を含むことに注意してください。

## ここがすごい

- **並べ替えで順番の問題を消す**: 開始と終了のどちらが先かを、呼び出し側に気にさせません。範囲の定義が、常に「小さい方から大きい方」になります。
- **数に変えてから比べる**: `Date` のオブジェクトを直接比べると、正しくない結果になることがあります。タイムスタンプに変えることで、確実な大小比較になります。
- **両端を含む規則が明確**: `>=` と `<=` で、境界の扱いが式に明示されています。曖昧さがありません。
- **少ない行数で完結**: 変換、並べ替え、比較の 3 段階が、短いコードに収まっています。

## まとめ

- 期間の中かの判定は、日時を数にしてから、範囲の両端と比べると確実。
- 範囲の端を数で並べ替えると、引数の順番の誤りを防げる。
- 境界を含むかどうかは、比較の記号で明示すると読み手が迷わない。
- 日付の比較は、オブジェクトのまま比べず、数にしてから行うのが安全。
