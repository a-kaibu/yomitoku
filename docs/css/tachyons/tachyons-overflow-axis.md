---
title: "縦と横の はみ出し を別々に決める"
description: "Tachyons は overflow-x と overflow-y を別のクラスとして用意し、横だけ隠す、縦だけ流す、といった組み合わせを一つの指定で切り替える。はみ出しの扱いを軸ごとに決める方法。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_overflow.css
lines: [17, 20]
function: "\".overflow-x-visible, .overflow-x-hidden, .overflow-x-scroll, .overflow-x-auto\""
difficulty: 2
format: 2
tags: [レイアウト, レスポンシブ]
---
## ひとことで

Tachyons の `overflow-x-*` のクラスは、横方向にはみ出した部分をどう扱うかを決めます。縦と横を別々に指定できるため、表だけ横スクロールさせる、といった使い方ができます。

## コード

```css:line-numbers=17
.overflow-x-visible { overflow-x: visible; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-x-scroll { overflow-x: scroll; }
.overflow-x-auto { overflow-x: auto; }
```

## 前提知識

- **overflow**: 箱の中に入りきらない内容を、どう扱うかを決めるプロパティです。
- **visible・hidden・scroll・auto**: はみ出しを見せる、隠す、常にスクロールバーを出す、必要なときだけ出す、という四つの扱いです。
- **軸**: 横方向は x、縦方向は y です。overflow-x は横だけを決めます。

## 何をしているか

### 1. 横の扱いを選ぶ

```css:line-numbers=17
.overflow-x-visible { overflow-x: visible; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-x-scroll { overflow-x: scroll; }
.overflow-x-auto { overflow-x: auto; }
```

四つのクラスは、横方向のはみ出しの扱いだけを変えます。縦は、そのまま別の指定に任せられます。

## ここがすごい

縦と横を分けて書けるので、横だけ隠して縦は伸ばす、といった組み合わせが一行ずつで作れます。全体の overflow と併用すると、より細かな指定になります。

横だけ隠すと、表やコードの長い行は横に切れますが、縦はそのまま流れます。逆に縦だけを隠すと、高さの決まった箱の中で文字が切れます。二つのクラスを別々に持てるので、用途に応じて必要な軸だけを選べます。どちらも、スクロールを許すかどうかをはっきり決めるための道具です。

## まとめ

overflow-x と overflow-y を分けると、はみ出しの扱いを軸ごとに決められます。
