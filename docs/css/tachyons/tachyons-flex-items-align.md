---
title: "交差する軸の揃え方を五つの名前で選ぶ"
description: "Tachyons の .items-* は align-items を start・end・center・baseline・stretch に決め、flex の項目を交差する軸でそろえる。上揃え、中央揃え、下揃えの切り替えを一行で行う指定。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_flexbox.css
lines: [33, 37]
function: "\".items-start, .items-end, .items-center, .items-baseline, .items-stretch\""
difficulty: 2
format: 2
tags: [レイアウト]
---
## ひとことで

Tachyons の `.items-*` は、flex の項目を、交差する方向でどう揃えるかを決めます。上、下、中央、文字の基準線、伸縮のどれかを、クラスの名前で選べます。

## コード

```css:line-numbers=33
.items-start    { align-items: flex-start; }
.items-end      { align-items: flex-end; }
.items-center   { align-items: center; }
.items-baseline { align-items: baseline; }
.items-stretch  { align-items: stretch; }
```

## 前提知識

- **交差する軸**: flex の主軸と直角の方向です。横並びなら縦方向、縦並びなら横方向になります。
- **align-items**: 交差する軸で、項目をどう置くかを決めるプロパティです。
- **baseline**: 文字の基準線をそろえる指定です。大きさの違う文字が並んでも、文字の底がそろいます。
- **stretch**: 項目を、交差する軸の全体まで伸ばす指定です。

## 何をしているか

### 1. 端に寄せる

```css:line-numbers=33
.items-start    { align-items: flex-start; }
.items-end      { align-items: flex-end; }
```

start は交差する軸の始点、end は終点に寄せます。上に揃えるか、下に揃えるかを選べます。

### 2. 中央と基準線

```css:line-numbers=35
.items-center   { align-items: center; }
.items-baseline { align-items: baseline; }
```

center は中央に、baseline は文字の基準線にそろえます。ボタンと文字が並ぶ行で、底がそろうのに役立ちます。

### 3. 伸ばす

```css:line-numbers=37
.items-stretch  { align-items: stretch; }
```

stretch は、項目を交差する軸いっぱいに伸ばします。高さをそろえたカードの並びに向いています。

## ここがすごい

五つの揃え方を、同じ形の名前で並べているため、必要なものを素早く選べます。flex の複雑な仕様を、一行で扱える形にしています。

高さの違うカードや、大きさの違う文字が並ぶ行では、揃え方がそのまま見た目の印象になります。上揃えは文章の始まりをそろえ、中央揃えは一つの塊を中心に置きます。baseline は、文字の基準線をそろえて、読み手の視線が横にすっと流れるようにします。用途に応じて、五つの中から一つを選ぶ感覚で使えます。

## まとめ

交差する軸の揃え方をクラスで選ぶと、高さの違う項目を、目的に合わせてそろえられます。
