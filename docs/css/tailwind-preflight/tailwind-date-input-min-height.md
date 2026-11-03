---
title: "日付入力の高さを空でも揃える 1lh"
description: "::-webkit-date-and-time-value の min-height に 1lh を指定して、iOS Safari で日付の入力欄が空のときに高さが縮むのを防ぐ。文字の一行分を単位として使う書き方。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [324, 327]
function: "\"::-webkit-date-and-time-value\""
difficulty: 3
format: 2
tags: [日時, 移植性]
---
## ひとことで

日付や時刻の入力欄の中の、値を表す部分の高さを、最低一行分にするルールです。`1lh` は「一行分の高さ」を表す単位です。iOS の Safari では、日付の入力欄が空のときに高さが縮み、値が入ると高さが変わることがあります。このルールは、その高さのずれを防ぎます。

## コード

```css:line-numbers=324
::-webkit-date-and-time-value {
  min-height: 1lh; /* 1 */
  text-align: inherit; /* 2 */
}
```

## 前提知識

- **日付と時刻の入力欄**: `input type="date"` や `type="time"` のことです。中の部分は、ブラウザが内部で組み立てています。
- **::-webkit-date-and-time-value**: 日付や時刻の値の部分を表す、WebKit 独自の疑似要素です。
- **lh 単位**: 要素の行の高さを基準にする単位です。`1lh` は、その要素の一行分の高さになります。
- **text-align: inherit**: 親の文字の揃え方をそのまま受け継ぐ指定です。

## 何をしているか

### 1. 最低一行分の高さを確保する

```css:line-numbers=325
  min-height: 1lh; /* 1 */
```

`min-height: 1lh` は、この値の部分が最低でも一行分の高さを持つという指定です。空のときも値が入ったときも、同じ高さが保たれます。

### 2. 文字の揃え方を親に合わせる

```css:line-numbers=326
  text-align: inherit; /* 2 */
```

`text-align: inherit` は、親の揃え方をそのまま使う指定です。iOS Safari では、日付の文字の揃え方が変えられないことがあるため、この指定で、利用者が指定した揃え方を反映できるようにしています。

## ここがすごい

- 高さを `px` ではなく `lh` で決めるので、文字の大きさを変えても、一行分の高さに自動で合います。
- 空のときと入力したときの高さのずれ、という、見つけにくい問題を一行で防いでいます。
- 素直に `height: 2rem` と固定すると、文字の大きさが変わったときに、入力欄の中で文字が窮屈になります。`lh` なら、その心配がありません。
- 二つの指定がそれぞれコメントの 1 と 2 に対応していて、どちらの目的かが読み取れます。

## まとめ

- `1lh` は、要素の一行分の高さを表す単位です。
- 値の部分の最低高さを決めると、空のときもずれません。
- 揃え方を親から継承すると、利用者の指定が反映されます。
