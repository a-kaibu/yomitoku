---
title: "区切り線の前後に空の箱を置いて余白を安定させる"
description: "github-markdown-css の hr::before と hr::after は、display: table と content: \"\" の空の箱を前後に作る。余白の相殺や float の回り込みを防ぐための、定番の仕掛け。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [322, 331]
function: "\".markdown-body hr::before, .markdown-body hr::after\""
difficulty: 2
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

Markdown の区切り線 `hr` の前後に、中身の空の疑似要素を置くルールです。`::before` には `display: table`、`::after` には `display: table` と `clear: both` を指定しています。どちらも見た目はありませんが、余白の計算と float の回り込みを、区切り線の周りで整える役目を持ちます。

## コード

```css:line-numbers=322
.markdown-body hr::before {
  display: table;
  content: "";
}

.markdown-body hr::after {
  display: table;
  clear: both;
  content: "";
}
```

## 前提知識

- **hr 要素**: 話題の区切りを表す水平線の HTML 要素です。Markdown の `---` から作られます。
- **疑似要素 ::before と ::after**: 要素の前と後ろに、HTML にない仮想の箱を作る仕組みです。`content: ""` を付けると、中身が空の箱として存在します。
- **display: table**: 要素を表の箱として扱う指定です。この箱は、余白を生まずに、前後の要素との関係を整えます。
- **clear: both**: 左右の float の下に回り込まないようにする指定です。

## 何をしているか

### 1. 前に空の箱を置く

```css:line-numbers=322
.markdown-body hr::before {
  display: table;
  content: "";
}
```

`::before` は、`hr` の前に置かれる空の箱です。`display: table` で箱を表として扱うと、前の要素の余白と `hr` の余白が、相殺されずに効くようになります。

### 2. 後ろに空の箱を置き、float を閉じる

```css:line-numbers=327
.markdown-body hr::after {
  display: table;
  clear: both;
  content: "";
}
```

`::after` は、`hr` の後ろに置かれる空の箱です。`clear: both` によって、左右の float の要素の下に回り込むのを止めます。区切り線の後ろの要素が、きちんと区切り線より下に並びます。

## ここがすごい

- HTML に空の `div` を書く代わりに、疑似要素で同じ効果を作っています。Markdown から生成された HTML の構造を、余計に増やしません。
- `hr` は見た目が単純な要素なので、余白の計算のずれが目立ちやすい部分です。その計算を、空の箱で安定させています。
- 素直に `hr { margin: 24px 0; }` と書くだけだと、前後の要素との余白の関係が、ブラウザやレイアウトによって変わることがあります。空の箱を挟むと、その関係が予測しやすくなります。
- 同じ手法を `.markdown-body::before` と `::after` にも使っています。本文全体の端でも、同じ考え方で整えられています。

## まとめ

- `display: table` の空の疑似要素は、余白と float の挙動を安定させる定番の手です。
- `clear: both` の後ろの箱は、float の回り込みを止めます。
- HTML を増やさずに、区切り線の周りを整えられます。
