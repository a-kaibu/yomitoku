---
title: "表の罫線の隙間を消す border-collapse"
description: "table の border-collapse を collapse にして、セルの間にできる隙間を消す。罫線を一本にまとめて、表の見た目を揃えるルール。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [168, 172]
function: "table"
difficulty: 2
format: 2
tags: [移植性, 可読性]
---
## ひとことで

`table` 要素の罫線を、セルごとに分けずに一本にまとめるルールです。`border-collapse: collapse` を指定すると、隣り合うセルの枠線が重なり、間の隙間がなくなります。表の枠線が太く二重に見えるのを防げます。

## コード

```css:line-numbers=168
table {
  text-indent: 0; /* 1 */
  border-color: inherit; /* 2 */
  border-collapse: collapse; /* 3 */
}
```

## 前提知識

- **表（table）**: 行と列で値を並べる HTML 要素です。`tr` が行、`td` と `th` がセルを表します。
- **border-collapse**: 隣り合うセルの枠線を、重ねるか分けるかを決めるプロパティです。既定の `separate` では、セルごとに枠線と隙間が描かれます。
- **border-spacing**: `separate` のときに、セルの間の隙間の大きさを決めるプロパティです。`collapse` のときは使われません。
- **text-indent**: 文字の先頭の字下げを決めるプロパティです。

## 何をしているか

### 1. 文字の字下げをリセットする

```css:line-numbers=168
table {
  text-indent: 0; /* 1 */
  border-color: inherit; /* 2 */
```

`text-indent: 0` は、表の中の文字に付く字下げを消します。コメント 1 にあるように、Chrome と Safari では表の中に字下げが残ることがあるので、ここで明示的にゼロにしています。

`border-color: inherit` は、罫線の色を親から受け継ぎます。コメント 2 のとおり、Chrome と Safari では表の罫線の色が正しく継承されないことがあるので、その対策です。

### 2. 罫線を重ねて一本にする

```css:line-numbers=171
  border-collapse: collapse; /* 3 */
```

`border-collapse: collapse` で、隣り合うセルの枠線を一本にまとめます。コメント 3 にあるように、これは表の既定で隙間が入らないようにするための指定です。

## ここがすごい

- 3 つの宣言が、それぞれ別のブラウザの問題を解決しています。`text-indent`、`border-color`、`border-collapse` を一つの表のルールにまとめているのは、表のリセットの定番の書き方です。
- `collapse` にすると、罫線を一本として扱うので、枠線の太さの計算が直感的になります。
- 素直に `table { border: 1px solid black; }` と書くと、表の外枠と内側の罫線が二重になり、太く見えてしまいます。`collapse` を使うと、この二重の枠線を防げます。
- 罫線の色を `inherit` で受け取るので、文字色に合わせて表の罫線も変わります。

## まとめ

- 表は既定で、セルごとに枠線と隙間を持ちます。
- `border-collapse: collapse` で、罫線を一本にまとめられます。
- `text-indent` と `border-color` を整えると、ブラウザごとの差を減らせます。
- 表のリセットは、見た目の設計の前提になるので、最初に一度書いておくと後が楽になります。
