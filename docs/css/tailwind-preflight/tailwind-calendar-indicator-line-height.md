---
title: "Chrome の datalist 付き入力のドロップダウン記号を中央に置く"
description: "::-webkit-calendar-picker-indicator の line-height を 1 にして、datalist を持つ input の右側に出る記号を縦の中央に揃える。Chrome 特有の位置のずれを直す一行。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [361, 363]
function: "\"::-webkit-calendar-picker-indicator\""
difficulty: 3
format: 2
tags: [移植性, ハック]
---
## ひとことで

`datalist` と組み合わせた入力欄の右側に出る、選択肢を開く記号（カレンダーアイコンやドロップダウンの印）の行の高さを `1` にするルールです。Chrome では、この記号が縦の中央からずれることがあり、その問題を直します。

## コード

```css:line-numbers=361
::-webkit-calendar-picker-indicator {
  line-height: 1;
}
```

## 前提知識

- **datalist 要素**: 入力欄に候補の一覧を付ける HTML 要素です。入力欄を開くと、候補が表示されます。
- **::-webkit-calendar-picker-indicator**: 日付入力などの右側にある、記号の部分を表す WebKit 独自の疑似要素です。
- **line-height: 1**: 行の高さを文字の大きさと同じにする指定です。余分な上下の空間がなくなります。
- **中央揃え**: 記号を、入力欄の縦の中心に合わせることです。

## 何をしているか

### 1. 行の高さを文字の大きさに合わせる

```css:line-numbers=362
  line-height: 1;
```

`line-height: 1` は、記号の行の高さを、文字の大きさと同じにします。行の高さが大きすぎると、記号が中央より下に寄って見えるため、この値で中央に戻しています。

## ここがすごい

- 記号の位置を、位置の指定ではなく、行の高さだけで整えています。レイアウトに関わるプロパティを増やさずに済みます。
- コメントに、該当する Tailwind の課題番号が書かれているので、なぜこの一行があるのかを後から辿れます。
- 素直に `position: relative; top: 2px;` のように位置をずらすと、ブラウザや内容によって、ずれ量が変わってしまいます。行の高さで揃える方が、内容に依存しません。
- この指定は、`datalist` を持つ入力欄に限ったブラウザの挙動への対策です。ほかの入力欄には、影響しません。

## まとめ

- `::-webkit-calendar-picker-indicator` は、入力欄の右の記号を表す WebKit 独自の疑似要素です。
- `line-height: 1` で、記号を縦の中央に寄せられます。
- 位置をずらすより、行の高さで揃える方が安定します。
