---
title: "Firefox の入力エラーの赤い影を消す"
description: ":-moz-ui-invalid に box-shadow: none を指定して、Firefox が入力内容の不正を示すために付ける赤い光の影を消す。エラーの表示は、利用者が自分で決める前提のリセット。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [369, 371]
function: "\":-moz-ui-invalid\""
difficulty: 2
format: 2
tags: [防御的プログラミング, 移植性]
---
## ひとことで

Firefox が、入力内容が不正なときに入力欄の周りに付ける赤い影を消すルールです。`:-moz-ui-invalid` は、Firefox 独自の「不正な入力と判定された」状態を表す疑似クラスです。このルールは、その既定の影だけを消します。

## コード

```css:line-numbers=369
:-moz-ui-invalid {
  box-shadow: none;
}
```

## 前提知識

- **:-moz-ui-invalid**: Firefox で、利用者が入力したあとに、値が不正だと判定された入力欄に一致する疑似クラスです。
- **:invalid**: 標準の疑似クラスで、入力の条件を満たさない要素に一致します。
- **box-shadow**: 要素の周りに影を描くプロパティです。`none` は影をなくします。
- **既定の見た目**: ブラウザが最初から持っている、入力欄のエラーの表示です。

## 何をしているか

### 1. 影をなくす

```css:line-numbers=370
  box-shadow: none;
```

`box-shadow: none` は、Firefox が付ける赤い影を消します。コメントにあるとおり、Firefox 独自の `:invalid` の見た目を消すためのリセットです。

## ここがすごい

- エラーの表示は、アプリごとに文字やアイコンで伝えるべきだ、という考えに沿っています。ブラウザの既定の表示を消して、デザインを利用者が決めるための土台です。
- 対象が `:-moz-ui-invalid` という Firefox の状態だけなので、標準の `:invalid` の見た目には触れていません。
- 素直に `:invalid` の見た目をすべて消すと、アプリ側でエラーを示す手段がなくなることがあります。Firefox の独自の状態だけを消すので、その影響を抑えています。
- 一行の指定で、ブラウザ間の見た目の差を揃えるという、リセットの目的がはっきりしています。

## まとめ

- `:-moz-ui-invalid` は、Firefox が不正な入力に付ける状態を表します。
- `box-shadow: none` で、既定の赤い影を消せます。
- エラーの見せ方は、ページ側で決めるのが前提です。
