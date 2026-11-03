---
title: "OS 標準のフォントをページ全体に当てる書き方"
description: "system-ui を先頭に置いたフォントの候補リストと、行の高さ・タブ幅をまとめて指定する html 要素のルール。ブラウザ間の見た目のばらつきを減らす。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [25, 38]
function: "html"
difficulty: 1
format: 2
tags: [移植性, 標準ライブラリ]
---
## ひとことで

`html` 要素に、OS が使っている UI フォントを優先するフォントの候補リストを設定します。あわせて行の高さ、文字サイズの自動調整、タブの幅もここでまとめて決めています。フォントの指定は `html` に書いておけば、`body` 以下のすべての要素が継承して同じ見た目になります。

## コード

```css:line-numbers=25
html {
	font-family:
		system-ui,
		'Segoe UI',
		Roboto,
		Helvetica,
		Arial,
		sans-serif,
		'Apple Color Emoji',
		'Segoe UI Emoji'; /* 1 */
	line-height: 1.15; /* 2 */
	-webkit-text-size-adjust: 100%; /* 3 */
	tab-size: 4; /* 4 */
}
```

## 前提知識

- **font-family**: 文字に使うフォントを、優先順に並べたリストで指定するプロパティです。ブラウザは左から順に、手元にあるフォントを使います。
- **system-ui**: 「その OS が画面の UI に使うフォント」を指す汎用の名前です。Windows では Segoe UI、macOS では San Francisco などに対応します。
- **汎用フォントファミリ**: `sans-serif` や `monospace` のように、フォント名ではなく「ゴシック体」「等幅」などの種類を表す名前です。リストの最後に置くと、それまでのフォントが無いときの保険になります。
- **line-height**: 行の高さを、文字サイズに対する倍率で指定するプロパティです。`1.15` は文字サイズの 1.15 倍の高さです。
- **tab-size**: 文字 `\t`（タブ）を何文字分の幅で表示するかを決めるプロパティです。

## 何をしているか

### 1. OS の UI フォントを先頭に置く

```css:line-numbers=26
	font-family:
		system-ui,
		'Segoe UI',
		Roboto,
		Helvetica,
		Arial,
		sans-serif,
		'Apple Color Emoji',
		'Segoe UI Emoji'; /* 1 */
```

リストの先頭は `system-ui` です。これにより、そのページを見ている人の OS が使っている UI フォントが最初に選ばれます。Windows なら Segoe UI、macOS ならシステムのフォントになるので、ページが OS のボタンやメニューと馴染みやすくなります。

`Segoe UI` や `Roboto`、`Helvetica`、`Arial` は、`system-ui` が使えない古いブラウザへの保険として並んでいます。最後の `sans-serif` は、ここまでのどれも無い場合にゴシック体を使わせるための汎用フォントです。

絵文字は `'Apple Color Emoji'` と `'Segoe UI Emoji'` を末尾に置いています。文字用のフォントに絵文字が無いときだけ、これらの絵文字フォントが使われます。

### 2. 行の高さと文字サイズの調整

```css:line-numbers=35
	line-height: 1.15; /* 2 */
	-webkit-text-size-adjust: 100%; /* 3 */
	tab-size: 4; /* 4 */
```

`line-height: 1.15` は、行間を少し詰めた値です。`-webkit-text-size-adjust: 100%` は、iPhone などで画面を横向きにしたときに、ブラウザが文字を勝手に大きくするのを止めます。`tab-size: 4` は、タブを 4 文字分の幅で表示させます。コードを表示する `pre` 要素などでタブの見た目が揃いやすくなります。

## ここがすごい

- フォントを `html` に 1 回だけ書けば、すべての要素が継承します。どの要素にも書く必要がありません。
- 候補リストの順番に意味があります。最新の `system-ui` から始めて、古い環境の既定フォントに落ちていく構造になっています。
- コメント番号の `/* 1 */` `/* 2 */` `/* 3 */` `/* 4 */` が、それぞれのプロパティがどの目的かを示しています。何のための行なのかが、後からコードを読む人にも伝わります。
- 素直に書くと、`font-family: Arial, sans-serif;` のように決め打ちのフォントになりがちです。そうすると OS ごとに見た目が大きく変わってしまいます。システムのフォントを先に使うことで、各 OS で自然な見た目になります。

## まとめ

- `font-family` は左から順に、手元にあるフォントを使うリストです。
- `system-ui` を先頭に置くと、その OS の UI フォントを使えます。
- 汎用フォントファミリをリストの最後に置いて、保険にします。
- `html` に書いて継承させると、ページ全体の基本の見た目を 1 か所で決められます。
