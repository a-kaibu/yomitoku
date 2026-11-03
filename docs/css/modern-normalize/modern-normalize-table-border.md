---
title: "表の罫線の色を文字色に合わせる"
description: "table の border-color に currentcolor を指定して、罫線の色を継承させない。ブラウザごとの罫線の色の違いを揃えるルール。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [123, 125]
function: "table"
difficulty: 1
format: 2
tags: [移植性, ハック]
---
## ひとことで

表（`table`）の罫線の色を `currentcolor` に設定するルールです。`currentcolor` は「その要素の文字色」を意味するキーワードです。表の罫線が、文字色と同じ色で描かれるようになります。

## コード

```css:line-numbers=123
table {
	border-color: currentcolor;
}
```

## 前提知識

- **border-color**: 罫線（枠線）の色を決めるプロパティです。
- **currentcolor**: 「その要素の `color` の値」を表すキーワードです。文字色を変えると、この値も自動的に変わります。
- **table 要素**: 表を作る HTML 要素です。罫線の色は、ブラウザごとに既定の値が違うことがあります。
- **色の継承**: 多くのプロパティは親の値を引き継ぎますが、罫線の色は継承されない場合があります。

## 何をしているか

### 1. 罫線の色を文字色に合わせる

```css:line-numbers=123
table {
	border-color: currentcolor;
}
```

`border-color: currentcolor` と書くと、表の罫線は文字と同じ色になります。文字色を `color` で変えると、罫線の色も一緒に変わります。罫線の色を別々に指定し直す必要はありません。

この 1 行は「罫線の色は、ブラウザ既定の色ではなく、文字色に従う」という約束を表しています。

## ここがすごい

- `currentcolor` を使うと、罫線の色を変数や別の値で重ねて書かずに済みます。文字色を変えるだけで、罫線の色もついてきます。
- コメントに、この指定が Chrome と Safari のバグ対策だと書かれています。ブラウザごとに違った既定の色を、一つの書き方で揃えています。
- 素直に書くと、`table { border-color: #ccc; }` のように特定の色を決め打ちすることになります。そうすると、ダークモードなどで文字色を変えたときに、罫線だけが浮いてしまいます。
- `currentcolor` は、罫線だけでなく、アイコンの線や下線など、多くの場所で使える汎用の値です。

## まとめ

- `currentcolor` は、要素の文字色を表すキーワードです。
- 罫線の色を `currentcolor` にすると、文字色の変更に自動で追従します。
- ブラウザごとに違う既定の罫線の色を、一つの書き方で揃えられます。
- 色を決め打ちしないことで、テーマを切り替えたときも崩れにくくなります。
