---
title: "等幅フォントの大きさを本文にそろえる"
description: "code・kbd・samp・pre にまとめて等幅フォントを当て、font-size を 1em にそろえる。ブラウザごとに違うコードの文字サイズを揃えるルール。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [72, 84]
function: "\"code, kbd, samp, pre\""
difficulty: 1
format: 2
tags: [移植性, 標準ライブラリ]
---
## ひとことで

インラインのコード（`code`）、キーボード入力（`kbd`）、出力例（`samp`）、整形済みのブロック（`pre`）に、同じ等幅フォントの候補リストを当てます。そして `font-size: 1em` を指定して、これらの文字の大きさを周りの本文と同じ基準にそろえます。

## コード

```css:line-numbers=72
code,
kbd,
samp,
pre {
	font-family:
		ui-monospace,
		SFMono-Regular,
		Consolas,
		'Liberation Mono',
		Menlo,
		monospace; /* 1 */
	font-size: 1em; /* 2 */
}
```

## 前提知識

- **等幅フォント（monospace）**: 文字の幅がすべて同じフォントです。コードの桁がそろって見えるので、プログラミングのドキュメントで使われます。
- **em 単位**: 現在の要素の文字サイズを 1 とする単位です。`1em` は親要素と同じ大きさになります。
- **pre 要素**: 改行や空白をそのまま表示する HTML 要素です。コードのブロックによく使われます。
- **kbd と samp**: それぞれキーボードの入力と、プログラムの出力例を示すための HTML 要素です。

## 何をしているか

### 1. 等幅フォントの候補を並べる

```css:line-numbers=76
	font-family:
		ui-monospace,
		SFMono-Regular,
		Consolas,
		'Liberation Mono',
		Menlo,
		monospace; /* 1 */
```

先頭の `ui-monospace` は、ブラウザや OS が推奨する等幅フォントを表す新しい名前です。続く `SFMono-Regular`（macOS）、`Consolas`（Windows）、`Liberation Mono`、`Menlo` は、それぞれの OS で使える代表的な等幅フォントです。最後の `monospace` は、ここまでのどれも無いときの汎用の保険です。

### 2. 文字サイズを 1em にそろえる

```css:line-numbers=83
	font-size: 1em; /* 2 */
```

`font-size: 1em` は「親の文字サイズをそのまま使う」という意味です。ブラウザの既定の `pre` や `code` は、等幅フォントを本文より小さめに表示する設定を持っています。その設定をリセットして、本文と同じ基準から始めるのがこの行の役目です。

## ここがすごい

- 4 つの要素を 1 つのセレクタにまとめているので、同じフォントの候補を二度書かずに済みます。
- `ui-monospace` を先頭に置く書き方は、OS ごとに適切な等幅フォントを選ばせるための工夫です。フォント名を決め打ちするより、各環境で自然な見た目になります。
- 素直に `code { font-family: monospace; }` と書くと、`monospace` は環境によって大きさが違うフォントになることがあります。`1em` で大きさを基準にそろえておくと、本文の中で浮いて見えにくくなります。
- 大きさの指定は「1em」というひとつの値だけなので、読む人が迷いません。コメントで `/* 2 */` とだけ書かれているのも、この行が「大きさの補正」だと示すための工夫です。

## まとめ

- 等幅フォントは、候補リストで OS ごとに適したものを選ばせます。
- `monospace` のような汎用名をリストの最後に置いて保険にします。
- `font-size: 1em` で、等幅の文字を本文と同じ基準にそろえます。
- 複数の要素にまとめて指定すると、同じ設定の書き間違いを減らせます。
