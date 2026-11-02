---
title: "ローカル時刻を UTC として読み直して、時差を求める"
description: "date-fns の getTimezoneOffsetInMilliseconds。日付の年・月・日・時・分・秒を UTC として作り直し、元の時刻との差を取る。夏時間を含めた正確な時差を、タイムゾーンの表を使わずに求めている。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/_lib/getTimezoneOffsetInMilliseconds/index.ts
lines: [15, 32]
function: "getTimezoneOffsetInMilliseconds"
difficulty: 3
format: 2
tags: [日時, 数値計算, 低レイヤ]
---

## ひとことで

`getTimezoneOffsetInMilliseconds(date)` は、その日付の時刻が、UTC（世界標準時）からどれだけずれているかを、ミリ秒で返す関数です。日本の時刻（UTC+9）なら `9 * 60 * 60 * 1000` を返します。date-fns の中で、日付の差を正しく求めるために使われています。

```ts
// 日本時間（UTC+9）の環境では 9 時間 = 32400000 ミリ秒
getTimezoneOffsetInMilliseconds(new Date(2026, 0, 1)) // 32400000
```

## コード

```ts:line-numbers=15
export function getTimezoneOffsetInMilliseconds(
  date: DateArg<Date> & {},
): number {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds(),
    ),
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}
```

## 前提知識

- **UTC（協定世界時）**: 世界の基準になる時刻です。日本時間は UTC より 9 時間進んでいます。
- **タイムスタンプ**: 1970 年 1 月 1 日 0 時 UTC からのミリ秒の数です。`Date` の中身は、この数で表されています。
- **`Date.UTC(…)`**: 年・月・日・時・分・秒を、UTC として数にする組み込みの関数です。
- **ローカル時刻**: パソコンやスマホが設定している地域の時刻です。`getHours()` などはローカル時刻を返します。
- **夏時間（DST）**: 季節によって時計を 1 時間進めたり戻したりする仕組みです。地域によってはこの時差が変わります。

## 何をしているか

### 1. ローカルの各項目を、UTC の数として並べる

```ts:line-numbers=19
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds(),
    ),
  );
```

ローカル時刻の年・月・日・時・分・秒・ミリ秒を、そのまま UTC の値として `Date.UTC` に渡します。こうして作った `utcDate` は、「ローカルの表示を、UTC の時刻として読んだもの」になります。

### 2. 年だけ上書きして、ずれを固定する

```ts:line-numbers=30
  utcDate.setUTCFullYear(_date.getFullYear());
```

`Date.UTC` は年が 0 から 99 のときに 1900 年代として扱う仕様があるので、年を正しい値に直しています。

### 3. 元の時刻との差を返す

```ts:line-numbers=31
  return +date - +utcDate;
```

元の日付（実際のタイムスタンプ）から、`utcDate`（ローカルの表示を UTC と読んだもの）を引きます。その差が、時差です。日本時間なら、ローカルの表示が 9 時間分だけ大きくなるので、差は 9 時間になります。

## ここがすごい

- **タイムゾーンの表が要らない**: どの地域の時差かを、表で持つ必要がありません。実行している環境の設定を、そのまま利用します。
- **夏時間にも対応**: その日付の時刻で計算するので、夏時間の期間かどうかも自動で反映されます。
- **組み込みの仕組みだけで作れる**: 特別なライブラリを使わず、`Date` の標準的な関数だけで求めています。
- **年の補正をわざわざ書いている**: `setUTCFullYear` で年を直す 1 行が、古い仕様の癖を防いでいます。細かい部分にも注意が払われています。

## まとめ

- 日付のローカルな値を UTC として読み直すと、その時点の時差がわかる。
- 時差は、実際のタイムスタンプと読み直した値の差で求まる。
- 夏時間のように時差が変わる場合も、その日付で計算すれば正しい値になる。
- `Date.UTC` は年の扱いに癖があるので、必要なら年を直してから使う。
