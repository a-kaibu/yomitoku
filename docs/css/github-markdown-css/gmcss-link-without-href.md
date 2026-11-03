---
title: "href のないリンクを普通の文字に戻す"
description: ".markdown-body の a:not([href]) で、リンク先を持たない a 要素の色と下線を消し、文字色を継承させる。アンカーの名前だけを残したときに、青い文字が出るのを防ぐ。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [526, 529]
function: "\".markdown-body a:not([href])\""
difficulty: 1
format: 2
tags: [防御的プログラミング, 可読性]
---
## ひとことで

`href` 属性を持たない `a` 要素の見た目を、普通の文字に戻すルールです。`a` 要素は、`href` があるとリンクになりますが、名前だけの `a`（ページ内の目印）は、リンクではありません。そのため、ブラウザの既定の青い文字や下線を消します。

## コード

```css:line-numbers=526
.markdown-body a:not([href]) {
  color: inherit;
  text-decoration: none;
}
```

## 前提知識

- **a 要素**: リンクを表す HTML 要素です。`href` 属性でリンク先を指定します。
- **:not([href])**: `href` 属性がない要素に一致する疑似クラスです。
- **アンカー（目印）**: ページの中の場所に名前を付けるための `a` 要素の使い方です。`href` を持たず、移動はしません。
- **text-decoration**: 文字の下線などを決めるプロパティです。

## 何をしているか

### 1. 文字色を親から受け継ぐ

```css:line-numbers=527
  color: inherit;
```

`color: inherit` は、周りの文字の色をそのまま使う指定です。ブラウザの既定のリンクの色を消します。

### 2. 下線を消す

```css:line-numbers=528
  text-decoration: none;
```

`text-decoration: none` で、リンクの下線を消します。リンクではない `a` は、クリックもできないので、下線で示す必要がありません。

## ここがすごい

- 「リンクらしい見た目は、href があるときだけ」という条件を、セレクタに書いています。HTML の意味と見た目が一致します。
- 色と下線の二つを消すことで、アンカーの名前が本文の中で目立つことを防いでいます。
- 素直に `a { color: inherit; }` と書くと、href を持つ本物のリンクまで、普通の文字になってしまいます。否定の条件で、対象を分けるのが要点です。
- 見出しの横に付けるアンカーのリンクなど、Markdown が生成する目印の要素にも、この規則が効いています。

## まとめ

- `:not([href])` で、リンクではない `a` だけを選べます。
- 色と下線を消すと、名前だけの `a` が本文に溶け込みます。
- 対象を否定の条件で絞ると、本物のリンクには影響しません。
