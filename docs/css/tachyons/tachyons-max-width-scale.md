---
title: "最大の幅を段階の名前で決める"
description: "Tachyons の .mw1 から .mw8 は max-width を 1rem から 64rem まで段階的に決める。幅の上限を数値で覚えずに、名前で選べる幅の決まり。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_max-widths.css
lines: [38, 45]
function: "\".mw1 … .mw8\""
difficulty: 1
format: 2
tags: [レイアウト, レスポンシブ]
---
## ひとことで

Tachyons の `.mw1` から `.mw8` までは、要素の幅の上限を段階で選べるクラスです。本文の幅や、カードの幅を、数値を覚えずに揃えられます。

## コード

```css:line-numbers=38
.mw1  {  max-width: 1rem; }
.mw2  {  max-width: 2rem; }
.mw3  {  max-width: 4rem; }
.mw4  {  max-width: 8rem; }
.mw5  {  max-width: 16rem; }
.mw6  {  max-width: 32rem; }
.mw7  {  max-width: 48rem; }
.mw8  {  max-width: 64rem; }
```

## 前提知識

- **max-width**: 幅の上限です。要素は、親の幅が広くても、この値より広がりません。
- **rem**: ルートの文字の大きさを基準にした単位です。ページ全体の文字の大きさを変えると、幅も比例して変わります。
- **段階**: 1 から 8 までは、幅が二倍ほどずつ広がるように並べられています。

## 何をしているか

### 1. 小さい段階

```css:line-numbers=38
.mw1  {  max-width: 1rem; }
.mw2  {  max-width: 2rem; }
.mw3  {  max-width: 4rem; }
```

mw1 から mw3 までは、1rem から 4rem の狭い幅です。アイコンや小さな箱の幅の上限に使えます。

### 2. 大きい段階

```css:line-numbers=41
.mw4  {  max-width: 8rem; }
.mw5  {  max-width: 16rem; }
.mw6  {  max-width: 32rem; }
.mw7  {  max-width: 48rem; }
.mw8  {  max-width: 64rem; }
```

mw4 から mw8 までは、8rem から 64rem の広い幅です。カードや本文の幅を、読みやすい長さに抑えられます。

## ここがすごい

幅の上限を段階で表すため、デザインの指示が、そのままクラスの名前になります。数字の大きさで、およその広さも想像できます。

幅の上限を決めておくと、画面が広がっても、中身が際限なく伸びることを防げます。本文の読みやすさを保つには、一行の長さを抑えることが大切です。段階を名前で持っておけば、部品ごとに適切な上限を、迷わず選べます。rem を基準にしているため、ページの文字の大きさを変えたときも、幅が比例して調整されます。

## まとめ

幅の段階を名前で決めると、部品の大きさを、役割に合わせて素早く選べます。
