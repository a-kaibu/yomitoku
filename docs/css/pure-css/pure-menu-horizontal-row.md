---
title: "横並びのメニューを一行の幅いっぱいにする"
description: "Pure CSS の .pure-menu-horizontal は、幅 100% と white-space: nowrap でメニュー全体を一行にし、中の一覧を inline-block にして横に並べる。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/menus/css/menus-horizontal.css
lines: [2, 9]
function: "\".pure-menu-horizontal\""
difficulty: 2
format: 2
tags: [レイアウト]
---
## ひとことで

Pure CSS の `.pure-menu-horizontal` は、ナビゲーションのメニューを横一列に並べるための指定です。縦に積まれていた項目を、一行の中に収めます。

## コード

```css:line-numbers=2
.pure-menu-horizontal {
    width: 100%;
    white-space: nowrap;
}

.pure-menu-horizontal .pure-menu-list {
    display: inline-block;
}
```

## 前提知識

- **inline-block**: 文字と同じ行に並ぶ箱です。前後の要素と並べられますが、空白が間に入ることがあります。
- **white-space: nowrap**: 改行しない指定です。項目が長くても、横一列のまま続きます。
- **幅 100%**: 親の幅いっぱいに広げる指定です。メニューの背景などを、画面の端まで伸ばせます。

## 何をしているか

### 1. 全体を一行にする

```css:line-numbers=3
    width: 100%;
    white-space: nowrap;
```

メニュー全体を幅いっぱいに広げ、改行を禁止します。中の項目が次の行に落ちないようにしています。

### 2. 一覧を横に並べる

```css:line-numbers=7
.pure-menu-horizontal .pure-menu-list {
    display: inline-block;
```

内側の一覧 ul を inline-block にして、一行の中に収めます。ul 自体の縦方向の並びが、横並びに変わります。

## ここがすごい

HTML の構造を変えずに、縦のリストを横のナビゲーションに変えられます。項目の数が増えても、同じ書き方で続けられます。

横並びにすると、項目の数が多い場合は一行に収まらなくなる可能性もあります。その場合は、折り返さない指定が、項目を画面の外へ押し出す形になります。Pure は、メニューを一行に保つことを優先し、必要に応じて利用者が幅を調整する前提で作っています。小さな画面では、縦並びのメニューへの切り替えを別に考える必要があります。

## まとめ

幅と nowrap と inline-block を組み合わせると、リストが横並びのメニューになります。
