---
title: "影と角丸で浮かせるカード"
description: "Chota の .card は、角丸、内側の余白、薄い影で箱を浮かせ、最後の段落の下の余白をゼロにする。本文の一部を囲んで見せるための、小さな部品。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_card.css
lines: [1, 15]
function: "\".card\""
difficulty: 2
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

記事の一部や要点をまとめて囲むための `.card` クラスの定義です。背景色、角丸、内側の余白、薄い影で、箱が本文から浮いて見えるようにします。中にある最後の段落の下の余白や、ヘッダーの余白も、カードの中できちんと整えています。

## コード

```css:line-numbers=1
.card {
  padding: 1rem 2rem;
  border-radius: 4px;
  background: var(--bg-color);
  box-shadow: 0 1px 3px var(--color-grey);
}

.card p:last-child {
  margin: 0;
}

.card header > * {
  margin-top: 0;
  margin-bottom: 1rem;
}
```

## 前提知識

- **box-shadow**: 要素の周りに影を描くプロパティです。`0 1px 3px` は、下に 1px ずれて 3px ぼかした影です。
- **:last-child**: 親の中で最後の子要素に一致する疑似クラスです。
- **header 要素**: 見出しなどをまとめる HTML 要素です。
- **角丸（border-radius）**: 角を丸くするプロパティです。`4px` は、わずかに丸い角です。

## 何をしているか

### 1. 箱の外観

```css:line-numbers=2
  padding: 1rem 2rem;
  border-radius: 4px;
  background: var(--bg-color);
  box-shadow: 0 1px 3px var(--color-grey);
```

`padding: 1rem 2rem` で、上下と左右に余白を取ります。`border-radius: 4px` で角を少し丸め、背景色はテーマの変数から取ります。`box-shadow` で、箱の下側に薄い影を付けて、本文から浮かせます。

### 2. 中の余白を整える

```css:line-numbers=8
.card p:last-child {
  margin: 0;
}

.card header > * {
  margin-top: 0;
  margin-bottom: 1rem;
```

カードの最後の段落の下の余白を 0 にして、箱の下の余白が二重にならないようにします。ヘッダーの子要素は、上の余白を 0 にして、下に 1rem だけ残します。カードの中の見出しと文章の間隔が、箱の中で自然に揃います。

## ここがすごい

- 外側の箱の余白と、中の段落の余白が重なる問題を、最後の段落だけ消すという一行で解決しています。
- 影の色に変数を使うので、テーマの色の変更に合わせて、影の色も変わります。
- 素直に、カードの中のすべての段落の余白を消すと、途中の段落の間隔まで失われます。`:last-child` に絞ることで、この問題を避けています。
- ヘッダーの中の余白も、同じブロックでまとめて扱われています。

## まとめ

- `box-shadow` と `border-radius` で、箱を本文から浮かせられます。
- 最後の段落の余白をゼロにすると、箱の下の余白が二重になりません。
- 内側の要素の余白は、箱の中の関係として整えます。
