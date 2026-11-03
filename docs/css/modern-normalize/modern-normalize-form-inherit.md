---
title: "フォーム部品にもページのフォントを効かせる"
description: "input や select などフォーム部品のフォントを継承させ、サイズと行の高さ、余白をそろえる。ブラウザの既定の見た目を打ち消すルール。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [137, 146]
function: "\"button, input, optgroup, select, textarea\""
difficulty: 2
format: 2
tags: [移植性, イディオム]
---
## ひとことで

ボタンや入力欄、選択肢などのフォーム部品に、ページ本体と同じフォントとサイズを当てるルールです。ブラウザは既定でフォーム部品に独自のフォントを使うので、本文と見た目が揃わないことがよくあります。このルールはそれを打ち消して、本文と同じ基準にそろえます。

## コード

```css:line-numbers=137
button,
input,
optgroup,
select,
textarea {
	font-family: inherit; /* 1 */
	font-size: 100%; /* 1 */
	line-height: 1.15; /* 1 */
	margin: 0; /* 2 */
}
```

## 前提知識

- **フォーム部品**: `input`（入力欄）、`select`（選択メニュー）、`button`（ボタン）、`textarea`（複数行の入力欄）などのことです。
- **既定のスタイル（user agent stylesheet）**: ブラウザが最初から持っている見た目の指定です。フォーム部品には、この既定のスタイルが多く含まれています。
- **inherit**: 親要素の値をそのまま受け継ぐキーワードです。`font-family: inherit` は、親のフォントを使うという意味です。
- **margin**: 要素の外側の余白です。フォーム部品は、ブラウザごとに既定の余白が違います。

## 何をしているか

### 1. フォントとサイズを本文に合わせる

```css:line-numbers=141
textarea {
	font-family: inherit; /* 1 */
	font-size: 100%; /* 1 */
	line-height: 1.15; /* 1 */
	margin: 0; /* 2 */
```

`font-family: inherit` で、親要素（本文）のフォントを受け継ぎます。`font-size: 100%` は、親の文字サイズをそのまま使う指定です。`line-height: 1.15` は、本文と同じ行の高さに近づけています。これで、フォーム部品の文字が本文から浮かなくなります。

### 2. 外側の余白をなくす

```css:line-numbers=145
	margin: 0; /* 2 */
```

`margin: 0` は、ブラウザが付けている既定の外側の余白を消します。Firefox と Safari では、フォーム部品の周りに余白が付くため、このリセットがないと入力欄の位置がずれます。余白は、レイアウトを組む人が自分で決めるべきものだからです。

## ここがすごい

- 6 種類のフォーム部品を、一つのルールにまとめています。ボタンだけ、入力欄だけという個別の書き方より、リセットの範囲がわかりやすくなります。
- コメントの番号 `/* 1 */` と `/* 2 */` は、同じプロパティの目的を示しています。フォントに関わる行と、余白に関わる行が分けて読めます。
- 素直に書くと、フォーム部品ごとに `font-family` や `font-size` を指定する必要があります。そうすると、新しい部品を追加するたびに書き忘れが起きます。
- `inherit` は親の値を受け継ぐので、本文のフォントを変えると、フォーム部品にも自動で反映されます。

## まとめ

- フォーム部品は、ブラウザ既定のフォントや余白を持っているので、本文と揃わないことがあります。
- `font-family: inherit` で親のフォントを受け継ぎ、本文と同じ見た目にします。
- `margin: 0` で、既定の外側の余白を消します。
- 複数の部品をまとめて指定すると、リセットの範囲を一目で把握できます。
