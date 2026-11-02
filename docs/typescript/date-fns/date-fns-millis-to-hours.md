---
title: "ミリ秒を時間に直す。端数は切り捨てる"
description: "date-fns の millisecondsToHours。ミリ秒を 1 時間の長さで割り、Math.trunc で小数点以下を切り捨てる。負の値は 0 方向へ切り捨てる。"
language: typescript
project: "date-fns"
repo: https://github.com/date-fns/date-fns
license: MIT
copyright: "Copyright (c) 2021 Sasha Koss and Lesha Koss"
commit: "313b902b9a72c64501074db9bc2b9897d2db5140"
file: src/millisecondsToHours/index.ts
lines: [25, 28]
function: "millisecondsToHours"
difficulty: 1
format: 2
tags: [日時, 数値計算, イディオム]
---

## ひとことで

`millisecondsToHours(milliseconds)` は、ミリ秒を時間の単位に直す関数です。1 時間は 3,600,000 ミリ秒なので、`millisecondsToHours(7200000)` は `2` を返します。割り切れないときは、小数点以下を切り捨てて、完全な時間の数だけを返します。

```ts
millisecondsToHours(7200000)  // 2
millisecondsToHours(5400000)  // 1（1.5 時間の、切り捨て）
millisecondsToHours(-5400000) // -1（0 に近い方へ切り捨てる）
```

## コード

```ts:line-numbers=25
export function millisecondsToHours(milliseconds: number): number {
  const hours = milliseconds / millisecondsInHour;
  return Math.trunc(hours);
}
```

## 前提知識

- **ミリ秒**: 1000 分の 1 秒です。JavaScript の時刻は、ミリ秒で数えます。
- **1 時間のミリ秒**: 1 時間は 60 分、1 分は 60 秒、1 秒は 1000 ミリ秒なので、3,600,000 ミリ秒です。date-fns では、この数を `millisecondsInHour` という定数にまとめています。
- **`Math.trunc`**: 小数点以下を切り捨てる組み込み関数です。正の数では `Math.floor` と同じですが、負の数では 0 に近い方へ切り捨てる点が違います。

## 何をしているか

### 1. 時間の数に割る

```ts:line-numbers=26
  const hours = milliseconds / millisecondsInHour;
```

ミリ秒を、1 時間のミリ秒の数で割ります。`5400000 / 3600000` は `1.5` です。

### 2. 小数点以下を切り捨てる

```ts:line-numbers=27
  return Math.trunc(hours);
```

`Math.trunc` で、完全に経過した時間の数だけを残します。`1.5` は `1` になります。

## ここがすごい

- **定数を名前で持つ**: 「1 時間は 3,600,000 ミリ秒」という事実を、`millisecondsInHour` という名前の定数にしています。数字の意味が、名前で伝わります。
- **切り捨ての意図が明確**: `Math.trunc` を使うことで、「完全な時間だけを数える」という意味が、関数名と合っています。
- **負の数の扱いを選んでいる**: `Math.floor` ではなく `Math.trunc` を使うので、負の値は 0 に向かって切り捨てられます。`-1.5` 時間が `-1` になるという、ゼロ方向の規則です。
- **1 行の計算**: 割り算と切り捨てだけなので、誰が読んでも意味が分かります。

## まとめ

- 単位の変換は、割り算と切り捨ての組み合わせで書ける。
- 単位の数値は、名前付きの定数にすると意味が伝わる。
- 負の数の切り捨て方は、`Math.trunc` と `Math.floor` で違うので、仕様に合わせて選ぶ。
