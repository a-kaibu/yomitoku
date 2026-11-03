---
title: "インラインのコードとブロックの背景を分ける"
description: "Prism の Dracula テーマは、文の中の code には余白と角丸を付け、pre と code の背景色を同じ濃い色にそろえる。本文の中とコードブロックの見た目を、一つの色で統一する書き方。"
language: css
project: undefined
repo: https://github.com/PrismJS/prism-themes
license: MIT
copyright: "\"Copyright (c) 2015 PrismJS\""
commit: "447479fc7b2be2051fe27e561aceed7cc87a589f"
file: themes/prism-dracula.css
lines: [37, 40]
function: "\":not(pre) > code[class*=\\\"language-\\\"], pre[class*=\\\"language-\\\"]\""
difficulty: 2
format: 2
tags: [配色, レイアウト]
---
## ひとことで

Prism の Dracula テーマは、本文の中に入った `code` と、ブロックの `pre` に、同じ背景色を与えています。文の中でも、コードの塊でも、同じ暗い色で目立ちます。

## コード

```css:line-numbers=37
:not(pre) > code[class*="language-"],
pre[class*="language-"] {
	background: #282a36;
}
```

## 前提知識

- **:not(pre)**: `pre` の中ではない要素を選ぶ疑似クラスです。文の中の code だけを選べます。
- **背景色**: 要素の後ろに塗られる色です。コードの領域が、本文から切り分けて見えます。
- **white-space**: 空白と改行の扱いを決めます。`normal` は、通常の文章と同じく、折り返しを許します。

## 何をしているか

### 1. 背景色をそろえる

```css:line-numbers=37
:not(pre) > code[class*="language-"],
pre[class*="language-"] {
	background: #282a36;
}
```

インラインの code とブロックの pre を、同じ背景色でまとめて指定します。二つの書き方は、見た目が同じになるように設計されています。

### 2. 文の中のコードを整える

```css:line-numbers=43
:not(pre) > code[class*="language-"] {
	padding: .1em;
	border-radius: .3em;
	white-space: normal;
```

文の中のコードには、少しの余白と角丸を付けます。周りの文字と区別しつつ、行の流れを崩しません。

## ここがすごい

セレクタの否定で、同じプロパティを二つの場面に振り分けています。ブロック用と文中用を、ひとつのテーマの中で役割分担しています。

文の中のコードは、前後の文字と並ぶため、背景が同じ色だと境目が曖昧になることがあります。そこで、余白と角丸を付けて、箱として切り分けています。ブロックの pre と同じ色を使うことで、文の中でも、コードブロックでも、同じ暗い色として認識されます。テーマの色を変えるだけで、本文の中のコードも一緒に変わるという利点があります。

## まとめ

`:not(pre)` を使うと、文の中のコードと、コードブロックを、同じ色のまま別々に整えられます。
