---
title: "details の見出し summary に行のマーカーを戻す"
description: "summary の display を list-item にして、開閉できる見出しの前に箱のマーカーを表示させる。Chrome と Safari での表示の違いを揃える。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [221, 223]
function: "summary"
difficulty: 2
format: 2
tags: [移植性]
---
## ひとことで

`summary` 要素の `display` を `list-item` にするルールです。`summary` は `details` 要素（開閉できるブロック）の見出しを表します。`list-item` にすると、見出しが「リストの項目」として描かれ、Chrome と Safari で同じように見えるようになります。

## コード

```css:line-numbers=221
summary {
	display: list-item;
}
```

## 前提知識

- **details 要素**: 中身を開いたり閉じたりできる HTML 要素です。`summary` は、閉じたときに見える見出しです。
- **display**: 要素を箱としてどう扱うかを決めるプロパティです。`block`（ブロック）、`inline`（インライン）、`list-item`（リストの項目）などがあります。
- **list-item**: リストの項目として描く値です。項目の前に、丸や数字などのマーカーを付けられます。
- **ブラウザの既定の見た目**: ブラウザが持つ最初からの描き方です。`summary` は、ブラウザごとに描き方が違うことがあります。

## 何をしているか

### 1. summary をリストの項目として描く

```css:line-numbers=221
summary {
	display: list-item;
}
```

`display: list-item` は、`summary` を「リストの項目」として描くように指定します。コメントにあるとおり、この指定によって Chrome と Safari での表示をそろえます。

これにより、ブラウザが描く見出しの前の部分（マーカーなど）が、両方で同じ扱いになります。

## ここがすごい

- 1 行だけで、ブラウザごとの表示の差を解消しています。細かい部分にまで気を配った、典型的なリセットの書き方です。
- `summary` は、ブラウザによって表示の仕組みが大きく違う要素です。ここで決め打ちしておくと、後で見た目を作るときに、差を気にせず済みます。
- 素直に書くなら、`details` の見た目を作るときに、ブラウザごとの違いを確認して調整します。その手間を、この 1 行が代わりに引き受けています。
- `display` の値をやめて、すべてを `block` に変えるような方法もあります。ただしそうすると、開閉の矢印などの表示が消える場合があります。

## まとめ

- `summary` は `details` の見出しを表す要素です。
- `display: list-item` を指定すると、見出しが項目として描かれます。
- ブラウザごとの表示の差を、1 行で揃えられます。
- 既定の表示を理解して、必要な部分だけを上書きするのが、リセットの基本です。
