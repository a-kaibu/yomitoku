---
title: "横のメニュー項目を中央にそろえる"
description: "Pure CSS は .pure-menu-horizontal の項目、見出し、区切りを inline-block にし、vertical-align: middle で縦の中央にそろえる。項目の高さが違っても、一本の線に並ぶ。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/menus/css/menus-horizontal.css
lines: [12, 16]
function: "\".pure-menu-horizontal の item・heading・separator\""
difficulty: 2
format: 2
tags: [レイアウト]
---
## ひとことで

Pure CSS は、横並びメニューの項目、見出し、区切り線を、同じ inline-block の箱として扱います。項目の高さがそろうように、縦の中央にそろえています。

## コード

```css:line-numbers=12
.pure-menu-horizontal .pure-menu-item,
.pure-menu-horizontal .pure-menu-heading,
.pure-menu-horizontal .pure-menu-separator {
    display: inline-block;
    vertical-align: middle;
```

## 前提知識

- **pure-menu-item**: メニューの一つ一つの項目を表すクラスです。
- **vertical-align: middle**: 行の中で、要素の中央を行の中央にそろえる指定です。高さの違う項目が並んでも、真ん中の線がそろいます。
- **区切り (separator)**: 項目どうしを分ける、細い線や点を表す部品です。項目と同じ列に並べると、見た目が揃います。

## 何をしているか

### 1. 項目を横の箱にする

```css:line-numbers=14
.pure-menu-horizontal .pure-menu-separator {
    display: inline-block;
```

項目、見出し、区切りを inline-block にします。三つの部品が、同じ一行の中で並ぶようになります。

### 2. 縦の中央にそろえる

```css:line-numbers=16
    vertical-align: middle;
```

vertical-align: middle で、三つの部品を縦の中央にそろえます。文字の大きさが違う項目があっても、見た目のずれが少なくなります。

## ここがすごい

三つのクラスを一つのセレクタにまとめ、同じ規則で並べています。項目を追加しても、区切りを挟んでも、一行の高さが揃います。

この三つの部品は、どれも同じ高さの帯の中で並ぶ必要があります。もし見出しだけ別の高さになると、メニュー全体が上下に波打って見えます。ここでは三つを同じ箱の仲間として扱うことで、そうした波を防いでいます。区切り線を入れる場合も、同じ規則に従うだけで、自然に並びが整います。

## まとめ

inline-block と vertical-align: middle を組み合わせると、横並びの項目が、中央で揃ったメニューになります。
