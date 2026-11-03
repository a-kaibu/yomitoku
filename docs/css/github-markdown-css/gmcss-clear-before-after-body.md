---
title: "本文全体の前後に空の箱を置く"
description: ".markdown-body の ::before と ::after に display: table と content: \"\" を指定し、本文の前後で余白と float の回り込みを整える。区切り線と同じ仕掛けを本文全体に広げる例。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [507, 516]
function: "\".markdown-body::before, .markdown-body::after\""
difficulty: 2
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

本文を囲む `.markdown-body` の前後に、中身の空の疑似要素を置くルールです。`::before` と `::after` に、`display: table` と `content: ""` を指定しています。前後の余白の相殺や float の回り込みを、本文全体の外側で止める役目を持ちます。

## コード

```css:line-numbers=507
.markdown-body::before {
  display: table;
  content: "";
}

.markdown-body::after {
  display: table;
  clear: both;
  content: "";
}
```

## 前提知識

- **.markdown-body**: Markdown から作られた HTML をくるむ、本文のための箱です。このライブラリの、すべてのルールの土台になります。
- **疑似要素**: HTML にない仮想の箱を、CSS で前後に作る仕組みです。
- **display: table**: 箱を表として扱う指定です。余白の相殺を止める目的で使われることがあります。
- **clear: both**: 左右の float の下に回り込まないようにする指定です。

## 何をしているか

### 1. 本文の前に箱を置く

```css:line-numbers=507
.markdown-body::before {
  display: table;
  content: "";
}
```

`.markdown-body::before` は、本文の最初に置かれる空の箱です。`display: table` によって、本文の上の余白が外側の余白と相殺されずに効きます。

### 2. 本文の後に箱を置く

```css:line-numbers=512
.markdown-body::after {
  display: table;
  clear: both;
  content: "";
}
```

`::after` は、本文の最後に置かれる空の箱です。`clear: both` が、本文の中の float を閉じて、本文の高さの中に含めます。本文の下に別の要素が続いても、float のずれがそこに残りません。

## ここがすごい

- 本文全体の前後に一度だけ仕掛けを置くので、中のすべての要素がその影響を受けます。個々の要素で同じ対策をする必要がありません。
- 区切り線（hr）と同じ仕掛けを、本文の外側にも使っています。小さな部品の工夫を、ページ全体にそのまま広げた例です。
- 素直に、本文の後ろに空の `div` を書く方法もあります。HTML を増やさずに、CSS だけで同じ効果を得ています。
- 空の箱は、見た目の余白をほとんど変えません。整えるための仕掛けとしての役目だけを持っています。

## まとめ

- 本文の前後に空の疑似要素を置くと、本文全体の余白と float を整えられます。
- `display: table` と `clear: both` の組み合わせは、区切り線と本文に共通する仕掛けです。
- 中の要素に個別の対策をせずに済みます。
