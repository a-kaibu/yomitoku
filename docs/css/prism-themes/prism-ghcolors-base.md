---
title: "GitHub 風の明るいコードブロックの基礎"
description: "Prism の GHColors テーマは、GitHub の色分けに近い明るい表示を、文字色、等幅フォント、0.9em の大きさ、1.2em の行の高さで土台にする。白い背景で読みやすいコードの決まり。"
language: css
project: undefined
repo: https://github.com/PrismJS/prism-themes
license: MIT
copyright: "\"Copyright (c) 2015 PrismJS\""
commit: "447479fc7b2be2051fe27e561aceed7cc87a589f"
file: themes/prism-ghcolors.css
lines: [6, 16]
function: "\"code[class*=\\\"language-\\\"], pre[class*=\\\"language-\\\"]\""
difficulty: 2
format: 2
tags: [配色, 可読性]
---
## ひとことで

Prism の GHColors テーマは、GitHub の表示に近い明るい色分けを、白い背景の上で見せるための土台です。文字の色と大きさ、行の高さを、コードの箱に与えます。

## コード

```css:line-numbers=6
code[class*="language-"],
pre[class*="language-"] {
	color: #393A34;
	font-family: "Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace;
	direction: ltr;
	text-align: left;
	white-space: pre;
	word-spacing: normal;
	word-break: normal;
	font-size: .9em;
	line-height: 1.2em;
```

## 前提知識

- **GitHub の色分け**: GitHub がコードを表示する、明るい背景の配色です。見慣れた色にすることで、読み手がすぐ馴染めます。
- **font-size: .9em**: 周りの文字より少し小さくする指定です。コードの塊が、本文より控えめに見えます。
- **line-height: 1.2em**: 行と行の間隔を文字の大きさの 1.2 倍にする指定です。行が詰まって見えやすい点に注意が必要です。
- **direction: ltr**: 文字の並ぶ向きを左から右にする指定です。

## 何をしているか

### 1. 文字の色と書体

```css:line-numbers=8
	color: #393A34;
	font-family: "Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace;
```

本文より濃い灰緑の文字色と、等幅のフォントを指定します。白い背景で、コードが見やすくなります。

### 2. 大きさと行の高さ

```css:line-numbers=15
	font-size: .9em;
	line-height: 1.2em;
```

文字を 0.9 倍にし、行の高さを 1.2 にします。本文より小さな箱として、コードが一目で区別されます。

### 3. 空白の扱い

```css:line-numbers=12
	white-space: pre;
	word-spacing: normal;
	word-break: normal;
```

改行を保持し、語の間の空白を正確に残します。字下げや表の桁を、そのまま見せるための指定です。

## ここがすごい

大きさを em で決めているので、親の文字サイズが変わっても、コードの相対的な大きさが保たれます。

## まとめ

白い背景のテーマは、文字の大きさと行の高さを先に決めると、読みやすさの土台ができます。
