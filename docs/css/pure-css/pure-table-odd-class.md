---
title: "奇数行を .pure-table-odd のクラスで色付けする"
description: "Pure CSS の .pure-table-odd td は、クラスを付けた行のセルに背景色を付ける。古いブラウザでも動くように、nth-child を使わずに縞を作るための方法。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/tables/css/tables.css
lines: [41, 43]
function: "\".pure-table-odd td\""
difficulty: 1
format: 2
tags: [移植性, 設計パターン]
---
## ひとことで

奇数番目の行に `pure-table-odd` というクラスを手で付けて、その行のセルに背景色を付けるルールです。`nth-child` が使えない古いブラウザでも、縞模様を作れる方法です。

## コード

```css:line-numbers=41
.pure-table-odd td {
    background-color: #f2f2f2;
}
```

## 前提知識

- **pure-table-odd**: 行のクラスとして付ける独自のクラス名です。HTML を書く人が、奇数行に付けます。
- **td**: 表のセルです。
- **nth-child**: 番号で子要素を選ぶ疑似クラスです。古いブラウザでは使えないことがあります。
- **背景色**: セルの背景の色です。

## 何をしているか

### 1. 行のクラスで背景色を付ける

```css:line-numbers=41
.pure-table-odd td {
    background-color: #f2f2f2;
}
```

`.pure-table-odd td` は、`pure-table-odd` のクラスを持つ行の中の `td` に背景色を付けます。色は `#f2f2f2` の薄い灰色です。

## ここがすごい

- 縞の仕組みを、HTML のクラスで決めるので、どのブラウザでも確実に動きます。
- 前の記事の `nth-child` と、この記事のクラスは、同じ見た目を別の方法で作ります。古い環境と新しい環境で、使い分けられます。
- 素直に、行ごとに色を書くと、同じ色を何度も書くことになります。クラスにまとめると、色の変更は一か所です。
- 行の追加のたびに、クラスを付ける手間が増えるのが弱点です。データが多い表では、`nth-child` の方が楽です。

## まとめ

- クラスを付けた行のセルに、背景色を付けられます。
- `nth-child` が使えない環境では、クラスで縞を作れます。
- 方法ごとに利点があるので、表の性質で使い分けます。
