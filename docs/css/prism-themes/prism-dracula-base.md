---
title: "暗い色のコードブロックの基本の色と文字"
description: "Prism の Dracula テーマは、code と pre に文字色、等幅フォント、行の高さ、タブ幅をまとめて与える。コードが読みやすい暗い箱になる、基礎の決まり。"
language: css
project: undefined
repo: https://github.com/PrismJS/prism-themes
license: MIT
copyright: "\"Copyright (c) 2015 PrismJS\""
commit: "447479fc7b2be2051fe27e561aceed7cc87a589f"
file: themes/prism-dracula.css
lines: [8, 19]
function: "\"code[class*=\\\"language-\\\"], pre[class*=\\\"language-\\\"]\""
difficulty: 2
format: 2
tags: [配色, 可読性]
---
## ひとことで

Prism の Dracula テーマは、コードの表示に共通する基礎を、`code` と `pre` の両方に与えています。色や字間を決めるので、どの言語の色分けも、同じ土台の上に乗ります。

## コード

```css:line-numbers=8
code[class*="language-"],
pre[class*="language-"] {
	color: #f8f8f2;
	background: none;
	text-shadow: 0 1px rgba(0, 0, 0, 0.3);
	font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
	text-align: left;
	white-space: pre;
	word-spacing: normal;
	word-break: normal;
	word-wrap: normal;
	line-height: 1.5;
```

## 前提知識

- **Prism**: コードを色分けする、軽量なライブラリです。コードの各部分に、種類を表すクラスを付けます。
- **language-***: Prism が言語を判断して付けるクラスです。このセレクタは、そのクラスを持つ要素だけを選びます。
- **等幅フォント**: 文字の幅がそろったフォントです。コードの字下げや桁が、縦にそろって見えます。
- **tab-size**: タブ文字を何文字分の幅で表示するかを決めます。ここでは 4 文字です。

## 何をしているか

### 1. 文字の色と書体

```css:line-numbers=10
	color: #f8f8f2;
	background: none;
	text-shadow: 0 1px rgba(0, 0, 0, 0.3);
	font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
```

文字色を明るい色にし、等幅のフォントを並べています。暗い背景の上でも、読める文字になります。

### 2. 行と空白の扱い

```css:line-numbers=14
	text-align: left;
	white-space: pre;
	word-spacing: normal;
	word-break: normal;
	word-wrap: normal;
	line-height: 1.5;
```

左寄せ、空白の保持、行の高さ 1.5 を決めています。長い行をどう折り返すかも、ここで決まります。

### 3. タブの幅

```css:line-numbers=20
	-moz-tab-size: 4;
	-o-tab-size: 4;
	tab-size: 4;
```

タブ幅を 4 にしています。ブラウザごとの既定の幅に頼らず、どの環境でも字下げがそろいます。

## ここがすごい

セレクタを `code` と `pre` にまとめているので、インラインのコードと、ブロックのコードが同じ書体で表示されます。テーマの色を変えるときも、この土台は変えずに済みます。

## まとめ

基礎の書体と行間を一か所に決めると、色分けのルールが、読みやすい箱の中で働きます。
